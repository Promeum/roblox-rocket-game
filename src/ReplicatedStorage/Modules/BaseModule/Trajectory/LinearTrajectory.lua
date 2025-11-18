-- !strict

--[[
	TODO
	hasNextTrajectory
]]

local Vector3D = require("../../Libraries/Vector3D")
local Type = require("../../Type")
local Constructor = require("../../Constructor")
local Globals = require("../../../Globals")
local Trajectory = require(".")
local KinematicState = require("../Relative/State/KinematicState")
local TemporalState = require("../Relative/State/TemporalState")
local KinematicTemporalState = require("../KinematicTemporalState")

-- Internal type
type LinearTrajectory = Type.LinearTrajectoryEXTENSIBLE<LinearTrajectory,
		Type.TrajectoryEXTENSIBLE<LinearTrajectory,
				Type.BaseModuleEXTENSIBLE<LinearTrajectory
	>>>
	& Constructor.LinearTrajectoryEXTENSIBLE<LinearTrajectory>
	& {
	cache: {
		nextTrajectory: Type.OrbitalTrajectory | false | nil,
		nextTrajectoryDirection: "in" | false | nil,
		nextSOI: Type.GravityCelestial | false | nil
	}
}

local LinearTrajectory: LinearTrajectory = { __type = "LinearTrajectory" :: "LinearTrajectory" } :: any
local LinearTrajectoryMT = {}

-- Constructors

--[=[
	Creates a new LinearTrajectory instance.
]=]
function LinearTrajectory.new(
	kinematicState: Type.KinematicState,
	temporalState: Type.TemporalState
): LinearTrajectory
	return LinearTrajectory.fromPosition(KinematicTemporalState.new(kinematicState, temporalState))
end

--[=[
	Creates a new LinearTrajectory instance.
]=]
function LinearTrajectory.fromPosition(position: Type.KinematicTemporalState): LinearTrajectory
	local self: LinearTrajectory = table.clone(LinearTrajectory) :: any

	local metatable = table.clone(LinearTrajectoryMT)
	metatable.__index = Trajectory.fromPosition(position)

	setmetatable(self, metatable)

	return self
end

--[=[
	The quadratic formula, adjusted so it will work with kinematic vectors.
	Cannot be used with regular numbers as the coefficients 4 and 2 are not here.
]=]
function quadraticFormula(a: number, b: number, c: number): (number, number)
	return (
		(-b - math.sqrt(b^2 - a * c))
		/ a
	), (
		(-b + math.sqrt(b^2 - a * c))
		/ a
	)
end

--[=[
	Returns whether this LinearTrajectory leads into a new Trajectory (in a new SOI).

	@return true if there is a next Trajectory
]=]
function LinearTrajectory:hasNextTrajectory(): boolean
	-- check cache
	if self.cache.nextTrajectoryDirection ~= nil then
		return self.cache.nextTrajectoryDirection == "in"
	else -- calculate next trajectory
		if #Globals.rootGravityCelestials > 0 then
			local selfPosition: Type.KinematicTemporalState = self:getStartPosition():getKinematicState()
			local closestSOIEntryTime: number? = nil
			local closestCelestialSOI: Type.GravityCelestial

			-- calculate SOI entry for all root GravityCelestials
			for _, gravityCelestial in Globals.rootGravityCelestials do
				local otherPosition: Type.KinematicTemporalState = gravityCelestial.trajectory:getStartPosition():getKinematicState()

				assert(selfPosition:sameRelativeTree(otherPosition),
					"self and gravityCelestial start positions are not relative to the same thing")

				-- distance vector relative to self
				local distancePoint: Type.Vector3D = selfPosition:getPosition() - otherPosition:getPosition()
				local distanceVelocity: Type.Vector3D = selfPosition:getVelocity() - otherPosition:getVelocity()

				-- solve for time(s)
				local SOIEntryTimes: { number } = table.pack(quadraticFormula(
					distanceVelocity:Dot(distanceVelocity),
					distanceVelocity:Dot(distancePoint),
					distancePoint:Dot(distancePoint) - gravityCelestial:SOIRadius()
				))

				-- get first valid SOI entry time
				table.sort(SOIEntryTimes)
				local SOIEntryTime: number = if SOIEntryTimes[1] >= 0 then SOIEntryTimes[1] else SOIEntryTimes[2]

				-- set new closest (or keep current closest) SOI
				if SOIEntryTime == SOIEntryTime and SOIEntryTime < closestSOIEntryTime then -- nan check
					closestSOIEntryTime = SOIEntryTime
					closestCelestialSOI = gravityCelestial
				end
			end

			if closestSOIEntryTime then -- trajectory enters an SOI
				self.cache.nextTrajectory = self:atTime(closestSOIEntryTime)
				self.cache.nextTrajectoryDirection = "in"
				self.cache.nextSOI = closestCelestialSOI:SOIRadius()
			else -- trajectory misses all root GravityCelestial SOIs
				self.cache.nextTrajectory = false
				self.cache.nextTrajectoryDirection = false
				self.cache.nextSOI = false
			end
		else -- no root GravityCelestials exist (i.e. space is empty)
			self.cache.nextTrajectory = false
			self.cache.nextTrajectoryDirection = false
			self.cache.nextSOI = false
		end

		return self:hasNextTrajectory()
	end
end

--[=[
	Computes the location of closest approach of this and another LinearTrajectory in spacetime.
	https://www.desmos.com/3d/yx3fbrd41j

	@param trajectory The LinearTrajectory of the other body.
	@param searchTimeMin The minimum time to search.
	@param searchTimeMax The maximum time to search.

	@return The KinematicTemporalState representing the MOID position, pointing from self to other.
]=]
function LinearTrajectory:MOID(other: LinearTrajectory): Type.KinematicTemporalState
	local selfStartTemporal: Type.TemporalState = self:getStartPosition():getTemporalState()
	local selfStart: Type.KinematicState = self:getStartPosition()

	local otherStartTemporal: Type.TemporalState = other:getStartPosition():getTemporalState()
		:matchRelative(self:getStartPosition():getTemporalState())
	local otherAdjusted: LinearTrajectory = other:atTime(otherStartTemporal:getRelativeTime())
	local otherStart: Type.KinematicState = otherAdjusted:getStartPosition():getKinematicState()

	assert(selfStart:sameRelativeTree(otherStart), "relative trees different")

	local p1: Type.Vector3D = selfStart:getPosition()
	local p2: Type.Vector3D = otherStart:getPosition()
	local v1: Type.Vector3D = selfStart:getVelocity()
	local v2: Type.Vector3D = otherStart:getVelocity()

	-- time formula
	local resultMoidTime: number = - (p1 - p2):Dot(v1 - v2) / ((v1 - v2):Magnitude() ^ 2)
	-- difference between kinematics at MOID, relative to self
	local resultKinematic: Type.KinematicState = otherAdjusted:calculatePointFromTime(resultMoidTime)
		- self:calculatePointFromTime(resultMoidTime)

	return KinematicTemporalState.new(
		KinematicState.newFromKinematicState(resultKinematic, selfStart),
		TemporalState.newRelativeTime(resultMoidTime, selfStartTemporal)
	)
end

--[=[
	Calculates the point at which this LinearTrajectory will reach relativeTime seconds from now.
	Note: relativeTime can be negative.
]=]
function LinearTrajectory:calculatePointFromTime(relativeTime: number): Type.KinematicState
	local kinematicState: Type.KinematicState = self:getStartPosition():getKinematicState()

	-- Compute new position; velocity remains unchanged
	return KinematicState.new(
		kinematicState:getVelocity() * relativeTime,
		Vector3D.zero,
		kinematicState
	)
end

--[=[
	Calculates the time of closest approach to position.
	Note: Calculated time may be negative.
]=]
function LinearTrajectory:calculateTimeFromPoint(position: Type.Vector3D): number
	local startPosition: Type.KinematicTemporalState = self:getStartPosition()

	-- Transform position relative to this LinearTrajectory
	local transformedTargetPoint: Type.Vector3D = position - startPosition:getPosition()

	-- Find magnitude of the target point as if it was already projected to the velocity vector
	return transformedTargetPoint:Dot(startPosition:getVelocity())
end

--[=[
	Calculates the time at which this LinearTrajectory will be magnitude meters away from its current position.
	Note: magnitude, and calculated time, may be negative.
]=]
function LinearTrajectory:calculateTimeFromMagnitude(magnitude: number): number
	-- Magnitude(Velocity) => Speed (in units / second)
	return magnitude / self:getStartPosition():getVelocity():Magnitude()
end

return LinearTrajectory :: Constructor.LinearTrajectory

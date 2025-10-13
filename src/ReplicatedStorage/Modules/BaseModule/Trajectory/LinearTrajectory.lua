local ReplicatedStorage = game:GetService("ReplicatedStorage")
-- !strict

local KinematicState = require(ReplicatedStorage.Modules.BaseModule.Relative.State.KinematicState)
local TemporalState = require(ReplicatedStorage.Modules.BaseModule.Relative.State.TemporalState)
local Vector3D = require(ReplicatedStorage.Modules.Libraries.Vector3D)
local Type = require("../../Type")
local Constructor = require("../../Constructor")
local Trajectory = require(".")
-- local Constants = require("../../Constants")
-- local KinematicState = require("../Relative/State/KinematicState")
-- local TemporalState = require("../Relative/State/TemporalState")
local KinematicTemporalState = require("../KinematicTemporalState")

-- Internal type
type LinearTrajectory = Type.LinearTrajectoryEXTENSIBLE<LinearTrajectory,
		Type.TrajectoryEXTENSIBLE<LinearTrajectory,
				Type.BaseModuleEXTENSIBLE<LinearTrajectory
	>>>
	& Constructor.LinearTrajectoryEXTENSIBLE<LinearTrajectory>
	& {
	cache: {
		nextTrajectory: LinearTrajectory | false | nil,
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
	return LinearTrajectory.newFromKinematicTemporalState(KinematicTemporalState.new(kinematicState, temporalState))
end

--[=[
	Creates a new LinearTrajectory instance.
]=]
function LinearTrajectory.newFromKinematicTemporalState(kinematicTemporalState: Type.KinematicTemporalState): LinearTrajectory
	local self: LinearTrajectory = table.clone(LinearTrajectory) :: any

	local metatable = table.clone(LinearTrajectoryMT)
	metatable.__index = Trajectory.newFromKinematicTemporalState(kinematicTemporalState)

	setmetatable(self, metatable)

	return self
end

--[=[
	Returns whether this LinearTrajectory leads into a new Trajectory (in a new SOI).

	@return true if there is a next Trajectory
]=]
function LinearTrajectory:hasNextTrajectory(): boolean
	-- check cache
	local nextTrajectoryDirection: "in" | false | nil = self.cache.nextTrajectoryDirection
	local nextTrajectory: Type.TrajectoryEXTENSIBLE<any, any> | false | nil = self.cache.nextTrajectory

	if nextTrajectoryDirection ~= nil then
		return nextTrajectoryDirection == "in"
	else
		-- calculate

		return self:hasNextTrajectory()
	end
end

--[=[
	Computes the location of closest approach of this and another LinearTrajectory in spacetime.
	https://www.desmos.com/3d/yx3fbrd41j

	@param trajectory The LinearTrajectory of the other body.
	@param searchTimeMin The minimum time to search.
	@param searchTimeMax The maximum time to search.
]=]
function LinearTrajectory:minimumOrbitalIntersectionDistance(
	other: LinearTrajectory,
	searchTimeMin: number,
	searchTimeMax: number
): Type.KinematicTemporalState
	local selfStart: Type.KinematicState = self:getStartPosition()
	local otherStartTemporal: Type.TemporalState = other:getStartPosition():getTemporalState()
		:matchRelative(self:getStartPosition():getTemporalState())
	local otherStart: Type.KinematicState = other:atTime(otherStartTemporal:getRelativeTime())
		:getStartPosition():getKinematicState()
	
	assert(selfStart:sameRelativeTree(otherStart), "relative trees different")

	local p1: Type.Vector3D = selfStart:getPosition()
	local p2: Type.Vector3D = otherStart:getPosition()
	local v1: Type.Vector3D = selfStart:getVelocity()
	local v2: Type.Vector3D = otherStart:getVelocity()

	local MOIDTime: number = - (p1 - p2):Dot(v1 - v2) / ((v1 - v2):Magnitude() ^ 2)

	return self:calculatePositionFromTime(MOIDTime)
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
function LinearTrajectory:calculateTimeFromPoint(position: Type.Vector3D): Type.TemporalState
	local startPosition: Type.KinematicTemporalState = self:getStartPosition()

	-- Transform position relative to this LinearTrajectory
	local transformedTargetPoint: Type.Vector3D = position - self:getStartPosition():getPosition()

	-- Find magnitude of the target point as if it was already projected to the velocity vector
	return TemporalState.new(
		transformedTargetPoint:Dot(self:getStartPosition():getVelocity()),
		startPosition:getTemporalState()
	)
end

--[=[
	Calculates the time at which this LinearTrajectory will be magnitude meters away from its current position.
	Note: magnitude, and calculated time, may be negative.
]=]
function LinearTrajectory:calculateTimeFromMagnitude(magnitude: number): Type.TemporalState
	-- Magnitude(Velocity) => Speed (in units / second)
	return magnitude / self:getStartPosition():getVelocity():Magnitude()
end

return LinearTrajectory :: Constructor.LinearTrajectory

--!strict

--[[
	@TODO: minimumOrbitalIntersectionDistance (MOID)
]]

local Type = require("../Type")
local Constructor = require("../Constructor")
local Constants = require("../Constants")
local BaseModule = require(".")
local TemporalState = require("./Relative/State/TemporalState")
local KinematicTemporalState = require("./KinematicTemporalState")

-- Internal type
type Trajectory = Type.TrajectoryEXTENSIBLE<Trajectory,
		Type.BaseModuleEXTENSIBLE<Trajectory
	>>
	& Constructor.TrajectoryEXTENSIBLE<Trajectory>
	& {
	kinematicTemporalState: Type.KinematicTemporalState,
	cache: {
		nextTrajectory: Type.LinearTrajectory | false | nil,
		nextTrajectoryDirection: "in" | "out" | false | nil,
		nextSOI: Type.GravityCelestial | false | nil
	}
}

local Trajectory: Trajectory = { __type = "Trajectory" :: "Trajectory" } :: any
local TrajectoryMT = {}

-- Constructors

--[=[
	Creates a new Trajectory instance.
]=]
function Trajectory.new(
	kinematicState: Type.KinematicState,
	temporalState: Type.TemporalState
): Trajectory
	return Trajectory.newFromKinematicTemporalState(KinematicTemporalState.new(kinematicState, temporalState))
end

--[=[
	Creates a new Trajectory instance.
]=]
function Trajectory.newFromKinematicTemporalState(kinematicTemporalState: Type.KinematicTemporalState): Trajectory
	local self: Trajectory = table.clone(Trajectory) :: any
	self.kinematicTemporalState = kinematicTemporalState

	local metatable = table.clone(TrajectoryMT)
	metatable.__index = BaseModule

	setmetatable(self, metatable)

	return self
end

-- Methods

function Trajectory:getStartPosition(): Type.KinematicTemporalState
	return self.kinematicTemporalState
end

--[=[
	Returns whether this Trajectory leads into a new Trajectory (in a new SOI).

	@return true if there is a next Trajectory
]=]
function Trajectory:hasNextTrajectory(): boolean
	error("Trajectory hasNextTrajectory() not implemented for type " .. self.__type)

	-- local timesToSOI: { number } = {}
	-- local gravityBodiesIntercepted: { Type.GravityCelestial? } = {}
	-- local gravityBodiesToTest: { Type.GravityCelestial? } = {}
	-- local maxTimeToSearch: number = 10 ^ 30

	-- local escapingSOI: boolean = self:escapingSOI()

	-- if self.Orbit then
	-- 	-- gravityBodiesToTest = orbitingBody.ChildGravityBodies -- uncomment when ready

	-- 	if escapingSOI then
	-- 		table.insert(timesToSOI, self:CalculateTimeFromMagnitude(self.Orbit.Body.SOIRadius))
	-- 		table.insert(gravityBodiesIntercepted, self.Orbit.Body.ParentGravityBody)

	-- 		maxTimeToSearch = timesToSOI[1]
	-- 	else
	-- 		maxTimeToSearch = self.Orbit:OrbitalPeriod() -- only search this orbit, change this when ready
	-- 	end
	-- else
	-- 	-- gravityBodiesToTest:insert() -- TODO: find a way to fetch array of all root GravityBodies
	-- end

	-- local function searchRangeToTemporalRange(value: number)
	-- 	return math.lerp(0, maxTimeToSearch, value)
	-- end

	-- -- bisection search to find if this trajectory goes in any SOI
	-- if #gravityBodiesToTest > 0 then
	-- 	for i, gravityBodyToTest in ipairs(gravityBodiesToTest) do
	-- 		print(`{i}:`)
	-- 		print(gravityBodyToTest)

	-- 		-- generate bounds
	-- 		local lowerBound: number = 0
	-- 		local lowerPosition: Type.SolarSystemObject = SolarSystemObject.fromMovingObject(
	-- 				self:CalculatePointFromTime(0),
	-- 				self.TemporalState:fromTemporalState(0),
	-- 				self.OrbitingBody
	-- 			)
	-- 		local upperBound: number = 1
	-- 		local upperPosition: Type.SolarSystemObject = SolarSystemObject.fromMovingObject(
	-- 				self:CalculatePointFromTime(maxTimeToSearch),
	-- 				self.TemporalState:fromTemporalState(maxTimeToSearch),
	-- 				self.OrbitingBody
	-- 			)
	-- 		local lastMiddleBound

	-- 		-- bisection search


	-- 		-- final result?
	-- 		local timeToSOI: number = -1

	-- 		-- table.insert(timesToSOI, timeToSOI)
	-- 		-- table.insert(gravityBodiesIntercepted, gravityBodyToTest)
	-- 	end
	-- end

	-- -- look through results
	-- if #timesToSOI > 0 then
	-- 	local timeToNearestSOI: number = math.min(table.unpack(timesToSOI))
	-- 	local SOIDirection: string = if timeToNearestSOI == timesToSOI[1] then "out" else "in"
	-- 	local pointBeforeSOIChange: Type.SolarSystemObject = SolarSystemObject.fromMovingObject(
	-- 			self:CalculatePointFromTime(timeToNearestSOI),
	-- 			TemporalState.new(timeToNearestSOI, self.TemporalState.RelativeTo),
	-- 			self.OrbitingBody
	-- 		)
	-- 	local pointAfterSOIChange: Type.SolarSystemObject

	-- 	if SOIDirection == "out" then
	-- 		pointAfterSOIChange = pointBeforeSOIChange:RelativeToParent()
	-- 	else
	-- 		local nearestSOI = gravityBodiesIntercepted[
	-- 			table.find(timesToSOI, timeToNearestSOI)
	-- 			or error(`timeToNearestSOI ({timeToNearestSOI}) not in timesToSOI ({timesToSOI})`)
	-- 		]
	-- 		assert(nearestSOI, `nearestSOI must be a child GravityBody of another GravityBody but is nil {nearestSOI}`)
	-- 		pointAfterSOIChange = pointBeforeSOIChange:RelativeToChild(nearestSOI)
	-- 	end

	-- 	pointAfterSOIChange.TemporalState = pointBeforeSOIChange.TemporalState:fromTemporalState(0)

	-- 	getmetatable(self)["SOIChange"] = {pointAfterSOIChange, self.TemporalState:fromTemporalState(timeToNearestSOI), SOIDirection} :: {any}
	-- else
	-- 	getmetatable(self)["SOIChange"] = false
	-- end

	-- return self:SOIChange()
end

--[=[
	Returns the next Trajectory.
	Otherwise, if there is no trajectory, throws an error.

	@return The next Trajectory
]=]
function Trajectory:nextTrajectory(): Trajectory
	assert(self.cache.nextTrajectory ~= false, "Trajectory nextTrajectory() cannot be called on a Trajectory with no nextTrajectory")

	if self.cache.nextTrajectory == nil then
		self:hasNextTrajectory()
		return self:nextTrajectory()
	else
		return self.cache.nextTrajectory :: any
	end
end

--[=[
	Returns if this Trajectory goes into, or out of, an SOI.
	Otherwise, if there is no next trajectory, throws an error.

	@return The next Trajectory
]=]
function Trajectory:nextTrajectoryDirection(): "in" | "out"
	assert(self.cache.nextTrajectoryDirection ~= false, "Trajectory nextTrajectoryDirection() cannot be called on a Trajectory with no nextTrajectory")

	if self.cache.nextTrajectory == nil then
		self:hasNextTrajectory()
		return self:nextTrajectoryDirection()
	else
		return self.cache.nextTrajectoryDirection :: any
	end
end

--[=[
	Computes the location of closest approach of this and another Trajectory in spacetime.

	@param trajectory The trajectory of the other body.
	@param searchTimeMin The minimum time to search.
	@param searchTimeMax The maximum time to search.
]=]
function Trajectory:minimumOrbitalIntersectionDistance(
	other: Trajectory,
	searchTimeMin: number,
	searchTimeMax: number
): Type.KinematicTemporalState
	error("Trajectory minimumOrbitalIntersectionDistance() not implemented for type " .. self.__type)
	-- local otherTrajectoryTemporal = self.TemporalState:MatchRelative(trajectory.TemporalState)
	-- local fixedSearchTimeMin = self.TemporalState:MatchRelative(searchTimeMin)
	-- local fixedSearchTimeMax = self.TemporalState:MatchRelative(searchTimeMax)

	-- error("Not implemented yet")
end

--[=[
	Returns true if it is detected that this Trajectory exits outside of the current SOI, and false otherwise.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
-- function Trajectory:escapingSOI(): boolean
-- 	if self.cache.nextTrajectoryDirection then
-- 		if not self.Orbit:IsClosed() or self.Orbit:Apoapsis().Position:Magnitude() > self.Orbit.Body.SOIRadius then
-- 			return true
-- 		end
-- 	end

-- 	return false
-- end

-- --[=[
-- 	Returns if it is detected that this Trajectory enters a new SOI.
-- 	https://en.wikipedia.org/wiki/Orbital_elements

-- 	@return The KinematicTemporalState at the position just after the SOI is exited
-- 	@return A string saying if the next SOI is within or encompassing the current SOI
-- ]=]
-- function Trajectory:SOIChange(): (Type.KinematicTemporalState?, ("out" | "in")?)
-- 	-- error("Trajectory SOIChange() not implemented for type " .. self.__type)
-- 	-- check cache
-- 	local SOIChangeDirection: "in" | "out" | false | nil = self.cache.nextTrajectoryDirection
-- 	local SOIChangeTrajectory: Trajectory | false | nil = self.cache.nextTrajectory

-- 	if SOIChangeDirection ~= nil then
-- 		if SOIChangeDirection ~= false and SOIChangeTrajectory then
-- 			return SOIChangeDirection, SOIChangeTrajectory
-- 		else
-- 			return nil
-- 		end
-- 	else
-- 		local timesToSOI: { number } = {}
-- 		local gravityBodiesIntercepted: { Type.GravityBody? } = {}
-- 		local gravityBodiesToTest: { Type.GravityBody? } = {}
-- 		local maxTimeToSearch: number = 10 ^ 30

-- 		local escapingSOI: boolean = self:escapingSOI()

-- 		if self.Orbit then
-- 			-- gravityBodiesToTest = orbitingBody.ChildGravityBodies -- uncomment when ready

-- 			if escapingSOI then
-- 				table.insert(timesToSOI, self:CalculateTimeFromMagnitude(self.Orbit.Body.SOIRadius))
-- 				table.insert(gravityBodiesIntercepted, self.Orbit.Body.ParentGravityBody)

-- 				maxTimeToSearch = timesToSOI[1]
-- 			else
-- 				maxTimeToSearch = self.Orbit:OrbitalPeriod() -- only search this orbit, change this when ready
-- 			end
-- 		else
-- 			-- gravityBodiesToTest:insert() -- TODO: find a way to fetch array of all root GravityBodies
-- 		end

-- 		local function searchRangeToTemporalRange(value: number)
-- 			return math.lerp(0, maxTimeToSearch, value)
-- 		end

-- 		-- bisection search to find if this trajectory goes in any SOI
-- 		if #gravityBodiesToTest > 0 then
-- 			for i, gravityBodyToTest in ipairs(gravityBodiesToTest) do
-- 				print(`{i}:`)
-- 				print(gravityBodyToTest)

-- 				-- generate bounds
-- 				local lowerBound: number = 0
-- 				local lowerPosition: Type.SolarSystemObject = SolarSystemObject.fromMovingObject(
-- 						self:CalculatePointFromTime(0),
-- 						self.TemporalState:fromTemporalState(0),
-- 						self.OrbitingBody
-- 					)
-- 				local upperBound: number = 1
-- 				local upperPosition: Type.SolarSystemObject = SolarSystemObject.fromMovingObject(
-- 						self:CalculatePointFromTime(maxTimeToSearch),
-- 						self.TemporalState:fromTemporalState(maxTimeToSearch),
-- 						self.OrbitingBody
-- 					)
-- 				local lastMiddleBound

-- 				-- bisection search


-- 				-- final result?
-- 				local timeToSOI: number = -1

-- 				-- table.insert(timesToSOI, timeToSOI)
-- 				-- table.insert(gravityBodiesIntercepted, gravityBodyToTest)
-- 			end
-- 		end

-- 		-- look through results
-- 		if #timesToSOI > 0 then
-- 			local timeToNearestSOI: number = math.min(table.unpack(timesToSOI))
-- 			local SOIDirection: string = if timeToNearestSOI == timesToSOI[1] then "out" else "in"
-- 			local pointBeforeSOIChange: Type.SolarSystemObject = SolarSystemObject.fromMovingObject(
-- 					self:CalculatePointFromTime(timeToNearestSOI),
-- 					TemporalState.new(timeToNearestSOI, self.TemporalState.RelativeTo),
-- 					self.OrbitingBody
-- 				)
-- 			local pointAfterSOIChange: Type.SolarSystemObject

-- 			if SOIDirection == "out" then
-- 				pointAfterSOIChange = pointBeforeSOIChange:RelativeToParent()
-- 			else
-- 				local nearestSOI = gravityBodiesIntercepted[
-- 					table.find(timesToSOI, timeToNearestSOI)
-- 					or error(`timeToNearestSOI ({timeToNearestSOI}) not in timesToSOI ({timesToSOI})`)
-- 				]
-- 				assert(nearestSOI, `nearestSOI must be a child GravityBody of another GravityBody but is nil {nearestSOI}`)
-- 				pointAfterSOIChange = pointBeforeSOIChange:RelativeToChild(nearestSOI)
-- 			end

-- 			pointAfterSOIChange.TemporalState = pointBeforeSOIChange.TemporalState:fromTemporalState(0)

-- 			getmetatable(self)["SOIChange"] = {pointAfterSOIChange, self.TemporalState:fromTemporalState(timeToNearestSOI), SOIDirection} :: {any}
-- 		else
-- 			getmetatable(self)["SOIChange"] = false
-- 		end

-- 		return self:SOIChange()
-- 	end
-- end

--[=[
	Calculates the point at which this Trajectory will reach relativeTime seconds from now.
	Note: relativeTime can be negative.
]=]
function Trajectory:calculatePointFromTime(relativeTime: number): Type.KinematicState
	error("Trajectory calculatePointFromTime() not implemented for type " .. self.__type)
end

--[=[
	Calculates the position at which this LinearTrajectory will reach relativeTime seconds from now.
	Note: relativeTime can be negative.

	@param relativeTime The time passed since the location of this Trajectory.
]=]
function Trajectory:calculatePositionFromTime(relativeTime: number): Type.KinematicTemporalState
	return KinematicTemporalState.new(
		self:calculatePointFromTime(relativeTime),
		TemporalState.new(relativeTime, self:getStartPosition():getTemporalState())
	)
end

--[=[
	Calculates the time until the craft reaches a specific point on this Trajectory.
	Times are relative to this Trajectory.
	Time may be negative if the current orbit is hyperbolic.
	https://www.desmos.com/3d/rfndgd4ppj

	@param position The position to be reached (may have already been reached if the current orbit is hyperbolic).
]=]
function Trajectory:calculateTimeFromPoint(position: Type.Vector3D): Type.TemporalState
	error("Trajectory calculateTimeFromPoint() not implemented for type " .. self.__type)
end

--[=[
	Calculates the KinematicTemporalState of closest approach to position.
	Times are relative to this Trajectory.
	Calculated time may be negative if the current orbit is hyperbolic.
	https://www.desmos.com/3d/rfndgd4ppj

	@param position The position to be reached (may have already been reached if the current orbit is hyperbolic).
]=]
function Trajectory:calculatePositionFromPoint(position: Type.Vector3D): Type.KinematicTemporalState
	local timeFromPoint: Type.TemporalState = self:calculateTimeFromPoint(position)

	return KinematicTemporalState.new(
		self:calculatePointFromTime(timeFromPoint:getRelativeTime()),
		timeFromPoint
	)
end

--[=[
	Calculates the time the craft reaches a specific altitude/magnitude on this Trajectory.
	Times are relative to this Trajectory.
	Time can be either negative or positive if the trajectory is a hyperbola, or only positive if the orbit is closed.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function Trajectory:calculateTimeFromMagnitude(magnitude: number): Type.TemporalState
	error("Trajectory calculateTimeFromMagnitude() not implemented for type " .. self.__type)
end

--[=[
	Calculates a new KinematicState at a given altitude/magnitude on this Trajectory.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function Trajectory:calculatePointFromMagnitude(magnitude: number): Type.KinematicState
	return self:calculatePointFromTime(self:calculateTimeFromMagnitude(magnitude):getRelativeTime())
end

--[=[
	Calculates a new KinematicTemporalState at a given altitude/magnitude on this Trajectory.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function Trajectory:calculatePositionFromMagnitude(magnitude: number): Type.KinematicTemporalState
	return self:calculatePositionFromTime(self:calculateTimeFromMagnitude(magnitude):getRelativeTime())
end

--[=[
	Returns a new Trajectory incremented in time.
	Updates position, velocity, and the orbiting body.
	Optionally takes an acceleration value.
	Note: Checks for SOI changes.

	@param relativeTime The time passed since the location of this Trajectory.
	@param withAcceleration Adds an acceleration to this Trajectory, modifying the trajectory.
]=]
function Trajectory:atTime(relativeTime: number, withAcceleration: Type.AccelerationState?): Trajectory
	error("Trajectory atTime() not implemented for type " .. self.__type)
end

--[=[
	Clones and increments this Trajectory in time, then returns the result.
	Note: Checks for SOI changes when incrementing.

	@param delta The change in time.
	@param recursions The number of times to step this Trajectory.
	@param withAcceleration Adds an acceleration to this Trajectory, modifying the trajectory.
]=]
function Trajectory:increment(
	delta: number,
	recursions: number?,
	withAcceleration: Type.AccelerationState?
): Trajectory
	local newTrajectory: Trajectory = self

	for recursion = 1, (if recursions then recursions else 1) do
		newTrajectory = newTrajectory:atTime(delta * recursion, withAcceleration)
	end

	return newTrajectory
end

--[=[
	Calculates a trajectory as a series of points.

	@param delta The change in time.
	@param recursions The number of points to calculate.
]=]
function Trajectory:calculatePoints(delta: number, recursions: number): { Type.KinematicTemporalState }
	local points: { Type.KinematicTemporalState } = {}

	for i = 1, recursions do
		table.insert(points, self:calculatePositionFromTime(delta * i))
	end

	return points
end

--[=[
	Creates and displays a trajectory / orbit line.

	@param delta The change in time.
	@param recursions The number of points to calculate.
]=]
function Trajectory:displayTrajectory(delta: number, recursions: number, width: number): Folder
	assert(delta > 0 and recursions >= 2 and width >= 0, "Trajectory displayTrajectory() Invalid parameter(s)")

	local trajectory: { Type.KinematicTemporalState } = self:calculatePoints(delta, recursions)

	--[[
		TODO: Implement Multithreading for creation of Attachments and Beams
		TODO: create a gui thingy like KSP
	]]

	-- make all of the attachments
	local attachments: { Attachment } = {}

	for i in ipairs(trajectory) do
		local newPoint: Type.KinematicTemporalState = trajectory[i]
		local newAttachment: Attachment = Instance.new("Attachment")

		newAttachment.Name = `{i}`
		newAttachment.Position = (newPoint:getAbsolutePosition() * Constants.SOLAR_SYSTEM_SCALE):ToVector3()

		attachments[i] = newAttachment
	end

	-- make all of the beams
	local beams: { Beam } = {}

	-- local width: number = self.OrbitingBody and (math.log10(self.OrbitingBody.SOIRadius/50e6))/10 or 0.3

	for i = 2, #attachments do
		local Attachment0: Attachment = attachments[i - 1]
		local Attachment1: Attachment = attachments[i]
		local newBeam: Beam = Instance.new("Beam")

		newBeam.Attachment0 = Attachment0
		newBeam.Attachment1 = Attachment1
		newBeam.Width0, newBeam.Width1 = width, width
		newBeam.FaceCamera = true
		newBeam.Color = ColorSequence.new(Color3.fromRGB(97, 97, 97))
		newBeam.Transparency = NumberSequence.new(0.8)
		newBeam.Name = `{i}`

		table.insert(beams, newBeam)
	end

	-- add everything to workspace in a nice file hierarchy
	local trajectoryFolder: Folder = Instance.new("Folder")
	trajectoryFolder.Name = "TrajectoryLine"

	local attachmentFolder: Part = Instance.new("Part")
	attachmentFolder.CanCollide = false
	attachmentFolder.Transparency = 1
	attachmentFolder.Size *= 0
	attachmentFolder.Position = Vector3.zero
	attachmentFolder.Name = "Attachments"

	for _, attachment in attachments do
		attachment.Parent = attachmentFolder
	end

	attachmentFolder.Parent = trajectoryFolder

	local beamFolder: Folder = Instance.new("Folder")
	beamFolder.Name = "Beams"

	for _, beam in beams do
		beam.Parent = beamFolder
	end

	beamFolder.Parent = trajectoryFolder

	-- Weld attachmentFolder to a GravityCelestial so the displayed line will move along with it
	-- if self.Orbit then
	-- 	local weld: WeldConstraint = Instance.new("WeldConstraint")
	-- 	weld.Part0 = attachmentFolder
	-- 	weld.Part1 = self.Orbit.Body.RootPart
	-- 	weld.Parent = attachmentFolder
	-- end
	-- trajectoryFolder.Parent = workspace.Orbits

	return trajectoryFolder
end

return Trajectory :: Constructor.TrajectoryEXTENSIBLE<any>

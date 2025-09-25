--!strict

--[[
	Performace enhancements:
	Have subparameters to calculate repeated calcs only once, then substitute redundant calcs w/ the variable
	Find out exactly what operations/methods are computationally expensive
]]

local Modules = require(game.ReplicatedStorage.Modules.Modules)
local Constants = require(game.ReplicatedStorage.Modules.Constants)
local TemporalPosition = require(game.ReplicatedStorage.Modules.BaseModule.TemporalPosition)
local LinearTrajectory = require(script.Parent.LinearTrajectory)
local OrbitalTrajectory = require(script.Parent.OrbitalTrajectory)
local SolarSystemObject = require(script.Parent.Parent.SolarSystemObject)

local TrajectoryObject = { __type = "TrajectoryObject" :: "TrajectoryObject" }

--[=[
	Creates a new TrajectoryObject instance.
]=]
function TrajectoryObject.new(
	position: Modules.Vector3D,
	velocity: Modules.Vector3D,
	temporalPosition: Modules.TemporalPosition,
	orbitingBody: Modules.GravityBody?
): Modules.TrajectoryObject
	return TrajectoryObject.fromSolarSystemObject(SolarSystemObject.new(position, velocity, temporalPosition, orbitingBody))
end

--[=[
	Creates a new TrajectoryObject instance.
]=]
function TrajectoryObject.fromMovingObject(
	movingObject: Modules.MovingObject,
	temporalPosition: Modules.TemporalPosition,
	orbitingBody: Modules.GravityBody?
): Modules.TrajectoryObject
	return TrajectoryObject.fromSolarSystemObject(SolarSystemObject.fromMovingObject(movingObject, temporalPosition, orbitingBody))
end

--[=[
	Creates a new TrajectoryObject instance, with a given SolarSystemObject super-instance.
	This effectively links this instance with other objects with the same super-instance.
]=]
function TrajectoryObject.fromSolarSystemObject(solarSystemObject: Modules.SolarSystemObject): Modules.TrajectoryObject
	local newTrajectoryObject = table.clone(TrajectoryObject)

	local trajectory: Modules.LinearTrajectory | Modules.OrbitalTrajectory

	if solarSystemObject.OrbitingBody then
		trajectory = OrbitalTrajectory.fromMovingObject(solarSystemObject:getSuper(), solarSystemObject.OrbitingBody)
		assert(trajectory.__type == "OrbitalTrajectory")
		newTrajectoryObject.Orbit = {
			Trajectory = trajectory,
			Body = solarSystemObject.OrbitingBody,
			OrbitalPeriod = function(self) return self.Trajectory:OrbitalPeriod() end,
			TimeToPeriapsis = function(self) return self.Trajectory:TimeToPeriapsis() end,
			TimeSincePeriapsis = function(self) return self.Trajectory:TimeSincePeriapsis() end,
			Apoapsis = function(self) return self.Trajectory:Apoapsis() end,
			Periapsis = function(self) return self.Trajectory:Periapsis() end,
			SemiMajorAxis = function(self) return self.Trajectory:SemiMajorAxis() end,
			SemiMinorAxis = function(self) return self.Trajectory:SemiMinorAxis() end,
			Eccentricity = function(self) return self.Trajectory:Eccentricity() end,
			IsBound = function(self) return self.Trajectory:IsBound() end,
			IsClosed = function(self) return self.Trajectory:IsClosed() end,
			SpecificOrbitalEnergy = function(self) return self.Trajectory.SpecificOrbitalEnergy end,
		}
	else
		trajectory = LinearTrajectory.fromMovingObject(solarSystemObject:getSuper())
	end

	newTrajectoryObject.Trajectory = trajectory

	local metatable = {
		__index = solarSystemObject,
	}

	setmetatable(newTrajectoryObject, metatable)

	return newTrajectoryObject
end

--[=[
	Computes the location of closest approach of this and another TrajectoryObject in spacetime.

	@param trajectory The trajectory of the other body.
	@param searchTimeMin The minimum time to search.
	@param searchTimeMax The maximum time to search.
]=]
function TrajectoryObject:minimumOrbitalIntersectionDistance(
	trajectory: Modules.TrajectoryObject,
	searchTimeMin: Modules.TemporalPosition,
	searchTimeMax: Modules.TemporalPosition
): Modules.SolarSystemObject
	local otherTrajectoryTemporal = self.TemporalPosition:MatchRelative(trajectory.TemporalPosition)
	local fixedSearchTimeMin = self.TemporalPosition:MatchRelative(searchTimeMin)
	local fixedSearchTimeMax = self.TemporalPosition:MatchRelative(searchTimeMax)

	error("Not implemented")
end

--[=[
	Returns true if it is detected that this TrajectoryObject exits outside of the current SOI, and false otherwise.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryObject:EscapingSOI(): boolean
	if self.Orbit then
		if not self.Orbit:IsClosed() or self.Orbit:Apoapsis().Position:Magnitude() > self.Orbit.Body.SOIRadius then
			return true
		end
	end

	return false
end

--[=[
	Returns if it is detected that this TrajectoryObject enters a new SOI.
	https://en.wikipedia.org/wiki/Orbital_elements

	@return The MovingObject at the position just after the SOI is exited
	@return The time that the SOI change occurs
	@return A string saying if the next SOI is within or encompassing the current SOI
]=]
function TrajectoryObject:SOIChange(): (Modules.SolarSystemObject?, Modules.TemporalPosition?, ("out" | "in")?)
	local SOIChange: {any} | false | nil = getmetatable(self)["SOIChange"] -- check cache

	if SOIChange ~= nil then
		if SOIChange ~= false then
			return table.unpack(SOIChange)
		else
			return nil
		end
	else
		local timesToSOI: { number } = {}
		local gravityBodiesIntercepted: { Modules.GravityBody? } = {}
		local gravityBodiesToTest: { Modules.GravityBody? } = {}
		local maxTimeToSearch: number = 10 ^ 30

		local escapingSOI: boolean = self:EscapingSOI()

		if self.Orbit then
			-- gravityBodiesToTest = orbitingBody.ChildGravityBodies -- uncomment when ready

			if escapingSOI then
				table.insert(timesToSOI, self:CalculateTimeFromMagnitude(self.Orbit.Body.SOIRadius))
				table.insert(gravityBodiesIntercepted, self.Orbit.Body.ParentGravityBody)

				maxTimeToSearch = timesToSOI[1]
			else
				maxTimeToSearch = self.Orbit:OrbitalPeriod() -- only search this orbit, change this when ready
			end
		else
			-- gravityBodiesToTest:insert() -- TODO: find a way to fetch array of all root GravityBodies
		end

		local function searchRangeToTemporalRange(value: number)
			return math.lerp(0, maxTimeToSearch, value)
		end

		-- bisection search to find if this trajectory goes in any SOI
		if #gravityBodiesToTest > 0 then
			for i, gravityBodyToTest in ipairs(gravityBodiesToTest) do
				print(`{i}:`)
				print(gravityBodyToTest)

				-- generate bounds
				local lowerBound: number = 0
				local lowerPosition: Modules.SolarSystemObject = SolarSystemObject.fromMovingObject(
						self:CalculatePointFromTime(0),
						self.TemporalPosition:fromTemporalPosition(0),
						self.OrbitingBody
					)
				local upperBound: number = 1
				local upperPosition: Modules.SolarSystemObject = SolarSystemObject.fromMovingObject(
						self:CalculatePointFromTime(maxTimeToSearch),
						self.TemporalPosition:fromTemporalPosition(maxTimeToSearch),
						self.OrbitingBody
					)
				local lastMiddleBound

				-- bisection search


				-- final result?
				local timeToSOI: number = -1

				-- table.insert(timesToSOI, timeToSOI)
				-- table.insert(gravityBodiesIntercepted, gravityBodyToTest)
			end
		end

		-- look through results
		if #timesToSOI > 0 then
			local timeToNearestSOI: number = math.min(table.unpack(timesToSOI))
			local SOIDirection: string = if timeToNearestSOI == timesToSOI[1] then "out" else "in"
			local pointBeforeSOIChange: Modules.SolarSystemObject = SolarSystemObject.fromMovingObject(
					self:CalculatePointFromTime(timeToNearestSOI),
					TemporalPosition.new(timeToNearestSOI, self.TemporalPosition.RelativeTo),
					self.OrbitingBody
				)
			local pointAfterSOIChange: Modules.SolarSystemObject

			if SOIDirection == "out" then
				pointAfterSOIChange = pointBeforeSOIChange:RelativeToParent()
			else
				local nearestSOI = gravityBodiesIntercepted[
					table.find(timesToSOI, timeToNearestSOI)
					or error(`timeToNearestSOI ({timeToNearestSOI}) not in timesToSOI ({timesToSOI})`)
				]
				assert(nearestSOI, `nearestSOI must be a child GravityBody of another GravityBody but is nil {nearestSOI}`)
				pointAfterSOIChange = pointBeforeSOIChange:RelativeToChild(nearestSOI)
			end

			pointAfterSOIChange.TemporalPosition = pointBeforeSOIChange.TemporalPosition:fromTemporalPosition(0)

			getmetatable(self)["SOIChange"] = {pointAfterSOIChange, self.TemporalPosition:fromTemporalPosition(timeToNearestSOI), SOIDirection} :: {any}
		else
			getmetatable(self)["SOIChange"] = false
		end

		return self:SOIChange()
	end
end

--[=[
	Returns if it is detected that this TrajectoryObject enters a new SOI.
	https://en.wikipedia.org/wiki/Orbital_elements

	@return The next TrajectoryObject
	@return The time that the SOI change occurs
]=]
function TrajectoryObject:NextTrajectory(): (Modules.TrajectoryObject?, Modules.TemporalPosition?)
	local SOIChange: Modules.SolarSystemObject?,
		timeToNearestSOI: Modules.TemporalPosition?,
		SOIDirection: ("out" | "in")? = self:SOIChange()

	if SOIChange and timeToNearestSOI and SOIDirection then
		return TrajectoryObject.fromSolarSystemObject(SOIChange), timeToNearestSOI
	else
		return nil
	end
end

--[=[
	Calculates a new MovingObject at a given point in time on this TrajectoryObject.
	https://www.desmos.com/3d/rfndgd4ppj

	@param relativeTime The time passed since the location of this TrajectoryObject.
]=]
function TrajectoryObject:CalculatePointFromTime(relativeTime: number): Modules.MovingObject
	return (self.Trajectory :: any):CalculatePointFromTime(relativeTime)
end

--[=[
	Calculates the time until the craft reaches a specific point on this TrajectoryObject.
	Times are relative to this TrajectoryObject.
	Time may be negative if the current orbit is hyperbolic.
	https://www.desmos.com/3d/rfndgd4ppj

	@param position The position to be reached (may have already been reached if the current orbit is hyperbolic).
]=]
function TrajectoryObject:CalculateTimeFromPoint(position: Modules.Vector3D): number
	return (self.Trajectory :: any):CalculateTimeFromPoint(position)
end

--[=[
	Calculates the time the craft reaches a specific altitude/magnitude on this TrajectoryObject.
	Times are relative to this TrajectoryObject.
	Time can be either negative or positive if the trajectory is a hyperbola, or only positive if the orbit is closed.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculateTimeFromMagnitude(magnitude: number): number
	return (self.Trajectory :: any):CalculateTimeFromMagnitude(magnitude)
end

--[=[
	Calculates a new MovingObject at a given altitude/magnitude on this TrajectoryObject.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculatePointFromMagnitude(magnitude: number): Modules.MovingObject
	return (self.Trajectory :: any):CalculatePointFromMagnitude(magnitude)
end

--[=[
	Returns a new TrajectoryObject incremented in time.
	Updates position, velocity, and the orbiting body.
	Optionally takes an acceleration value.
]=]
function TrajectoryObject:Step(delta: number, withAcceleration: Modules.Vector3D?): Modules.TrajectoryObject
	local newVelocity: Modules.Vector3D = self.Velocity
	local newPosition: Modules.Vector3D = self.Position

	-- Update acceleration
	if withAcceleration then
		newVelocity += withAcceleration * delta
	end

	-- Update orbiting body
	local newOrbitingBody: Modules.GravityBody? = self.OrbitingBody

	if self.OrbitingBody and newPosition:Magnitude() > self.OrbitingBody.SOIRadius then
		newOrbitingBody = self.OrbitingBody.ParentGravityBody
	end

	-- Create new TrajectoryObject
	local newTrajectoryObject: Modules.TrajectoryObject =
		TrajectoryObject.new(
			newPosition,
			newVelocity,
			self.TemporalPosition:fromTemporalPosition(delta),
			newOrbitingBody
		)

	local nextState: Modules.MovingObject = newTrajectoryObject:CalculatePointFromTime(delta)

	-- print(`step, before: {newTrajectoryObject:getSuper():getSuper().Position}`)
	-- print(`step, after: {nextState.Position}`)
	print(`distance: {(newTrajectoryObject:getSuper():getSuper().Position - nextState.Position):Magnitude()}`)
	newTrajectoryObject:getSuper():setSuper(nextState)
	return newTrajectoryObject
end

--[=[
	Returns a new TrajectoryObject incremented in time.
	Updates position, velocity, and the orbiting body.
	Optionally takes an acceleration value.

	@param relativeTime The time passed since the location of this TrajectoryObject.
	@param withAcceleration Adds an acceleration to this TrajectoryObject, modifying the trajectory. Note: This is applied instantaneously, make sure to multiply with delta
]=]
function TrajectoryObject:AtTime(relativeTime: number, withAcceleration: Modules.Vector3D?): Modules.TrajectoryObject
	local newVelocity: Modules.Vector3D = self.Velocity
	local newPosition: Modules.Vector3D = self.Position

	if withAcceleration then
		newVelocity += withAcceleration
	end

	local newTrajectoryObject: Modules.TrajectoryObject = TrajectoryObject.new(
			newPosition,
			newVelocity,
			TemporalPosition.new(self.TemporalPosition.RelativeTime + relativeTime, self.TemporalPosition.RelativeTo),
			self.OrbitingBody
		)

	local nextState: Modules.MovingObject = newTrajectoryObject:CalculatePointFromTime(relativeTime)

	-- print(`step, before: {newTrajectoryObject:getSuper():getSuper().Position}`)
	-- print(`step, after: {nextState.Position}`)
	-- print(`distance: {(newTrajectoryObject:getSuper():getSuper().Position - nextState.Position):Magnitude()}`)
	newTrajectoryObject:getSuper():setSuper(nextState)
	return newTrajectoryObject
end

--[=[
	Increments this TrajectoryObject in time, then returns itself.

	@param delta The change in time.
	@param recursions The number of times to step this TrajectoryObject.
	@param withAcceleration Adds an acceleration to this TrajectoryObject, modifying the trajectory.
]=]
function TrajectoryObject:Increment(
	delta: number,
	recursions: number?,
	withAcceleration: Modules.Vector3D?
): Modules.TrajectoryObject
	local newTrajectoryObject: Modules.TrajectoryObject = self

	for _ = 0, (if recursions then recursions else 1) do
		newTrajectoryObject = self:Step(delta, withAcceleration)
	end

	self = newTrajectoryObject

	return self
end

--[=[
	Calculates a trajectory as a series of points.

	@param delta The change in time.
	@param recursions The number of points to calculate.
]=]
function TrajectoryObject:CalculatePoints(delta: number, recursions: number): { Modules.SolarSystemObject }
	local points: { Modules.SolarSystemObject } = {}

	for i = 0, recursions do
		table.insert(points, SolarSystemObject.fromMovingObject(self:CalculatePointFromTime(delta * i), TemporalPosition.new(delta * i, self.TemporalPosition), self.OrbitingBody))
		-- print(`time progress: {delta * i / self.OrbitalPeriod}`)
	end

	return points
end

--[=[
	Creates and displays a trajectory / orbit line.

	@param delta The change in time.
	@param recursions The number of points to calculate.
]=]
function TrajectoryObject:DisplayTrajectory(delta: number, recursions: number): Folder
	local trajectory: { Modules.SolarSystemObject } = self:CalculatePoints(delta, recursions)

	--[[
		TODO: Implement Multithreading for creation of Attachments and Beams
		TODO: create a gui thingy like KSP
	]]

	-- make all of the attachments
	local attachments: { Attachment } = {}

	for i in ipairs(trajectory) do
		local newPoint: Modules.SolarSystemObject = trajectory[i]
		local newAttachment: Attachment = Instance.new("Attachment")

		newAttachment.Name = `{i}`
		newAttachment.Position = (newPoint.Position * Constants.SOLAR_SYSTEM_SCALE):ToVector3()

		attachments[i] = newAttachment
	end

	-- make all of the beams
	local beams: { Beam } = {}

	local width: number = self.OrbitingBody and (math.log10(self.OrbitingBody.SOIRadius/50e6))/10 or 0.3
	-- print(width)

	for i = 1, #attachments do
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
	local newTrajectoryFolder: Folder = Instance.new("Folder")
	newTrajectoryFolder.Name = "TrajectoryLine"

	local attachmentFolder: Part = Instance.new("Part")
	attachmentFolder.CanCollide = false
	attachmentFolder.Transparency = 1
	attachmentFolder.Size *= 0
	attachmentFolder.Name = "Attachments"
	if self.Orbit then
		local weld: WeldConstraint = Instance.new("WeldConstraint")
		weld.Part0 = attachmentFolder
		weld.Part1 = self.Orbit.Body.RootPart
		weld.Parent = attachmentFolder
	end
	for _, attachment in attachments do
		attachment.Parent = attachmentFolder
	end
	attachmentFolder.Position = if self.OrbitingBody then self.OrbitingBody:CalculateWorkspacePosition():ToVector3() else Vector3.zero
	attachmentFolder.Parent = newTrajectoryFolder

	local beamFolder: Folder = Instance.new("Folder")
	beamFolder.Name = "Beams"
	for _, beam in beams do
		beam.Parent = beamFolder
	end
	beamFolder.Parent = newTrajectoryFolder

	newTrajectoryFolder.Parent = workspace.Orbits

	return newTrajectoryFolder
end

return TrajectoryObject

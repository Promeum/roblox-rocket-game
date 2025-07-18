--!strict

function Magnitude(v: Vector3): number
	return math.sqrt(v.X ^ 2 + v.Y ^ 2 + v.Z ^ 2)
end

local Modules = require(game.ReplicatedStorage.Modules.Modules)
local Constants = require(game.ReplicatedStorage.Modules.Constants)
local MovingObject = require(script.Parent.Parent.Parent.MovingObject)
local SolarSystemObject = require(script.Parent.Parent.SolarSystemObject)
local TrajectoryObject = require(script.Parent.TrajectoryObject)

local TrajectoryHolderObject = {}

--[=[
	Creates a new TrajectoryHolderObject instance.
]=]
function TrajectoryHolderObject.new(
	position: Vector3,
	velocity: Vector3,
	orbitingBody: Modules.GravityBody?
): Modules.TrajectoryHolderObject
	return TrajectoryHolderObject.from(SolarSystemObject.new(position, velocity), orbitingBody)
end

--[=[
	Creates a new TrajectoryHolderObject instance.
]=]
function TrajectoryHolderObject.from(
	solarSystemObject: Modules.SolarSystemObject,
	orbitingBody: Modules.GravityBody?
): Modules.TrajectoryHolderObject
	local newTrajectoryHolderObject = table.clone(TrajectoryHolderObject)

	local metatable = {
		__index = solarSystemObject,
		__type = "TrajectoryHolderObject",
	}

	setmetatable(newTrajectoryHolderObject, metatable)

	-- generate next trajectories
	newTrajectoryHolderObject.allTrajectories = {
		{ relativeTime = 0, trajectory = TrajectoryObject.from(solarSystemObject, orbitingBody) },
	}

	return newTrajectoryHolderObject
end

--[=[
	Returns the current trajectory and the time it starts, relative to the start of this TrajectoryHolderObjects (represented by relativeTime = 0).
]=]
function TrajectoryHolderObject:CurrentTrajectorySegment(
	relativeTime: number
): { relativeTime: number, trajectory: Modules.TrajectoryObject }
	for i = #self.allTrajectories, 0, -1 do
		local thisTrajectorySegment: { relativeTime: number, trajectory: Modules.TrajectoryObject } =
			self.allTrajectories[i]

		if thisTrajectorySegment.relativeTime <= relativeTime then
			-- print(`Trajectory segment: {i}`)
			-- print(`relativeTime: {relativeTime}`)
			return thisTrajectorySegment
		end
	end

	error(`No trajectory found for the current time ({relativeTime})!`)
end

--[=[
	Returns the current trajectory.
]=]
function TrajectoryHolderObject:CurrentTrajectory(relativeTime: number): Modules.TrajectoryObject
	return self:CurrentTrajectorySegment(relativeTime).trajectory
end

--[=[
	Returns the GravityBody currently being orbited, or nil if there is none.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryHolderObject:OrbitingBody(relativeTime: number): Modules.GravityBody?
	return self:CurrentTrajectory(relativeTime).OrbitingBody
end

--[=[
	Returns the apoapsis, or nil if there is no GravityBody currently being orbited.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryHolderObject:OrbitalPeriod(relativeTime: number): number?
	return self:CurrentTrajectory(relativeTime):OrbitalPeriod()
end

--[=[
	Returns the apoapsis, or nil if there is no GravityBody currently being orbited.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryHolderObject:CurrentApoapsis(relativeTime: number): Modules.MovingObject?
	return self:CurrentTrajectory(relativeTime):Apoapsis()
end

--[=[
	Returns the periapsis, or nil if there is no GravityBody currently being orbited.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryHolderObject:CurrentPeriapsis(relativeTime: number): Modules.MovingObject?
	return self:CurrentTrajectory(relativeTime):Periapsis()
end

--[=[
	Returns the semi major axis, or nil if there is no GravityBody currently being orbited.
	https://en.wikipedia.org/wiki/Vis-viva_equation
]=]
function TrajectoryHolderObject:SemiMajorAxis(relativeTime: number): number?
	return self:CurrentTrajectory(relativeTime):SemiMajorAxis()
end

--[=[
	Returns the semi minor axis, or nil if there is no GravityBody currently being orbited.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryHolderObject:SemiMinorAxis(relativeTime: number): number?
	return self:CurrentTrajectory(relativeTime):SemiMinorAxis()
end

--[=[
	Returns the eccentricity, or nil if there is no GravityBody currently being orbited.
	https://en.wikipedia.org/wiki/Eccentricity_vector
]=]
function TrajectoryHolderObject:Eccentricity(relativeTime: number): number?
	return self:CurrentTrajectory(relativeTime):Eccentricity()
end

--[=[
	@return The next TrajectoryObject, or nil if the curent trajectory does not enter any new SOI.
]=]
function TrajectoryHolderObject:CalculateNextTrajectory(): Modules.TrajectoryObject?
	local lastTrajectory: Modules.TrajectoryObject = self.allTrajectories[#self.allTrajectories].trajectory
	local nextTrajectory: Modules.TrajectoryObject? = lastTrajectory:NextTrajectory()

	local n = Instance.new("Part")
	local qwe = self.allTrajectories[#self.allTrajectories].trajectory
	n.Position = (qwe.Position * Constants.SOLAR_SYSTEM_SCALE)
		+ if qwe.OrbitingBody then qwe.OrbitingBody.RootPart.Position else Vector3.zero
	n.Anchored = true
	n.Shape = Enum.PartType.Ball
	n.Size = Vector3.one
	n.Name = `TESTINGGG #{#self.allTrajectories}`
	n.Parent = workspace

	if nextTrajectory then
		local lastRelativeTime: number = self.allTrajectories[#self.allTrajectories].relativeTime
		local relativeTimeOfNextTrajectory: number
		if -- going out of an SOI
			(
				lastTrajectory.OrbitingBody
				and nextTrajectory.OrbitingBody
				and table.find(nextTrajectory.OrbitingBody.ChildGravityBodies, lastTrajectory.OrbitingBody)
			) or (lastTrajectory.OrbitingBody and nextTrajectory.OrbitingBody == nil)
		then
			relativeTimeOfNextTrajectory =
				lastTrajectory:CalculateTimeFromPoint(nextTrajectory.Position - lastTrajectory.OrbitingBody.Position)
		else -- going into an SOI
			assert(
				nextTrajectory.OrbitingBody,
				`next trajectory should be going into an SOI but has no SOI ({nextTrajectory})`
			)
			relativeTimeOfNextTrajectory =
				lastTrajectory:CalculateTimeFromPoint(nextTrajectory.Position + nextTrajectory.OrbitingBody.Position)
		end
		print(`Making trajectory {#self.allTrajectories + 1}...`)
		print("last relativeTime")
		print(lastRelativeTime)
		print("initial position")
		print(nextTrajectory.Position)
		print("relativeTime")
		print(relativeTimeOfNextTrajectory)

		local n = Instance.new("Part")
		local qwe = self.allTrajectories[#self.allTrajectories].trajectory
		n.Position = (qwe.Position * Constants.SOLAR_SYSTEM_SCALE)
			+ if qwe.OrbitingBody then qwe.OrbitingBody.RootPart.Position else Vector3.zero
		n.Anchored = true
		n.Shape = Enum.PartType.Ball
		n.Size = Vector3.one
		n.Name = `TESTINGGG #{#self.allTrajectories + 1}`
		n.Parent = workspace

		table.insert(self.allTrajectories, { relativeTime = relativeTimeOfNextTrajectory, trajectory = nextTrajectory })

		return nextTrajectory
	else
		return nil
	end
end

--[=[
	ru8sthfgbivjkrst
]=]
function TrajectoryHolderObject:CalculatePointFromTime(relativeTime: number): Modules.MovingObject
	-- determine trajectory segment
	local chosenTrajectorySegment = self:CurrentTrajectorySegment(relativeTime)

	local resultPoint: Modules.MovingObject =
		chosenTrajectorySegment.trajectory:CalculatePointFromTime(relativeTime - chosenTrajectorySegment.relativeTime)

	-- assert(resultPoint.Position == resultPoint.Position, `nan`)
	return resultPoint
end

--[=[
	ru8sthfgbivjkrst
]=]
function TrajectoryHolderObject:CalculateTimeFromPoint(position: Vector3, orbitingBody: Modules.GravityBody): number?
	-- find which trajectories are in the same SOI
	-- find the closest point by comparing results for Magnitude(trajectory:CalculatePointFromTime(trajectory:CalculateTimeFromPoint(position)).Position - position)
	return
end

--[=[
	ru8sthfgbivjkrst
]=]
function TrajectoryHolderObject:Step(delta: number, withAcceleration: Vector3?): Modules.TrajectoryHolderObject
	return self
end

--[=[
	@param relativeTime The time since the start of the first trajectory.
]=]
function TrajectoryHolderObject:AtTime(relativeTime: number, withAcceleration: Vector3?): Modules.TrajectoryHolderObject
	local newVelocity: Vector3 = self.Velocity
	local newPosition: Vector3 = self.Position

	if withAcceleration then
		newVelocity += withAcceleration
	end

	local newTrajectoryHolderObject: Modules.TrajectoryHolderObject =
		TrajectoryHolderObject.new(newPosition, newVelocity, self:OrbitingBody(relativeTime))

	local nextState: Modules.MovingObject = newTrajectoryHolderObject:CalculatePointFromTime(relativeTime)

	-- print(`step, before: {newTrajectoryObject:getSuper():getSuper().Position}`)
	-- print(`step, after: {nextState.Position}`)
	-- print(`distance: {Magnitude(newTrajectoryObject:getSuper():getSuper().Position - nextState.Position)}`)
	newTrajectoryHolderObject:getSuper():setSuper(nextState)
	return newTrajectoryHolderObject
end

--[=[
	ru8sthfgbivjkrst
]=]
function TrajectoryHolderObject:Increment(
	delta: number,
	recursions: number,
	withAcceleration: Vector3?
): Modules.TrajectoryHolderObject
	return self
end

--[=[
	ru8sthfgbivjkrst
]=]
function TrajectoryHolderObject:CalculateTrajectory(delta: number, recursions: number): { Modules.MovingObject }
	return self:getSuper():getSuper()
end

--[=[
	ru8sthfgbivjkrst
]=]
function TrajectoryHolderObject:DisplayTrajectory(resolution: number): Folder
	-- add everything to workspace in a nice file hierarchy
	local newTrajectoryFolder: Folder = Instance.new("Folder")
	newTrajectoryFolder.Name = "SegmentedTrajectoryLine"

	-- get all the trajectories and put in folder
	local trajectoryIndex: number = 1
	local thisTrajectory: Modules.TrajectoryObject = self.allTrajectories[trajectoryIndex].trajectory
	local nextTrajectory: Modules.TrajectoryObject? = if #self.allTrajectories > trajectoryIndex
		then self.allTrajectories[trajectoryIndex + 1].trajectory
		else self:CalculateNextTrajectory()

	while nextTrajectory ~= nil do
		local trajectoryFolder: Folder = thisTrajectory:DisplayTrajectory(
			(
				self.allTrajectories[trajectoryIndex + 1].relativeTime
				- self.allTrajectories[trajectoryIndex].relativeTime
			) / resolution,
			resolution
		)

		trajectoryFolder.Parent = newTrajectoryFolder

		trajectoryIndex += 1
		thisTrajectory = nextTrajectory
		nextTrajectory = if #self.allTrajectories > trajectoryIndex
			then self.allTrajectories[trajectoryIndex + 1].trajectory
			else self:CalculateNextTrajectory()
	end
	local lastTrajectoryFolder: Folder = thisTrajectory:DisplayTrajectory(
		(
			if thisTrajectory.OrbitingBody
				then thisTrajectory:OrbitalPeriod()
				else Magnitude(thisTrajectory.Velocity) * 1e5
		) / resolution,
		resolution
	)

	lastTrajectoryFolder.Parent = newTrajectoryFolder

	newTrajectoryFolder.Parent = workspace.Orbits

	return newTrajectoryFolder
end

return TrajectoryHolderObject

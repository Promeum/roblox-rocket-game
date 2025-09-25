--!strict

local TemporalPosition = require(game.ReplicatedStorage.Modules.BaseModule.TemporalPosition)
local Vector3D = require(game.ReplicatedStorage.Modules.Libraries.Vector3D)
local Modules = require(game.ReplicatedStorage.Modules.Modules)
local Constants = require(game.ReplicatedStorage.Modules.Constants)
local MovingObject = require(script.Parent.Parent.Parent.MovingObject)
local SolarSystemObject = require(script.Parent.Parent.SolarSystemObject)
local TrajectoryObject = require(script.Parent.TrajectoryObject)

local TrajectoryHolderObject = { __type = "TrajectoryHolderObject" :: "TrajectoryHolderObject" }

--[=[
	Creates a new TrajectoryHolderObject instance.
]=]
function TrajectoryHolderObject.new(
	position: Modules.Vector3D,
	velocity: Modules.Vector3D,
	temporalPosition: Modules.TemporalPosition,
	orbitingBody: Modules.GravityBody?
): Modules.TrajectoryHolderObject
	return TrajectoryHolderObject.fromSolarSystemObject(SolarSystemObject.new(position, velocity, temporalPosition, orbitingBody))
end

--[=[
	Creates a new TrajectoryHolderObject instance.
]=]
function TrajectoryHolderObject.fromSolarSystemObject(solarSystemObject: Modules.SolarSystemObject): Modules.TrajectoryHolderObject
	local newTrajectoryHolderObject = table.clone(TrajectoryHolderObject)

	local metatable = {
		__index = solarSystemObject,
	}

	setmetatable(newTrajectoryHolderObject, metatable)

	-- generate next trajectories
	newTrajectoryHolderObject.allTrajectories = {
		{ relativeTime = 0, trajectory = TrajectoryObject.fromSolarSystemObject(solarSystemObject) },
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
		local thisTrajectorySegment = self.allTrajectories[i]

		if thisTrajectorySegment.relativeTime <= relativeTime then
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
function TrajectoryHolderObject:OrbitalPeriod(relativeTime: number?): number?
	local adjustedRelativeTime: number = relativeTime or 0
	local currentTrajectory = self:CurrentTrajectory(adjustedRelativeTime).Orbit
	
	if currentTrajectory then
		return currentTrajectory:OrbitalPeriod()
	else
		error("OrbitalPeriod cannot be called on a TrajectoryHolderObject when there is no GravityBody currently being orbited")
	end
end

--[=[
	Returns the apoapsis, or nil if there is no GravityBody currently being orbited.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryHolderObject:CurrentApoapsis(relativeTime: number?): Modules.MovingObject?
	local adjustedRelativeTime: number = relativeTime or 0
	local currentTrajectory = self:CurrentTrajectory(adjustedRelativeTime).Orbit
	
	if currentTrajectory then
		return currentTrajectory:Apoapsis()
	else
		error("CurrentApoapsis cannot be called on a TrajectoryHolderObject when there is no GravityBody currently being orbited")
	end
end

--[=[
	Returns the periapsis, or nil if there is no GravityBody currently being orbited.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryHolderObject:CurrentPeriapsis(relativeTime: number?): Modules.MovingObject?
	local adjustedRelativeTime: number = relativeTime or 0
	local currentTrajectory = self:CurrentTrajectory(adjustedRelativeTime).Orbit
	
	if currentTrajectory then
		return currentTrajectory:Periapsis()
	else
		warn("CurrentPeriapsis cannot be called on a TrajectoryHolderObject when there is no GravityBody currently being orbited")
		return nil
	end
end

--[=[
	Returns the semi major axis, or nil if there is no GravityBody currently being orbited.
	https://en.wikipedia.org/wiki/Vis-viva_equation
]=]
function TrajectoryHolderObject:SemiMajorAxis(relativeTime: number?): number?
	local adjustedRelativeTime: number = relativeTime or 0
	local currentTrajectory = self:CurrentTrajectory(adjustedRelativeTime).Orbit
	
	if currentTrajectory then
		return currentTrajectory:SemiMajorAxis()
	else
		warn("SemiMajorAxis cannot be called on a TrajectoryHolderObject when there is no GravityBody currently being orbited")
		return nil
	end
end

--[=[
	Returns the semi minor axis, or nil if there is no GravityBody currently being orbited.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryHolderObject:SemiMinorAxis(relativeTime: number?): number?
	local adjustedRelativeTime: number = relativeTime or 0
	local currentTrajectory = self:CurrentTrajectory(adjustedRelativeTime).Orbit
	
	if currentTrajectory then
		return currentTrajectory:SemiMinorAxis()
	else
		warn("SemiMinorAxis cannot be called on a TrajectoryHolderObject when there is no GravityBody currently being orbited")
		return nil
	end
end

--[=[
	Returns the eccentricity, or nil if there is no GravityBody currently being orbited.
	https://en.wikipedia.org/wiki/Eccentricity_vector
]=]
function TrajectoryHolderObject:Eccentricity(relativeTime: number?): number?
	local adjustedRelativeTime: number = relativeTime or 0
	local currentTrajectory = self:CurrentTrajectory(adjustedRelativeTime).Orbit
	
	if currentTrajectory then
		return currentTrajectory:Eccentricity()
	else
		warn("Eccentricity cannot be called on a TrajectoryHolderObject when there is no GravityBody currently being orbited")
		return nil
	end
end

--[=[
	@return The next TrajectoryObject, or nil if the curent trajectory does not enter any new SOI.
]=]
function TrajectoryHolderObject:CalculateNextTrajectory(): Modules.TrajectoryObject?
	local lastTrajectory: Modules.TrajectoryObject = self.allTrajectories[#self.allTrajectories].trajectory
	local timeOfLastTrajectory: number = self.allTrajectories[#self.allTrajectories].relativeTime
	local nextTrajectory: Modules.TrajectoryObject?,
		relativeTimeOfNextTrajectory: Modules.TemporalPosition? = lastTrajectory:NextTrajectory()

	--local n = Instance.new("Part")
	--local qwe = lastTrajectory
	--n.Position = qwe:CalculateWorkspacePosition():ToVector3()
	--n.Anchored = true
	--n.Shape = Enum.PartType.Ball
	--n.Size = Vector3.one * 0.1
	--n.Name = `TESTINGGG #{#self.allTrajectories} - a`
	--n.BrickColor = BrickColor.new("New Yeller")
	--n.Parent = workspace

	if nextTrajectory and relativeTimeOfNextTrajectory then
		local timeOfNextTrajectory: number = relativeTimeOfNextTrajectory.RelativeTime + timeOfLastTrajectory
		--local n = Instance.new("Part")
		--local qwe = nextTrajectory
		--n.Position = qwe:CalculateWorkspacePosition():ToVector3()
		--n.Anchored = true
		--n.Shape = Enum.PartType.Ball
		--n.Size = Vector3.one * 0.1
		--n.Name = `TESTINGGG #{#self.allTrajectories} - b`
		--n.BrickColor = BrickColor.new("New Yeller")
		--n.Parent = workspace

		table.insert(self.allTrajectories, { relativeTime = timeOfNextTrajectory, trajectory = nextTrajectory })

		return nextTrajectory
	else
		return nil
	end
end

--[=[
	ru8sthfgbivjkrst
]=]
function TrajectoryHolderObject:CalculatePointFromTime(relativeTime: number): Modules.MovingObject
	local chosenTrajectorySegment = self:CurrentTrajectorySegment(relativeTime) -- determine trajectory segment

	return chosenTrajectorySegment.trajectory:CalculatePointFromTime(relativeTime - chosenTrajectorySegment.relativeTime)
end

--[=[
	ru8sthfgbivjkrst
]=]
function TrajectoryHolderObject:CalculateTimeFromPoint(position: Modules.Vector3D, orbitingBody: Modules.GravityBody): number?
	-- find which trajectories are in the same SOI
	-- find the closest point by comparing results for Magnitude(trajectory:CalculatePointFromTime(trajectory:CalculateTimeFromPoint(position)).Position - position)
	error("not implemented yet")
	return
end

--[=[
	ru8sthfgbivjkrst
]=]
function TrajectoryHolderObject:Step(delta: number, withAcceleration: Modules.Vector3D?): Modules.TrajectoryHolderObject
	error("not implemented yet")
	return self
end

--[=[
	@param relativeTime The time since the start of the first trajectory.
]=]
function TrajectoryHolderObject:AtTime(relativeTime: number, withAcceleration: Modules.Vector3D?): Modules.TrajectoryHolderObject
	local newVelocity: Modules.Vector3D = self.Velocity
	local newPosition: Modules.Vector3D = self.Position

	if withAcceleration then
		newVelocity += withAcceleration
	end

	local newTrajectoryHolderObject: Modules.TrajectoryHolderObject =
		TrajectoryHolderObject.new(newPosition, newVelocity, self.TemporalPosition:fromTemporalPosition(relativeTime), self:OrbitingBody(relativeTime))

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
	withAcceleration: Modules.Vector3D?
): Modules.TrajectoryHolderObject
	error("not implemented yet")
	return self
end

--[=[
	ru8sthfgbivjkrst
]=]
function TrajectoryHolderObject:CalculatePoints(delta: number, recursions: number): { Modules.MovingObject }
	error("not implemented yet")
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
	local nextTrajectory: Modules.TrajectoryObject?

	if #self.allTrajectories > trajectoryIndex then
		nextTrajectory = self.allTrajectories[trajectoryIndex + 1].trajectory
	else
		nextTrajectory = self:CalculateNextTrajectory()
	end

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

		if #self.allTrajectories > trajectoryIndex then
			nextTrajectory = self.allTrajectories[trajectoryIndex + 1].trajectory
		else
			nextTrajectory = self:CalculateNextTrajectory()
		end
	end

	local lastTrajectoryFolder: Folder

	if thisTrajectory.Orbit then
		local orbitalPeriod: number = thisTrajectory.Orbit:OrbitalPeriod()
		assert(orbitalPeriod, "Not all trajectories are calculated")

		lastTrajectoryFolder = thisTrajectory:DisplayTrajectory(
			orbitalPeriod / resolution,
			resolution
		)
	else
		lastTrajectoryFolder = thisTrajectory:DisplayTrajectory(
			(thisTrajectory.Velocity:Magnitude() * 1e5) / resolution,
			resolution
		)
	end

	lastTrajectoryFolder.Parent = newTrajectoryFolder
	newTrajectoryFolder.Parent = workspace.Orbits

	return newTrajectoryFolder
end

return TrajectoryHolderObject

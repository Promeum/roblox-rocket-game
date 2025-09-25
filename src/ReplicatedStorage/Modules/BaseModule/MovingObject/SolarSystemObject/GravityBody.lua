--!strict

local TemporalPosition = require(game.ReplicatedStorage.Modules.BaseModule.TemporalPosition)
local Modules = require(game.ReplicatedStorage.Modules.Modules)
local Constants = require(game.ReplicatedStorage.Modules.Constants)
local SolarSystemObject = require(script.Parent.Parent.SolarSystemObject)
local TrajectoryObject =
	require(game.ReplicatedStorage.Modules.BaseModule.MovingObject.SolarSystemObject.TrajectoryObject)

local GravityBody = { __type = "GravityBody" :: "GravityBody" }

--[=[
	Creates a new GravityBody instance.
]=]
function GravityBody.new(
	position: Modules.Vector3D,
	velocity: Modules.Vector3D,
	part: Part,
	mass: number,
	SOIRadius: number,
	orbitingBody: Modules.GravityBody?
): Modules.GravityBody
	local newGravityBody = table.clone(GravityBody)

	newGravityBody.RootPart = part
	newGravityBody.Mass = mass
	-- newGravityBody.SOIRadius = SOIRadius
	newGravityBody.ParentGravityBody = orbitingBody
	newGravityBody.ChildGravityBodies = {}
	newGravityBody.ChildSolarSystemPhysicsBodies = {}

	local super = SolarSystemObject.new(position, velocity, TemporalPosition.new(0), orbitingBody)

	local metatable = {
		__index = super,
	}

	setmetatable(newGravityBody, metatable)

	newGravityBody.Trajectory = TrajectoryObject.fromSolarSystemObject(newGravityBody:getSuper())

	if orbitingBody then
		newGravityBody.SOIRadius = newGravityBody.Trajectory.Orbit:SemiMajorAxis()
			* ( mass / orbitingBody.Mass ) ^ 0.4

		table.insert(orbitingBody.ChildGravityBodies, newGravityBody)
	else
		newGravityBody.SOIRadius = SOIRadius
	end

	return newGravityBody
end

--[=[
	Returns the standard gravitational parameter.
	https://en.wikipedia.org/wiki/Standard_gravitational_parameter
]=]
function GravityBody:StandardGravitationalParameter(): number
	return Constants.GRAVITATIONAL_CONSTANT * self.Mass
end

--[=[
	Returns the velocity required to orbit this GravityBody.
]=]
function GravityBody:OrbitalVelocity(): number
	error("Not implemented")
end

--[=[
	Returns the velocity required to escape the SOI of this GravityBody.
]=]
function GravityBody:EscapeVelocity(): number
	error("Not implemented")
end

--[=[
	Increments this GravityBody in time, then returns itself.
]=]
function GravityBody:Update(time: number): Modules.GravityBody
	if self.Trajectory then
		local nextPosition: Modules.SolarSystemObject = SolarSystemObject.fromMovingObject(
			self.Trajectory:CalculatePointFromTime(time),
			TemporalPosition.new(time),
			self.OrbitingBody
		)

		self:setSuper(nextPosition)

		self.RootPart.CFrame = CFrame.new(self:CalculateWorkspacePosition():ToVector3())

		-- local n = Instance.new("Part")
		-- n.Position = (self.Position * Constants.SOLAR_SYSTEM_SCALE)
		-- 	+ if self.ParentGravityBody then self.ParentGravityBody.RootPart.Position else Vector3D.zero
		-- n.Anchored = true
		-- n.Shape = Enum.PartType.Ball
		-- n.Size = Vector3D.one
		-- n.Parent = workspace.Planets

		-- print(`updated {self}\n  Position: ({nextPosition.Position})\n  Velocity: ({nextPosition.Velocity})`)
	end

	return self
end

return GravityBody

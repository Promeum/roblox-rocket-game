local Modules = require(game.ReplicatedStorage.Modules.Modules)
local Constants = require(game.ReplicatedStorage.Modules.Constants)
local SolarSystemObject = require(script.Parent.Parent.Parent.SolarSystemObject)
local TrajectoryObject =
	require(game.ReplicatedStorage.Modules.BaseModuleFolder.MovingObjectFolder.SolarSystemObjectFolder.TrajectoryObject)

local GravityBody = {}

--[=[
	Creates a new GravityBody instance.
]=]
function GravityBody.new(
	position: Vector3,
	velocity: Vector3,
	part: Part,
	mass: number,
	SOIRadius: number,
	OrbitingBody: Modules.GravityBody?
): Modules.GravityBody
	local newGravityBody = table.clone(GravityBody)

	newGravityBody.RootPart = part
	newGravityBody.Mass = mass
	newGravityBody.SOIRadius = SOIRadius
	newGravityBody.ParentGravityBody = OrbitingBody
	newGravityBody.ChildGravityBodies = {}
	newGravityBody.ChildSolarSystemPhysicsBodies = {}

	local super = SolarSystemObject.new(position, velocity)

	local metatable = {
		__index = super,
		__type = "GravityBody",
	}

	setmetatable(newGravityBody, metatable)

	newGravityBody.Trajectory = TrajectoryObject.from(newGravityBody:getSuper(), OrbitingBody)

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
	return 0
end

--[=[
	Returns the velocity required to escape the SOI of this GravityBody.
]=]
function GravityBody:EscapeVelocity(): number
	return 0
end

--[=[
	Increments this GravityBody in time, then returns itself.
]=]
function GravityBody:Update(delta: number): Modules.GravityBody
	if self.Trajectory then
		local nextPosition: Modules.TrajectoryObject = self.Trajectory:Step(delta) -- problem here this is NAN
		print("no nan            vvvv")
		print(nextPosition:getSuper():getSuper())
		self:getSuper():setSuper(nextPosition:getSuper():getSuper())

		self.RootPart.Position = self.CalculateWorkspacePosition(self.Position, self.ParentGravityBody)

		-- local n = Instance.new("Part")
		-- n.Position = (self.Position * Constants.SOLAR_SYSTEM_SCALE)
		-- 	+ if self.ParentGravityBody then self.ParentGravityBody.RootPart.Position else Vector3.zero
		-- n.Anchored = true
		-- n.Shape = Enum.PartType.Ball
		-- n.Size = Vector3.one
		-- n.Parent = workspace.Planets

		-- print(`updated {self}\n  Position: ({nextPosition.Position})\n  Velocity: ({nextPosition.Velocity})`)
	end

	return self
end

return GravityBody

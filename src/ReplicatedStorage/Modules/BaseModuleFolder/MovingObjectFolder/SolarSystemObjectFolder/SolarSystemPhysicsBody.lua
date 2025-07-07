--!strict

local Modules = require(game.ReplicatedStorage.Modules.Modules)
local Constants = require(game.ReplicatedStorage.Modules.Constants)
local SolarSystemObject = require(script.Parent.Parent.SolarSystemObject)
local TrajectoryObject = require(script.Parent.TrajectoryObject)

local SolarSystemPhysicsBody = {}

--[=[
	Creates a new SolarSystemBody instance.
]=]
function SolarSystemPhysicsBody.new(
	position: Vector3,
	velocity: Vector3,
	part: Part,
	inSOIOf: Modules.GravityBody?
): Modules.SolarSystemPhysicsBody
	local newSolarSystemPhysicsBody = table.clone(SolarSystemPhysicsBody)

	local superInstance = SolarSystemObject.new(position, velocity)

	local metatable = {
		__index = superInstance,
		__type = "SolarSystemPhysicsBody",
	}

	setmetatable(newSolarSystemPhysicsBody, metatable)

	newSolarSystemPhysicsBody.RootPart = part
	newSolarSystemPhysicsBody.ParentGravityBody = inSOIOf
	newSolarSystemPhysicsBody.Trajectory = TrajectoryObject.from(superInstance, inSOIOf)

	return newSolarSystemPhysicsBody
end

--[=[
	Updates the position and velocity by applying gravity, optionally force changing select values
]=]
function SolarSystemPhysicsBody:Update(
	delta: number,
	toChange: {
		position: Vector3?,
		velocity: Vector3?,
		acceleration: Vector3?,
		inSOIOf: Modules.GravityBody?,
	}
): Modules.TrajectoryObject
	-- apply physics
	local nextPosition: Modules.TrajectoryObject =
		self.Trajectory:Step(delta, if toChange and toChange.acceleration then toChange.acceleration else nil)

	self:getSuper():setSuper(nextPosition:getSuper())

	self.RootPart.Position = self.CalculateWorkspacePosition(self.Position, self.ParentGravityBody)

	-- assert(typeof(self) == "SolarSystemPhysicsBody", `self is not a SolarSystemPhysicsBody {self}`)
	local n = Instance.new("Part")

	n.Position = (self.Position * Constants.SOLAR_SYSTEM_SCALE)
		+ if self.ParentGravityBody then self.ParentGravityBody.RootPart.Position else Vector3.zero
	n.Anchored = true
	n.Shape = Enum.PartType.Ball
	n.Size = Vector3.one
	n.Parent = workspace.Planets
	--self.RootPart.GravityVectorForce.Force = totalGravityForce
	--self.RootPart:ApplyImpulse(totalGravityForce * 0.01)

	print(`applied gravity to {self}\n  Vector3({nextPosition.Velocity})\n  Magnitude: {nextPosition.Velocity}`)

	return nextPosition
end

return SolarSystemPhysicsBody

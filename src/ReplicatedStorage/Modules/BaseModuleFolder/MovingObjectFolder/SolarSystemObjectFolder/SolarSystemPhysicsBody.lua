local Modules = require(game.ReplicatedStorage.Modules.Modules)
-- local Constants = require(game.ReplicatedStorage.Modules.Constants)
local SolarSystemObject = require(script.Parent.Parent.SolarSystemObject)
local TrajectoryHolderObject = require(script.Parent.TrajectoryHolderObject)
-- local TrajectoryObject = require(script.Parent.TrajectoryObject)

local SolarSystemPhysicsBody = {}

--[=[
	Creates a new SolarSystemBody instance.
]=]
function SolarSystemPhysicsBody.new(
	position: Modules.Vector3B,
	velocity: Modules.Vector3B,
	part: Part,
	inSOIOf: Modules.GravityBody?
): Modules.SolarSystemPhysicsBody
	return SolarSystemPhysicsBody.from(SolarSystemObject.new(position, velocity), part, inSOIOf)
end

--[=[
	Creates a new SolarSystemBody instance.
]=]
function SolarSystemPhysicsBody.from(
	solarSystemObject: Modules.SolarSystemObject,
	part: Part,
	inSOIOf: Modules.GravityBody?
): Modules.SolarSystemPhysicsBody
	local newSolarSystemPhysicsBody = table.clone(SolarSystemPhysicsBody)

	local newSolarSystemObject: Modules.SolarSystemObject =
		SolarSystemObject.new(solarSystemObject.Position, solarSystemObject.Velocity)

	local metatable = {
		__index = newSolarSystemObject,
		__type = "SolarSystemPhysicsBody",
	}

	setmetatable(newSolarSystemPhysicsBody, metatable)

	newSolarSystemPhysicsBody.RootPart = part
	newSolarSystemPhysicsBody.ParentGravityBody = inSOIOf
	newSolarSystemPhysicsBody.TrajectoryHolder = TrajectoryHolderObject.from(newSolarSystemObject, inSOIOf)

	return newSolarSystemPhysicsBody
end

--[=[
	Updates the position and velocity by applying gravity, optionally force changing select values
]=]
function SolarSystemPhysicsBody:Update(
	time: number,
	toChange: {
		position: Modules.Vector3B?,
		velocity: Modules.Vector3B?,
		acceleration: Modules.Vector3B?,
		inSOIOf: Modules.GravityBody?,
	}
): Modules.MovingObject
	-- apply physics
	-- print(self.Position)
	local nextPosition: Modules.MovingObject = self.TrajectoryHolder:CalculatePointFromTime(time)
	-- local nextPosition: Modules.MovingObject

	-- if toChange and toChange.acceleration then
	-- 	nextPosition = self.TrajectoryHolder:AtTime(time, toChange.acceleration)
	-- else
	-- 	nextPosition = self.TrajectoryHolder:AtTime(time)
	-- end
	self:getSuper():setSuper(table.clone(nextPosition))

	self.RootPart.Position = self.CalculateWorkspacePosition(self.Position, self.ParentGravityBody)

	-- local n = Instance.new("Part")

	-- n.Position = (self.Position * Constants.SOLAR_SYSTEM_SCALE)
	-- 	+ if self.ParentGravityBody then self.ParentGravityBody.RootPart.Position else Vector3.zero
	-- n.Anchored = true
	-- n.Shape = Enum.PartType.Ball
	-- n.Size = Vector3.one
	-- n.Parent = workspace.Planets

	return nextPosition
end

return SolarSystemPhysicsBody

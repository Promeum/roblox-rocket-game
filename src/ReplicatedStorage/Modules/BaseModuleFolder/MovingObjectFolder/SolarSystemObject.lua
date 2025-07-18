--!strict

local Constants = require(game.ReplicatedStorage.Modules.Constants)
local Modules = require(game.ReplicatedStorage.Modules.Modules)
local MovingObject = require(script.Parent.Parent.MovingObject)

local SolarSystemObject = {}

--[=[
	Creates a new SolarSystemObject instance.
]=]
function SolarSystemObject.new(position: Vector3, velocity: Vector3): Modules.SolarSystemObject
	return SolarSystemObject.from(MovingObject.new(position, velocity))
end

--[=[
	Creates a new SolarSystemObject instance, with a given MovingObject super-instance.
	This effectively links this instance with other objects with the same super-instance.
]=]
function SolarSystemObject.from(movingObject: Modules.MovingObject): Modules.SolarSystemObject
	local newSolarSystemObject = table.clone(SolarSystemObject)

	local metatable = {
		__index = movingObject,
		__type = "SolarSystemObject",
	}

	setmetatable(newSolarSystemObject, metatable)

	return newSolarSystemObject
end

function SolarSystemObject.CalculateWorkspacePosition(newPosition: Vector3, OrbitingBody: Modules.GravityBody?): Vector3
	local Position = if newPosition then newPosition else Vector3.zero
	Position *= Constants.SOLAR_SYSTEM_SCALE

	if OrbitingBody then
		Position += OrbitingBody.RootPart.Position
	end

	return Position
end

return SolarSystemObject

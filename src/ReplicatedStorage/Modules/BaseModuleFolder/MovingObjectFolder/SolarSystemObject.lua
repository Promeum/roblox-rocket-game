--!strict

local Constants = require(game.ReplicatedStorage.Modules.Constants)
local Modules = require(game.ReplicatedStorage.Modules.Modules)
local Vector3B = require(game.ReplicatedStorage.Modules.BaseModuleFolder.Vector3B)
local MovingObject = require(script.Parent.Parent.MovingObject)

local SolarSystemObject = {}

--[=[
	Creates a new SolarSystemObject instance.
]=]
function SolarSystemObject.new(position: Modules.Vector3B, velocity: Modules.Vector3B): Modules.SolarSystemObject
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

function SolarSystemObject.CalculateWorkspacePosition(newPosition: Modules.Vector3B, OrbitingBody: Modules.GravityBody?): Modules.Vector3B
	local Position = if newPosition then newPosition else Vector3B.zero
	Position *= Constants.SOLAR_SYSTEM_SCALE

	if OrbitingBody then
		Position += Vector3B.fromVector3(OrbitingBody.RootPart.Position)
	end

	return Position
end

return SolarSystemObject

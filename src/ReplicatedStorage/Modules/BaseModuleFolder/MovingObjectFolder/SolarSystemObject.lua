--!strict

local Constants = require(game.ReplicatedStorage.Modules.Constants)
local Modules = require(game.ReplicatedStorage.Modules.Modules)
local MovingObject = require(script.Parent.Parent.MovingObject)

local SolarSystemObject = {}

--[=[
	Creates a new SolarSystemObject instance.
]=]
function SolarSystemObject.new(position: Vector3, velocity: Vector3): Modules.SolarSystemObject
	local newSolarSystemObject = table.clone(SolarSystemObject)

	local metatable = {
		__index = MovingObject.new(position, velocity),
		__type = "MovingObject",
	}

	setmetatable(newSolarSystemObject, metatable)

	return newSolarSystemObject
end

function SolarSystemObject.CalculateWorkspacePosition(newPosition: Vector3, OrbitingBody: Modules.GravityBody?): Vector3
	local Position = if newPosition then newPosition else Vector3.zero
	Position *= Constants.SOLAR_SYSTEM_SCALE

	local ParentGravityBody: any = OrbitingBody
	while ParentGravityBody do
		Position += ParentGravityBody.RootPart.Position
		ParentGravityBody = ParentGravityBody.ParentGravityBody
	end
	return Position
end

return SolarSystemObject

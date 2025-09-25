--!strict

local Modules = require(game.ReplicatedStorage.Modules.Modules)
local BaseModule = require(script.Parent.Parent.BaseModule)

local MovingObject = { __type = "MovingObject" :: "MovingObject" }

--[=[
	Creates a new MovingObject instance.
]=]
function MovingObject.new(position: Modules.Vector3D, velocity: Modules.Vector3D): Modules.MovingObject
	local newMovingObject = table.clone(MovingObject)

	newMovingObject.Position = position
	newMovingObject.Velocity = velocity

	local metatable = {
		__index = BaseModule.new(),
		__add = function(self: Modules.MovingObject, other: Modules.MovingObject): Modules.MovingObject
			return MovingObject.new(self.Position + other.Position, self.Velocity + other.Velocity)
		end,
		__sub = function(self: Modules.MovingObject, other: Modules.MovingObject): Modules.MovingObject
			return MovingObject.new(self.Position - other.Position, self.Velocity - other.Velocity)
		end,
	}

	setmetatable(newMovingObject, metatable)

	return newMovingObject
end

return MovingObject

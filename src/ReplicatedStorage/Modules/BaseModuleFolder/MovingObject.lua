--!strict

local Modules = require(game.ReplicatedStorage.Modules.Modules)
local BaseModule = require(script.Parent.Parent.BaseModule)

local MovingObject = {}

--[=[
	Creates a new MovingObject instance.
]=]
function MovingObject.new(position: Vector3, velocity: Vector3): Modules.MovingObject
	local newMovingObject = table.clone(MovingObject)

	newMovingObject.Position = position
	newMovingObject.Velocity = velocity

	local metatable = {
		__index = BaseModule.new(),
		__type = "MovingObject",
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

--[=[
	Calculates the point at which this MovingObject will reach relativeTime seconds from now.
	Note: relativeTime can be negative.
]=]
function MovingObject:CalculatePointFromTime(relativeTime: number): Modules.MovingObject
	return MovingObject.new(self.Position + self.Velocity * relativeTime, self.Velocity)
end

--[=[
	Calculates the time at which this MovingObject will reach position.
	Note: Calculated time may be negative.
]=]
function MovingObject:CalculateTimeFromPoint(position: Vector3): number?
	local distanceFromSelf: Vector3 = position - self.Position
	local angleFromDirection: number = distanceFromSelf:Angle(self.Velocity)

	if angleFromDirection == 0 or angleFromDirection == 180 then
		return self:CalculateTimeFromDistance(distanceFromSelf.Magnitude)
	else
		return nil
	end
end

--[=[
	Calculates the time at which this MovingObject will be distanceFromSelf meters away from its current position.
	Note: Calculated time may be negative.
]=]
function MovingObject:CalculateTimeFromDistance(distanceFromSelf: number): number
	return distanceFromSelf / self.Velocity.Magnitude
end

return MovingObject

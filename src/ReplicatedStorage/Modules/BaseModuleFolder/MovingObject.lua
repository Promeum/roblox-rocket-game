--!strict

local Constants = require(game.ReplicatedStorage.Modules.Constants)
local Modules = require(game.ReplicatedStorage.Modules.Modules)
local BigNum = require(game.ReplicatedStorage.Modules.Libraries.BigNum)
local BigMath = require(game.ReplicatedStorage.Modules.BigMath)
local BaseModule = require(script.Parent.Parent.BaseModule)

local MovingObject = {}

--[=[
	Creates a new MovingObject instance.
]=]
function MovingObject.new(position: Modules.Vector3B, velocity: Modules.Vector3B): Modules.MovingObject
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
function MovingObject:CalculatePointFromTime(relativeTime: Modules.BigNum | Modules.Fraction | number): Modules.MovingObject
	return MovingObject.new(self.Position + self.Velocity * relativeTime, self.Velocity)
end

local FRACTION_180 = BigNum.newFraction(180, 1)

--[=[
	Calculates the time at which this MovingObject will reach position.
	Note: Calculated time may be negative.
]=]
function MovingObject:CalculateTimeFromPoint(position: Modules.Vector3B): Modules.Fraction?
	local distanceFromSelf: Modules.Vector3B = position - self.Position
	local angleFromDirection: Modules.Fraction = distanceFromSelf:Angle(self.Velocity)

	if angleFromDirection == Constants.ZERO_FRACTION or angleFromDirection == FRACTION_180 then
		return self:CalculateTimeFromDistance(distanceFromSelf:Magnitude())
	else
		return nil
	end
end

--[=[
	Calculates the time at which this MovingObject will be distanceFromSelf meters away from its current position.
	Note: Calculated time may be negative.
]=]
function MovingObject:CalculateTimeFromDistance(distanceFromSelf: Modules.BigNum | Modules.Fraction | number): Modules.Fraction
	return BigMath.toFraction(distanceFromSelf) / self.Velocity:Magnitude()
end

return MovingObject

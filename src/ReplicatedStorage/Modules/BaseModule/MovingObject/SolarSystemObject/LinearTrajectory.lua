--!strict

local Modules = require(game.ReplicatedStorage.Modules.Modules)
local MovingObject = require(script.Parent.Parent.Parent.MovingObject)

local LinearTrajectory = { __type = "LinearTrajectory" :: "LinearTrajectory" }

--[=[
	Creates a new LinearTrajectory instance.
]=]
function LinearTrajectory.new(position: Modules.Vector3D, velocity: Modules.Vector3D): Modules.LinearTrajectory
	return LinearTrajectory.fromMovingObject(MovingObject.new(position, velocity))
end

--[=[
	Creates a new LinearTrajectory instance, with a given SolarSystemObject super-instance.
]=]
function LinearTrajectory.fromMovingObject(movingObject: Modules.MovingObject): Modules.LinearTrajectory
	local newLinearTrajectory = table.clone(LinearTrajectory)

	local metatable = {
		__index = movingObject,
	}

	setmetatable(newLinearTrajectory, metatable)

	return newLinearTrajectory
end

--[=[
	Calculates the point at which this LinearTrajectory will reach relativeTime seconds from now.
	Note: relativeTime can be negative.
]=]
function LinearTrajectory:CalculatePointFromTime(relativeTime: number): Modules.MovingObject
	return MovingObject.new(self.Position + self.Velocity * relativeTime, self.Velocity)
end

--[=[
	Calculates this LinearTrajectory's time of closest approach to position.
	Note: Calculated time may be negative.
]=]
function LinearTrajectory:CalculateTimeFromPoint(position: Modules.Vector3D): number
	-- Transform position relative to this LinearTrajectory
	local transformedTargetPoint: Modules.Vector3D = position - self.Position

	-- Find magnitude of the target point as if it was already projected to the velocity vector
	return transformedTargetPoint:Dot(self.Velocity)
end

--[=[
	Calculates the time at which this LinearTrajectory will be magnitude meters away from its current position.
	Note: magnitude, and calculated time, may be negative.
]=]
function LinearTrajectory:CalculateTimeFromMagnitude(magnitude: number): number
	return magnitude / self.Velocity:Magnitude()
end

--[=[
	Calculates the point at which this LinearTrajectory will be magnitude meters away from its current position.
	Note: magnitude may be negative.
]=]
function LinearTrajectory:CalculatePointFromMagnitude(magnitude: number): Modules.MovingObject
	return self:CalculatePointFromTime(self:CalculateTimeFromMagnitude(magnitude))
end

return LinearTrajectory
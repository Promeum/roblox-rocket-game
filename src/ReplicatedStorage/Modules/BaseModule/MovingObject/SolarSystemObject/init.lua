--!strict

local Constants = require(game.ReplicatedStorage.Modules.Constants)
local Modules = require(game.ReplicatedStorage.Modules.Modules)
local MovingObject = require(script.Parent.Parent.MovingObject)

local SolarSystemObject = { __type = "SolarSystemObject" :: "SolarSystemObject" }

--[=[
	Creates a new SolarSystemObject instance.
]=]
function SolarSystemObject.new(
	position: Modules.Vector3D,
	velocity: Modules.Vector3D,
	temporalPosition: Modules.TemporalPosition,
	orbitingBody: Modules.GravityBody?
): Modules.SolarSystemObject
	return SolarSystemObject.fromMovingObject(MovingObject.new(position, velocity), temporalPosition, orbitingBody)
end

--[=[
	Creates a new SolarSystemObject instance, with a given MovingObject super-instance.
	This effectively links this instance with other objects with the same super-instance.
]=]
function SolarSystemObject.fromMovingObject(
	movingObject: Modules.MovingObject,
	temporalPosition: Modules.TemporalPosition,
	orbitingBody: Modules.GravityBody?
): Modules.SolarSystemObject
	local newSolarSystemObject = table.clone(SolarSystemObject)

	newSolarSystemObject.OrbitingBody = orbitingBody
	newSolarSystemObject.TemporalPosition = temporalPosition

	local metatable = {
		__index = movingObject,
	}

	setmetatable(newSolarSystemObject, metatable)

	return newSolarSystemObject
end

function SolarSystemObject:RelativeToParent(): Modules.SolarSystemObject
	local orbitingBody: Modules.GravityBody? = self.OrbitingBody

	if orbitingBody == nil then
		error(`The given SolarSystemObject is not orbiting any GravityBody (OrbitingBody: {self.OrbitingBody})`)
	end

	local orbitingBodyMovingObject: Modules.MovingObject = orbitingBody.Trajectory:CalculatePointFromTime(self.TemporalPosition:GetAbsoluteTime())

	local convertedPosition: Modules.Vector3D = self.Position + orbitingBodyMovingObject.Position
	local convertedVelocity: Modules.Vector3D = self.Velocity + orbitingBodyMovingObject.Velocity

	return SolarSystemObject.new(convertedPosition, convertedVelocity, self.TemporalPosition, orbitingBody.ParentGravityBody)
end

function SolarSystemObject:RelativeToChild(childGravityBody: Modules.GravityBody): Modules.SolarSystemObject
	if self.OrbitingBody == nil then
		if childGravityBody.ParentGravityBody ~= nil then
			error(`The given childGravityBody is not a root GravityBody (OrbitingBody: {self.OrbitingBody}, childGravityBody: {childGravityBody})`)
		end
	elseif not table.find(self.OrbitingBody.ChildGravityBodies, childGravityBody) then
		error(`The given childGravityBody is not orbiting self.OrbitingBody (OrbitingBody: {self.OrbitingBody}, childGravityBody: {childGravityBody})`)
	end

	local orbitingBodyMovingObject: Modules.MovingObject = childGravityBody.Trajectory:CalculatePointFromTime(self.TemporalPosition:GetAbsoluteTime())

	local convertedPosition: Modules.Vector3D = self.Position - orbitingBodyMovingObject.Position
	local convertedVelocity: Modules.Vector3D = self.Velocity - orbitingBodyMovingObject.Velocity

	return SolarSystemObject.new(convertedPosition, convertedVelocity, self.TemporalPosition, childGravityBody.ParentGravityBody)
end

function SolarSystemObject:CalculateWorkspacePosition(): Modules.Vector3D
	if not self.OrbitingBody then
		return self.Position * Constants.SOLAR_SYSTEM_SCALE
	end

	return self:RelativeToParent():CalculateWorkspacePosition()
end

return SolarSystemObject

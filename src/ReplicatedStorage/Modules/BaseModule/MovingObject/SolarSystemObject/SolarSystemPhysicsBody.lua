--!strict

local TemporalPosition = require(game.ReplicatedStorage.Modules.BaseModule.TemporalPosition)
local Vector3D = require(game.ReplicatedStorage.Modules.Libraries.Vector3D)
local Modules = require(game.ReplicatedStorage.Modules.Modules)
local SolarSystemObject = require(script.Parent.Parent.SolarSystemObject)
local TrajectoryHolderObject = require(script.Parent.TrajectoryHolderObject)

local SolarSystemPhysicsBody = { __type = "SolarSystemPhysicsBody" :: "SolarSystemPhysicsBody" }

--[=[
	Creates a new SolarSystemBody instance.
]=]
function SolarSystemPhysicsBody.new(
	position: Modules.Vector3D,
	velocity: Modules.Vector3D,
	part: Part,
	orbitingBody: Modules.GravityBody?
): Modules.SolarSystemPhysicsBody
	return SolarSystemPhysicsBody.fromSolarSystemObject(SolarSystemObject.new(position, velocity, TemporalPosition.new(0), orbitingBody), part)
end

--[=[
	Creates a new SolarSystemBody instance.
]=]
function SolarSystemPhysicsBody.fromMovingObject(
	movingObject: Modules.MovingObject,
	part: Part,
	orbitingBody: Modules.GravityBody?
): Modules.SolarSystemPhysicsBody
	return SolarSystemPhysicsBody.fromSolarSystemObject(SolarSystemObject.fromMovingObject(movingObject, TemporalPosition.new(0), orbitingBody), part)
end

--[=[
	Creates a new SolarSystemBody instance.
]=]
function SolarSystemPhysicsBody.fromSolarSystemObject(
	solarSystemObject: Modules.SolarSystemObject,
	part: Part
): Modules.SolarSystemPhysicsBody
	local newSolarSystemPhysicsBody = table.clone(SolarSystemPhysicsBody)
	
	if solarSystemObject.Velocity == Vector3D.zero then
		solarSystemObject:getSuper().Velocity = Vector3D.one * 1e-2
	end

	local metatable = {
		__index = solarSystemObject,
	}

	setmetatable(newSolarSystemPhysicsBody, metatable)

	newSolarSystemPhysicsBody.RootPart = part
	newSolarSystemPhysicsBody.TrajectoryHolder = TrajectoryHolderObject.fromSolarSystemObject(solarSystemObject)

	if solarSystemObject.OrbitingBody then
		table.insert(solarSystemObject.OrbitingBody.ChildSolarSystemPhysicsBodies, newSolarSystemPhysicsBody)
	end

	return newSolarSystemPhysicsBody
end

--[=[
	Updates the position and velocity by applying gravity, optionally force changing select values
]=]
function SolarSystemPhysicsBody:Update(
	time: number,
	toChange: {
		position: Modules.Vector3D?,
		velocity: Modules.Vector3D?,
		acceleration: Modules.Vector3D?,
		gravityBody: Modules.GravityBody?,
	}?
): Modules.SolarSystemObject
	self:getSuper().OrbitingBody = self.TrajectoryHolder:OrbitingBody(time)

	-- apply physics
	local nextPosition: Modules.SolarSystemObject = SolarSystemObject.fromMovingObject(
		self.TrajectoryHolder:CalculatePointFromTime(time),
		TemporalPosition.new(time),
		self.OrbitingBody
	)

	-- if toChange and toChange.acceleration then
	-- 	nextPosition = self.TrajectoryHolder:AtTime(time, toChange.acceleration)
	-- else
	-- 	nextPosition = self.TrajectoryHolder:AtTime(time)
	-- end
	self:setSuper(nextPosition)

	self.RootPart.CFrame = CFrame.new(self:CalculateWorkspacePosition():ToVector3())

	-- local n = Instance.new("Part")

	-- n.Position = (self.Position * Constants.SOLAR_SYSTEM_SCALE)
	-- 	+ if self.OrbitingBody then self.OrbitingBody.RootPart.Position else Vector3D.zero
	-- n.Anchored = true
	-- n.Shape = Enum.PartType.Ball
	-- n.Size = Vector3D.one
	-- n.Parent = workspace.Planets

	return nextPosition
end

return SolarSystemPhysicsBody

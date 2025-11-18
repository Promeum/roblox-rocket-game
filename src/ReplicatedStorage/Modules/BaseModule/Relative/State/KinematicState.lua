--!strict
local Type = require(script.Parent.Parent.Parent.Parent.Type)
local Constructor = require(script.Parent.Parent.Parent.Parent.Constructor)
local State = require(script.Parent)
local Vector3D = require(script.Parent.Parent.Parent.Parent.Libraries.Vector3D)

-- Internal type
type KinematicState = Type.KinematicStateEXTENSIBLE<KinematicState,
		Type.StateEXTENSIBLE<KinematicState,
			Type.RelativeEXTENSIBLE<KinematicState,
				Type.BaseModuleEXTENSIBLE<KinematicState
	>>>>
	& Constructor.KinematicStateEXTENSIBLE<KinematicState>
	& {
	position: Type.Vector3D,
	velocity: Type.Vector3D
}

local KinematicState: KinematicState = { __type = "KinematicState" :: "KinematicState" } :: any
local KinematicStateMT = {}

function KinematicStateMT.__add(self: KinematicState, other: KinematicState): KinematicState
	self:assertTypesMatch(other)
	assert(self:sameRelativeTree(other), "KinematicState __add() Operands do not have the same relativeTree")
	-- local newSelf: KinematicState, newOther: KinematicState = self:synchronize(other)
	-- return KinematicState.new(newSelf.position + newOther.position, newSelf.velocity + newOther.velocity, newSelf:getRelativeOrNil())
	return KinematicState.new(self.position + other.position, self.velocity + other.velocity, self:getRelativeOrNil())
end

function KinematicStateMT.__sub(self: KinematicState, other: KinematicState): KinematicState
	self:assertTypesMatch(other)
	assert(self:sameRelativeTree(other), "KinematicState __sub() Operands do not have the same relativeTree")
	-- local newSelf: KinematicState, newOther: KinematicState = self:synchronize(other)
	-- return KinematicState.new(newSelf.position - newOther.position, newSelf.velocity - newOther.velocity, newSelf:getRelativeOrNil())
	return KinematicState.new(self.position - other.position, self.velocity - other.velocity, self:getRelativeOrNil())
end

function KinematicStateMT.__eq(self: KinematicState?, other: KinematicState?): boolean
	if (self ~= nil and other ~= nil) then
		self:assertTypesMatch(other)

		if (self.position == other.position and self.velocity == other.velocity) then
			if (self:hasRelative() and other:hasRelative()) then
				return KinematicStateMT.__eq(self:getRelative(), other:getRelative())
			else
				return self:hasRelative() == other:hasRelative()
			end
		else
			return false
		end
	else
		return self == nil and other == nil
	end
end

-- Constructors

--[=[
	Creates a new KinematicState instance.
]=]
function KinematicState.new(position: Type.Vector3D, velocity: Type.Vector3D, relativeTo: KinematicState?): KinematicState
	assert(
		position.X == position.X and position.Y == position.Y and position.Z == position.Z,
		"KinematicState new() position is nan (position = " .. tostring(position) .. ")"
	)
	assert(
		velocity.X == velocity.X and velocity.Y == velocity.Y and velocity.Z == velocity.Z,
		"KinematicState new() velocity is nan (velocity = " .. tostring(velocity) .. ")"
	)
	
	local self = table.clone(KinematicState) :: any
	self.position = position
	self.velocity = velocity

	local metatable = table.clone(KinematicStateMT)
	metatable.__index = State.new(relativeTo)

	setmetatable(self, metatable)

	return self
end


--[=[
	Creates a new KinematicState instance.
]=]
function KinematicState.newFromKinematicState(kinematicState: KinematicState, relativeTo: KinematicState?): KinematicState
	return KinematicState.new(kinematicState.position, kinematicState.velocity, relativeTo)
end

-- Methods

function KinematicState:getPosition(): Type.Vector3D
	return self.position
end

function KinematicState:getVelocity(): Type.Vector3D
	return self.velocity
end

function KinematicState:getAbsolutePosition(): Type.Vector3D
	if self:hasRelative() then
		return self.position + self:getRelative():getAbsolutePosition()
	else
		return self.position
	end
end

function KinematicState:getAbsoluteVelocity(): Type.Vector3D
	if self:hasRelative() then
		return self.velocity + self:getRelative():getAbsoluteVelocity()
	else
		return self.velocity
	end
end

--[=[
	Applies an acceleration to return a new KinematicState, adjusted for delta.

	@param accleration The acceleration to be applied to the new KinematicState.
	@param delta The time (in seconds) across which the acceleration will be applied.

	@return The new KinematicState.
]=]
function KinematicState:addAcceleration(acceleration: Type.AccelerationState, delta: number?): KinematicState
	local newVelocity: Type.Vector3D = self.velocity + acceleration:getAccelerationVector(delta)
	local newPosition: Type.Vector3D = self.position + newVelocity * (delta or acceleration:getDelta())
	return KinematicState.new(newPosition, newVelocity)
end

--- @Override
function KinematicState:getAbsolute(): KinematicState
	return KinematicState.new(
		self:getAbsolutePosition(),
		self:getAbsoluteVelocity()
	)
end

--- @Override
function KinematicState:consolidateOnce(): KinematicState
	assert(self:hasRelative(), "consolidateOnce() cannot be called on a KinematicState with no RelativeTo")
	local relativeTo: KinematicState = self:getRelative()

 	return KinematicState.new(
			self:getPosition() + relativeTo:getPosition(),
			self:getVelocity() + relativeTo:getVelocity(),
			relativeTo:getRelativeOrNil()
		)
end

--- @Override
function KinematicState:synchronize(other: KinematicState): (KinematicState, KinematicState)
	local selfTree: { KinematicState } = self:getRelativeTree()
	local selfTrimmedPosition: Type.Vector3D = Vector3D.zero
	local selfTrimmedVelocity: Type.Vector3D = Vector3D.zero

	for i = 1, self:convergenceIndex(other) - 1 do
		selfTrimmedPosition += selfTree[i]:getPosition()
		selfTrimmedVelocity += selfTree[i]:getVelocity()
	end

	local otherTree: { KinematicState } = other:getRelativeTree()
	local otherTrimmedPosition: Type.Vector3D = Vector3D.zero
	local otherTrimmedVelocity: Type.Vector3D = Vector3D.zero

	for i = 1, other:convergenceIndex(self) - 1 do
		otherTrimmedPosition += otherTree[i]:getPosition()
		otherTrimmedVelocity += otherTree[i]:getVelocity()
	end

	local convergenceItem: KinematicState = self:convergenceItem(other) or KinematicState.new(Vector3D.zero, Vector3D.zero)

	local selfResult: KinematicState = KinematicState.new(
			convergenceItem.position + selfTrimmedPosition,
			convergenceItem.velocity + selfTrimmedVelocity
		)
	local otherResult: KinematicState = KinematicState.new(
			convergenceItem.position + otherTrimmedPosition,
			convergenceItem.velocity + otherTrimmedVelocity
		)

	assert(
		selfResult:getRelativeOrNil() == otherResult:getRelativeOrNil()
		and self:getAbsolutePosition() == selfResult:getAbsolutePosition()
		and self:getAbsoluteVelocity() == selfResult:getAbsoluteVelocity()
		and other:getAbsolutePosition() == otherResult:getAbsolutePosition()
		and other:getAbsoluteVelocity() == otherResult:getAbsoluteVelocity(),
		"something wrong in the calcs!"
	)

	return selfResult, otherResult
end

--- @Override
function KinematicState:matchRelative(other: KinematicState): KinematicState
	local otherTree: { KinematicState } = other:getRelativeTree()
	local otherTrimmedPosition: Type.Vector3D = Vector3D.zero
	local otherTrimmedVelocity: Type.Vector3D = Vector3D.zero

	-- consolidate other to match with self's RelativeTo tree, and track trimmed stats
	for i = 1, other:convergenceIndex(self) - 1 do
		otherTrimmedPosition += otherTree[i]:getPosition()
		otherTrimmedVelocity += otherTree[i]:getVelocity()
	end

	-- subtract the stats exclusively between other and self, and add the excess to the newly matched result
	local convergenceItem: KinematicState = self:convergenceItem(other) or KinematicState.new(Vector3D.zero, Vector3D.zero)
	local selfRelativeTree: { KinematicState } = self:getRelativeTree()
	local resultPositionLeftover: Type.Vector3D = convergenceItem.position + otherTrimmedPosition
	local resultVelocityLeftover: Type.Vector3D = convergenceItem.velocity + otherTrimmedVelocity

	for i = self:convergenceIndex(other) - 1, 2, -1 do
		resultPositionLeftover -= selfRelativeTree[i].position
		resultVelocityLeftover -= selfRelativeTree[i].velocity
	end

	local result: KinematicState = KinematicState.new(resultPositionLeftover, resultVelocityLeftover, self:getRelativeOrNil())

	assert(
		self:getRelativeOrNil() == result:getRelativeOrNil()
		and other:getAbsolutePosition() == result:getAbsolutePosition()
		and other:getAbsoluteVelocity() == result:getAbsoluteVelocity(),
		"something wrong in the calcs!"
	)

	return result
end

return (KinematicState :: any) :: Constructor.KinematicState

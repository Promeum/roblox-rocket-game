--!strict

local Type = require(script.Parent.Parent.Parent.Parent.Type)
local Constructor = require(script.Parent.Parent.Parent.Parent.Constructor)
local State = require(script.Parent)
local Vector3D = require(script.Parent.Parent.Parent.Parent.Parent.Modules.Libraries.Vector3D)

-- Internal type
type AccelerationState = Type.AccelerationStateEXTENSIBLE<AccelerationState,
		Type.StateEXTENSIBLE<AccelerationState,
			Type.RelativeEXTENSIBLE<AccelerationState,
				Type.BaseModuleEXTENSIBLE<AccelerationState
	>>>>
	& Constructor.AccelerationStateEXTENSIBLE<AccelerationState>
	& {
	acceleration: Type.Vector3D,
	delta: number
}

local AccelerationState: AccelerationState = { __type = "AccelerationState" :: "AccelerationState" } :: any
local AccelerationStateMT = {}

function AccelerationStateMT.__add(self: AccelerationState, other: AccelerationState): AccelerationState
	self:assertTypesMatch(other)
	assert(self:sameRelativeTree(other), "AccelerationState __add() Operands do not have the same relativeTree")
	-- local newSelf: AccelerationState, newOther: AccelerationState = self:synchronize(other)
	-- return AccelerationState.new(newSelf.acceleration + newOther:getAccelerationVector(newSelf.delta), newSelf.delta)
	if self.delta ~= other.delta then
		return AccelerationState.new(self:getAccelerationVector(1) + other:getAccelerationVector(1))
	else
		return AccelerationState.new(self.acceleration + other.acceleration)
	end
end

function AccelerationStateMT.__sub(self: AccelerationState, other: AccelerationState): AccelerationState
	self:assertTypesMatch(other)
	assert(self:sameRelativeTree(other), "AccelerationState __sub() Operands do not have the same relativeTree")
	-- local newSelf: AccelerationState, newOther: AccelerationState = self:synchronize(other)
	-- return AccelerationState.new(newSelf.acceleration - newOther:getAccelerationVector(newSelf.delta), newSelf.delta)
	if self.delta ~= other.delta then
		return AccelerationState.new(self:getAccelerationVector(1) - other:getAccelerationVector(1))
	else
		return AccelerationState.new(self.acceleration - other.acceleration)
	end
end

function AccelerationStateMT.__eq(self: AccelerationState?, other: AccelerationState?): boolean
	if (self ~= nil and other ~= nil) then
		self:assertTypesMatch(other)

		if (self.acceleration == other.acceleration and self.delta == other.delta) then
			if (self:hasRelative() and other:hasRelative()) then
				return AccelerationStateMT.__eq(self:getRelative(), other:getRelative())
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

function AccelerationStateMT.__lt(self: AccelerationState, other: AccelerationState): boolean
	self:assertTypesMatch(other)
	return self:getAbsoluteAcceleration() < other:getAbsoluteAcceleration()
end

function AccelerationStateMT.__le(self: AccelerationState, other: AccelerationState): boolean
	self:assertTypesMatch(other)
	return self:getAbsoluteAcceleration() <= other:getAbsoluteAcceleration()
end

-- Constructors

--[=[
	Creates a new AccelerationState instance.
]=]
function AccelerationState.new(acceleration: Type.Vector3D, delta: number?, relativeTo: AccelerationState?): AccelerationState
	local self: AccelerationState = table.clone(AccelerationState) :: any
	self.acceleration = acceleration
	self.delta = delta or 1

	local metatable = table.clone(AccelerationStateMT)
	metatable.__index = State.new(relativeTo)

	setmetatable(self, metatable)

	return self
end

--[=[
	Clones an AccelerationState instance, altering its delta.
]=]
function AccelerationState.newWithDelta(accelerationState: AccelerationState, delta: number?): AccelerationState
	local self: AccelerationState = table.clone(AccelerationState) :: any
	local newDelta: number = delta or 1
	self.acceleration = accelerationState:getAccelerationVector(newDelta)
	self.delta = newDelta

	local metatable = table.clone(AccelerationStateMT)
	if accelerationState:hasRelative() then
		metatable.__index = State.new(accelerationState:getRelative())
	else
		metatable.__index = State.new()
	end

	setmetatable(self, metatable)

	return self
end

-- Methods

--[=[
	Returns the acceleration vector (velocity over delta).
]=]
function AccelerationState.getAccelerationVector(self: AccelerationState, delta: number?): Type.Vector3D
	if delta == nil then
		return self.acceleration
	else
		return self.acceleration * (delta / self.delta)
	end
end

function AccelerationState.getAbsoluteAcceleration(self: AccelerationState, delta: number?): Type.Vector3D
	if self:hasRelative() then
		return self:getAccelerationVector(delta) + self:getRelative():getAbsoluteAcceleration(delta)
	else
		return self:getAccelerationVector(delta)
	end
end

function AccelerationState:getDelta(): number
	return self.delta
end

--[=[
	Returns a new AccelerationState relative to the current relativeTo's relativeTo.

	<code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	<code>result: a-b-c-result</code>

	@return The resultant AccelerationState.
]=]
function AccelerationState:consolidateOnce(delta: number?): AccelerationState
	assert(self:hasRelative(), "consolidateOnce() cannot be called on a AccelerationState with no RelativeTo")
	local relativeTo: AccelerationState = self:getRelative()

	return AccelerationState.new(
		self:getAccelerationVector(delta) + relativeTo:getAccelerationVector(delta),
		delta,
		relativeTo:getRelativeOrNil()
	)
end

--[=[
	Synchronizes this AccelerationState with another such that they have the same RelativeTo.

	<code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	<code>other: &nbsp;a-b-e-other</code><br>
	<code>result: a-b-selfResult, a-b-otherResult</code>

	@param other The other AccelerationState to synchronize with.
	@return The synchronized AccelerationStates as a tuple of self and other, in that order.
]=]
function AccelerationState:synchronize(other: AccelerationState): (AccelerationState, AccelerationState)
	local convergenceItem: AccelerationState = self:convergenceItem(other) or AccelerationState.new(Vector3D.zero)

	local selfTree: { AccelerationState } = self:getRelativeTree()
	local selfTrimmedAcceleration: Type.Vector3D = Vector3D.zero

	for i = 1, self:convergenceIndex(other) - 1 do
		selfTrimmedAcceleration += selfTree[i]:getAccelerationVector(convergenceItem.delta)
	end

	local otherTree: { AccelerationState } = other:getRelativeTree()
	local otherTrimmedAcceleration: Type.Vector3D = Vector3D.zero

	for i = 1, other:convergenceIndex(self) - 1 do
		otherTrimmedAcceleration += otherTree[i]:getAccelerationVector(convergenceItem.delta)
	end

	local selfResult: AccelerationState = AccelerationState.new(
			convergenceItem.acceleration + selfTrimmedAcceleration,
			convergenceItem.delta
		)
	local otherResult: AccelerationState = AccelerationState.new(
			convergenceItem.acceleration + otherTrimmedAcceleration,
			convergenceItem.delta
		)

	assert(
		selfResult:getRelativeOrNil() == otherResult:getRelativeOrNil()
		and self:getAbsoluteAcceleration() == selfResult:getAbsoluteAcceleration()
		and other:getAbsoluteAcceleration() == otherResult:getAbsoluteAcceleration(),
		"something wrong in the calcs!"
	)

	return selfResult, otherResult
end

--[=[
	Matches the RelativeTo tree of other with this AccelerationState.
	The result's delta will also match that of self.

	<code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	<code>other: &nbsp;a-b-e-other</code><br>
	<code>result: a-b-c-d-otherResult</code>

	@param other The other AccelerationState to match with.
	@return The synchronized other AccelerationState.
]=]
function AccelerationState:matchRelative(other: AccelerationState): AccelerationState
	local convergenceIndex: number = other:convergenceIndex(self)

	-- consolidate other to match with self's RelativeTo tree, and track trimmed relativeTime
	local otherIterator: AccelerationState = other
	local trimmedAcceleration: Type.Vector3D = Vector3D.zero

	for i = 1, convergenceIndex - 1 do
		trimmedAcceleration += otherIterator:getAccelerationVector(self.delta)
		otherIterator = otherIterator:getRelative()
	end

	-- subtract the time exclusively between other and self, and add the excess to the newly matched result
	local selfRelativeTree: { AccelerationState } = self:getRelativeTree()
	local resultAccelerationLeftover: Type.Vector3D = trimmedAcceleration

	for i = self:convergenceIndex(other) - 1, 2, -1 do
		resultAccelerationLeftover -= selfRelativeTree[i]:getAccelerationVector(self.delta)
	end

	local result: AccelerationState = AccelerationState.new(resultAccelerationLeftover, self.delta, self:getRelativeOrNil())

	assert(
		self:getRelativeOrNil() == result:getRelativeOrNil()
		and other:getAbsoluteAcceleration(self.delta) == result:getAbsoluteAcceleration(self.delta),
		"something wrong in the calcs!"
	)

	return result
end

return (AccelerationState :: any) :: Constructor.AccelerationState

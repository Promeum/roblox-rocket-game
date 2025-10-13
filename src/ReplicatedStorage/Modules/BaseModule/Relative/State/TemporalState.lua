--!strict

--[[
	TODO:
	Add a Date part so really large values of relativeTime wont be a problem
]]

local Type = require(script.Parent.Parent.Parent.Parent.Type)
local Constructor = require(script.Parent.Parent.Parent.Parent.Constructor)
local State = require(script.Parent)

-- Internal type
type TemporalState = Type.TemporalStateEXTENSIBLE<TemporalState,
		Type.StateEXTENSIBLE<TemporalState,
			Type.RelativeEXTENSIBLE<TemporalState,
				Type.BaseModuleEXTENSIBLE<TemporalState
	>>>>
	& Constructor.TemporalStateEXTENSIBLE<TemporalState>
	& {
	relativeTime: number
}

local TemporalState: TemporalState = { __type = "TemporalState" :: "TemporalState" } :: any
local TemporalStateMT = {}

function TemporalStateMT.__add(self: TemporalState, other: TemporalState): TemporalState
	self:assertTypesMatch(other)
	assert(self:sameRelativeTree(other), "TemporalState __add() Operands do not have the same relativeTree")
	-- local newSelf: TemporalState, newOther: TemporalState = self:synchronize(other)
	-- return TemporalState.newRelativeTime(newSelf.relativeTime + newOther.relativeTime, newSelf)
	return TemporalState.newRelativeTime(self.relativeTime + other.relativeTime, self)
end

function TemporalStateMT.__sub(self: TemporalState, other: TemporalState): TemporalState
	self:assertTypesMatch(other)
	assert(self:sameRelativeTree(other), "TemporalState __sub() Operands do not have the same relativeTree")
	-- local newSelf: TemporalState, newOther: TemporalState = self:synchronize(other)
	-- return TemporalState.newRelativeTime(newSelf.relativeTime - newOther.relativeTime, newSelf)
	return TemporalState.newRelativeTime(self.relativeTime - other.relativeTime, self)
end

function TemporalStateMT.__eq(self: TemporalState?, other: TemporalState?): boolean
	if (self ~= nil and other ~= nil) then
		self:assertTypesMatch(other)

		if (self.relativeTime == other.relativeTime) then
			if (self:hasRelative() and other:hasRelative()) then
				return TemporalStateMT.__eq(self:getRelative(), other:getRelative())
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

function TemporalStateMT.__lt(self: TemporalState, other: TemporalState): boolean
	self:assertTypesMatch(other)
	return self:getAbsoluteTime() < other:getAbsoluteTime()
end

function TemporalStateMT.__le(self: TemporalState, other: TemporalState): boolean
	self:assertTypesMatch(other)
	return self:getAbsoluteTime() <= other:getAbsoluteTime()
end

-- Constructors

--[=[
	Creates a new TemporalState instance.
]=]
function TemporalState.new(relativeTime: number, relativeTo: TemporalState?): TemporalState
	local self: TemporalState = table.clone(TemporalState) :: any
	self.relativeTime = relativeTime

	local metatable = table.clone(TemporalStateMT)
	metatable.__index = State.new(relativeTo)

	setmetatable(self, metatable)

	return self
end

--[=[
	Creates a new TemporalState instance by setting the relativeTime of a TemporalState.
]=]
function TemporalState.newRelativeTime(relativeTime: number, temporalState: TemporalState): TemporalState
	local self: TemporalState = table.clone(TemporalState) :: any
	self.relativeTime = relativeTime

	local metatable = table.clone(TemporalStateMT)
	if temporalState:hasRelative() then
		metatable.__index = State.new(temporalState:getRelative())
	else
		metatable.__index = State.new()
	end

	setmetatable(self, metatable)

	return self
end

--[=[
	Creates a new TemporalState instance by incrementing the relativeTime of a TemporalState.
]=]
function TemporalState.newIncrementTime(delta: number, temporalState: TemporalState): TemporalState
	return TemporalState.newRelativeTime(temporalState.relativeTime + delta, temporalState)
end

--[=[
	Creates a new TemporalState instance with the same relativeTo tree as the one specified.
]=]
function TemporalState.newAbsoluteTime(absoluteTime: number, relativeTo: TemporalState?): TemporalState
	if (relativeTo == nil) then
		return TemporalState.new(absoluteTime)
	else
		return relativeTo:matchRelative(TemporalState.new(absoluteTime))
	end
end

-- Methods

function TemporalState:getAbsolute(): TemporalState
	return TemporalState.new(self:getAbsoluteTime())
end

function TemporalState.getRelativeTime(self: TemporalState): number
	return self.relativeTime
end

function TemporalState:getAbsoluteTime(): number
	if self:hasRelative() then
		return self.relativeTime + self:getRelative():getAbsoluteTime()
	else
		return self.relativeTime
	end
end

--[=[
	Returns a new TemporalState relative to the current relativeTo's relativeTo.

	<code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	<code>result: a-b-c-result</code>

	@return The resultant TemporalState.
]=]
function TemporalState:consolidateOnce(): TemporalState
	assert(self:hasRelative(), "consolidateOnce() cannot be called on a TemporalState with no RelativeTo")
	local relativeTo: TemporalState = self:getRelative()

	return TemporalState.new(self:getRelativeTime() + relativeTo:getRelativeTime(), relativeTo:getRelativeOrNil())
end

--[=[
	Synchronizes this TemporalState with another such that they have the same RelativeTo.

	<code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	<code>other: &nbsp;a-b-e-other</code><br>
	<code>result: a-b-selfResult, a-b-otherResult</code>

	@param other The other TemporalState to synchronize with.
	@return The synchronized TemporalStates as a tuple of self and other, in that order.
]=]
function TemporalState:synchronize(other: TemporalState): (TemporalState, TemporalState)
	local synchronizedSelf: TemporalState = self
	local synchronizedOther: TemporalState = other
	local relativeToSelf: TemporalState? = synchronizedSelf:getRelativeOrNil()
	local relativeToOther: TemporalState? = synchronizedOther:getRelativeOrNil()

	while relativeToSelf ~= relativeToOther do
		if relativeToSelf == nil or relativeToOther == nil then
			return TemporalState.new(synchronizedSelf:getAbsoluteTime()), TemporalState.new(synchronizedOther:getAbsoluteTime())
		end

		local absoluteDifference: number = relativeToOther:getAbsoluteTime() - relativeToSelf:getAbsoluteTime()

		if absoluteDifference > 0 then
			synchronizedOther = synchronizedOther:consolidateOnce()
		elseif absoluteDifference < 0 then
			synchronizedSelf = synchronizedSelf:consolidateOnce()
		else
			synchronizedOther = synchronizedOther:consolidateOnce()
			synchronizedSelf = synchronizedSelf:consolidateOnce()
		end

		relativeToSelf = synchronizedSelf:getRelativeOrNil()
		relativeToOther = synchronizedOther:getRelativeOrNil()
	end

	return synchronizedSelf, synchronizedOther
end

--[=[
	Matches the RelativeTo tree of other with this TemporalState.

	<code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	<code>other: &nbsp;a-b-e-other</code><br>
	<code>result: a-b-c-d-otherResult</code>

	@param other The other TemporalState to match with.
	@return The synchronized other TemporalState. Note: Resultant relativeTime may be negative.
]=]
function TemporalState:matchRelative(other: TemporalState): TemporalState
	local convergenceIndex: number = other:convergenceIndex(self)

	-- consolidate other to match with self's RelativeTo tree, and track trimmed relativeTime
	local otherIterator: TemporalState = other
	local trimmedTime: number = 0

	for i = 1, convergenceIndex - 1 do
		trimmedTime += otherIterator.relativeTime
		otherIterator = otherIterator:getRelative()
	end

	-- subtract the time exclusively between other and self, and add the excess to the newly matched result
	local selfRelativeTree: { TemporalState } = self:getRelativeTree()
	local resultTimeLeftover: number = trimmedTime

	for i = self:convergenceIndex(other) - 1, 2, -1 do
		resultTimeLeftover -= selfRelativeTree[i].relativeTime
	end

	local result: TemporalState = TemporalState.new(resultTimeLeftover, self:getRelativeOrNil())

	assert(
		self:getRelativeOrNil() == result:getRelativeOrNil()
		and other:getAbsoluteTime() == result:getAbsoluteTime(),
		"something wrong in the calcs!"
	)

	return result
end

return (TemporalState :: any) :: Constructor.TemporalState

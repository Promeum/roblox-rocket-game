--!strict

--[[
	TODO:
    Add a Date module so really large values of RelativeTime wont be a problem
]]

local Modules = require(game.ReplicatedStorage.Modules.Modules)
local BaseModule = require(script.Parent.Parent.BaseModule)

local TemporalPosition = { __type = "TemporalPosition" :: "TemporalPosition" }

--[=[
	Creates a new TemporalPosition instance.
]=]
function TemporalPosition.new(relativeTime: number, relativeTo: Modules.TemporalPosition?): Modules.TemporalPosition
	local newTemporalPosition = table.clone(TemporalPosition)

	newTemporalPosition.RelativeTime = relativeTime
	newTemporalPosition.RelativeTo = relativeTo

	local metatable = {
		__index = BaseModule.new(),
	}

	setmetatable(newTemporalPosition, metatable)

	return newTemporalPosition
end

--[=[
	Creates a new TemporalPosition instance.
]=]
function TemporalPosition:fromTemporalPosition(relativeTime: number): Modules.TemporalPosition
	return TemporalPosition.new(relativeTime, self)
end

--[=[
	Creates a new TemporalPosition instance.
]=]
function TemporalPosition:fromTemporalPositionAbsoluteTime(absoluteTime: number): Modules.TemporalPosition
	return self:MatchRelative(TemporalPosition.new(absoluteTime))
end

function TemporalPosition:GetAbsoluteTime(): number
    local relativeTime: number = self.RelativeTime
    local relativeTo: Modules.TemporalPosition? = self.RelativeTo

    while relativeTo do
        relativeTime += relativeTo.RelativeTime
        relativeTo = relativeTo.RelativeTo
    end

	return relativeTime
end

function TemporalPosition:GetRelativeTime(): number
    assert(self.RelativeTo, "GetRelativeTime() cannot be called on a TemporalPosition with no RelativeTo " .. `(RelativeTo: {self.RelativeTo})`)
    
    return self.RelativeTime + self.RelativeTo.RelativeTime
end

function TemporalPosition:ConsolidateOnce(): Modules.TemporalPosition
    assert(self.RelativeTo, "ConsolidateOnce() cannot be called on a TemporalPosition with no RelativeTo " .. `(RelativeTo: {self.RelativeTo})`)
    
    return TemporalPosition.new(self:GetRelativeTime(), self.RelativeTo.RelativeTo)
end

--[=[
	Synchronizes this TemporalPosition with another such that they have the same RelativeTo.

	@param other The other TemporalPosition to synchronize with.
	@return The synchronized TemporalPositions as a tuple of self and other, in that order.
]=]
function TemporalPosition:Synchronize(other: Modules.TemporalPosition): (Modules.TemporalPosition, Modules.TemporalPosition)
	local synchronizedSelf: Modules.TemporalPosition = self
	local synchronizedOther: Modules.TemporalPosition = other

	while synchronizedSelf.RelativeTo ~= synchronizedOther.RelativeTo do
		if synchronizedSelf.RelativeTo == nil or synchronizedOther.RelativeTo == nil then
			return TemporalPosition.new(synchronizedSelf:GetAbsoluteTime()), TemporalPosition.new(synchronizedOther:GetAbsoluteTime())
		end

		local absoluteDifference: number = synchronizedOther.RelativeTo:GetAbsoluteTime() - synchronizedSelf.RelativeTo:GetAbsoluteTime()

		if absoluteDifference > 0 then
			synchronizedOther = synchronizedOther:ConsolidateOnce()
		elseif absoluteDifference < 0 then
			synchronizedSelf = synchronizedSelf:ConsolidateOnce()
		else
			synchronizedOther = synchronizedOther:ConsolidateOnce()
			synchronizedSelf = synchronizedSelf:ConsolidateOnce()
		end
	end

    return synchronizedSelf, synchronizedOther
end

--[=[
	Matches the RelativeTo tree of other with this TemporalPosition.

	@param other The other TemporalPosition to match with.
	@return The synchronized other TemporalPosition. Note: Resultant RelativeTime may be negative.
]=]
function TemporalPosition:MatchRelative(other: Modules.TemporalPosition): Modules.TemporalPosition
	-- build tree of the RelativeTo's of self
	local selfRelativeTree: { Modules.TemporalPosition } = {}
	local selfIterator: Modules.TemporalPosition? = self

	while selfIterator do
		table.insert(selfRelativeTree, selfIterator)
		selfIterator = selfIterator.RelativeTo
	end

	-- consolidate other to match with self's RelativeTo tree, and track trimmed relativeTime
	local otherIterator: Modules.TemporalPosition = other
	local trimmedTime: number = 0
	local otherIndex: number? = table.find(selfRelativeTree, otherIterator)

	while not otherIndex and otherIterator.RelativeTo do
		trimmedTime += otherIterator.RelativeTime
		otherIterator = otherIterator.RelativeTo
		otherIndex = table.find(selfRelativeTree, otherIterator)
	end

	-- subtract the time exclusively between other and self, and add the excess to the newly matched result
	local result: Modules.TemporalPosition = self
	local resultTimeLeftover: number = trimmedTime

	for i = if otherIndex then otherIndex - 1 else #selfRelativeTree, 1, -1 do
		resultTimeLeftover -= selfRelativeTree[i].RelativeTime
	end

	result.RelativeTime += resultTimeLeftover

	assert(self.RelativeTo == result.RelativeTo and other:GetAbsoluteTime() == result:GetAbsoluteTime(), "something wrong in the calcs!")

	return result
end

return TemporalPosition

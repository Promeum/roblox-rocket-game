--!strict

local Type = require(script.Parent.Parent.Type)
local Constructor = require(script.Parent.Parent.Constructor)
local BaseModule = require(script.Parent)

-- Internal type
type Relative = Type.RelativeEXTENSIBLE<Relative,
		Type.BaseModuleEXTENSIBLE<Relative
	>>
	& Constructor.RelativeEXTENSIBLE<Relative>
	& {
	relativeTo: Relative?
}

local Relative: Relative = { __type = "Relative" :: "Relative" } :: any
local RelativeMT = {}

function RelativeMT.__eq(self: Relative, other: Relative?): boolean
	error("Relative __eq() not implemented for type " .. self.__type)
end

function RelativeMT.__len(self: Relative): number
	return #self:getRelativeTree()
end

-- Constructors

--[=[
	Creates a new Relative instance.
]=]
function Relative.new(relativeTo: Relative?): Relative
	local self: Relative = table.clone(Relative) :: any
	self.relativeTo = relativeTo

	local metatable = table.clone(RelativeMT)
	metatable.__index = BaseModule

	setmetatable(self, metatable)

	return self
end

-- Methods

function Relative:hasRelative(): boolean
	return self.relativeTo ~= nil
end

function Relative:getRelative(): Relative
	if self.relativeTo then
		return self.relativeTo
	else
		error("Relative getRelative() Cannot call getRelative() on a " .. self.__type .. " with no relativeTo")
	end
end

function Relative:getRelativeOrNil(): Relative?
	return self.relativeTo
end

function Relative:getRelativeTree(): { Relative }
	local selfTree: { Relative } = {}
	local selfIterator: Relative = self

	while (selfIterator:hasRelative()) do
		table.insert(selfTree, selfIterator)
		selfIterator = selfIterator:getRelative()
	end
	
	return selfTree
end

function Relative:sameRelativeTree(other: Relative): boolean
	if self:hasRelative() == other:hasRelative() then
		if self:hasRelative() then
			return self:getRelative() == other:getRelative()
		else
			return true
		end
	else
		return false
	end
end

function Relative:convergenceIndex(other: Relative): number
	local selfRelativeTree: { Relative } = self:getRelativeTree()
	local convergenceRelative: Relative? = self:convergenceItem(other)

	if (convergenceRelative) then
		local convergenceIndex: number? = table.find(selfRelativeTree, convergenceRelative)

		if (convergenceIndex) then
			return convergenceIndex
		else
			return #selfRelativeTree + 1
		end
	else
		return #selfRelativeTree + 1
	end
end

function Relative:convergenceItem(other: Relative): Relative?
	local otherIterator: Relative = other
	local selfRelativeTree: { Relative } = self:getRelativeTree()

	if (table.find(selfRelativeTree, otherIterator) ~= nil) then
		return otherIterator
	end

	-- Check the tree of self to see when the tree of other converges
	while (otherIterator:hasRelative()) do
		if (table.find(selfRelativeTree, otherIterator) ~= nil) then
			return otherIterator
		end

		otherIterator = otherIterator:getRelative()
	end

	return nil
end

return (Relative :: any) :: Constructor.RelativeEXTENSIBLE<any>

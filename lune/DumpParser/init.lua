-- libs/DumpParser/init.luau
-- Minimal DumpParser for Lune runtime

local DumpParser = {}
DumpParser.__index = DumpParser

-- Constructor
function DumpParser.new(dumpTable: {[string]: any})
	assert(type(dumpTable) == "table", "DumpParser.new expects a table")
	local self = setmetatable({}, DumpParser)
	self._dump = dumpTable
	return self
end

-- Get all classes in the dump
function DumpParser:GetClasses()
	local classes = {}
	for _, def in ipairs(self._dump.Classes or {}) do
		classes[def.Name] = def
	end
	return classes
end

-- Get a single class definition
function DumpParser:GetClass(name: string)
	for _, def in ipairs(self._dump.Classes or {}) do
		if def.Name == name then
			return def
		end
	end
	return nil
end

-- Get members of a class
function DumpParser:GetMembers(className: string)
	local class = self:GetClass(className)
	if not class then return {} end
	return class.Members or {}
end

-- Get properties of a class
function DumpParser:GetProperties(className: string)
	local members = self:GetMembers(className)
	local props = {}
	for _, member in ipairs(members) do
		if member.MemberType == "Property" then
			table.insert(props, member)
		end
	end
	return props
end

-- Get functions of a class
function DumpParser:GetFunctions(className: string)
	local members = self:GetMembers(className)
	local funcs = {}
	for _, member in ipairs(members) do
		if member.MemberType == "Function" then
			table.insert(funcs, member)
		end
	end
	return funcs
end

-- Get events of a class
function DumpParser:GetEvents(className: string)
	local members = self:GetMembers(className)
	local events = {}
	for _, member in ipairs(members) do
		if member.MemberType == "Event" then
			table.insert(events, member)
		end
	end
	return events
end

return DumpParser

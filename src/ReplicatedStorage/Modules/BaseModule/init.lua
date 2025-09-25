--!strict

local Modules = require(game.ReplicatedStorage.Modules.Modules)

local BaseModule = { __type = "BaseModule" :: "BaseModule" }

function BaseModule.new(): Modules.BaseModule
	local newBaseModule = table.clone(BaseModule)

	local metatable = {}

	setmetatable(newBaseModule, metatable)

	return newBaseModule
end

--[=[
	Returns the super-instance.
]=]
function BaseModule:getSuper(): any
	return getmetatable(self).__index
end

--[=[
	Returns the super-instance.
]=]
function BaseModule:setSuper(value: any): ()
	getmetatable(self).__index = value
end

--[=[
	Define a new typeof() to work with custom classes.
]=]
function BaseModule:getType(): string
	if typeof(self) == "table" then
		local mt = getmetatable(self)
		return if mt then mt.__type else "table"
	end
	return typeof(self)
end

--[=[
	Makes a copy of this instance, also copying super-instances.
--]=]
function BaseModule:DeepClone(): any
	local tableStack = { table.clone(self) }
	local unstack: any = table.clone(self)

	-- pls fix
	while getmetatable(unstack) do
		unstack = table.clone(getmetatable(unstack))
		table.insert(tableStack, unstack)
	end

	local clone = tableStack[-1]

	for i = #tableStack - 2, -1, -1 do
		setmetatable(clone, tableStack[i])
	end

	return clone
end

return BaseModule

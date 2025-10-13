--!strict

local Type = require(script.Parent.Type)

-- Internal type
type BaseModule = Type.BaseModuleEXTENSIBLE<BaseModule>

local BaseModule: BaseModule = { __type = "BaseModule" :: "BaseModule" } :: any

-- Methods

--[=[
	Returns a reference to the super-instance.
]=]
function BaseModule.getSuper(self: any): any
	return getmetatable(self).__index
end

--[=[
	Returns true if self is, or is a subclass of, the type passed in.
	@param typeName
]=]
function BaseModule.instanceOf(self: any, typeName: string): boolean
	local iterator = self

	if iterator.__type == typeName then
		return true
	end

	while getmetatable(iterator) ~= nil do
		iterator = iterator:getSuper()

		if iterator.__type == typeName then
			return true
		end
	end

	return false
end

--[=[
	Returns true if the type of self matches the type of other.
	@param other
]=]
function BaseModule.typesMatch(self: any, other: any): boolean
	return (type(self) == "table" and self.__type ~= nil)
		and (type(other) == "table" and other.__type ~= nil)
		and (self:instanceOf(other.__type) and other:instanceOf(self.__type))
end

--[=[
	Throws an error if the type of self does not match the type of other.
	@param other
]=]
function BaseModule.assertTypesMatch(self: any, other: any): ()
	if not self:typesMatch(other) then
		local selfValidType: boolean = (type(self) == "table" and self.__type ~= nil)
		local otherValidType: boolean = (type(other) == "table" and other.__type ~= nil)

		if selfValidType and otherValidType then
			error("Parameters are of different types (" .. self.__type .. " ~= " .. other.__type .. ")")
		elseif selfValidType then
			error("Parameter(s) are of an invalid type (type: " .. type(other) .. ")")
		elseif otherValidType then
			error("Parameter(s) are of an invalid type (type: " .. type(self) .. ")")
		else
			error("Neither parameter is a valid type (" .. self.__type .. ", " .. other.__type .. ")")
		end
	end
end

--[=[
	Makes a copy of this instance, also copying super-instances.
--]=]
function BaseModule:deepClone(): BaseModule
	if self.__type == "BaseModule" then
		return self
	else
		error("BaseModule deepClone() not implemented for type " .. self.__type)
	end
end

return BaseModule :: Type.BaseModuleEXTENSIBLE<any>

--!strict

--[[
	Module with constructors for all classes.
]]


local Modules = require(game.ReplicatedStorage.Modules.Modules)


local Constructors = {__index = {}}


--[=[
	Creates a new SolarSystemObject instance.
]=]
function Constructors:SolarSystemObjectConstructor(part: Part): Modules.SolarSystemObject
	local self = setmetatable({}, SolarSystemObject)
	self.Part = part
	return self
end


--[=[
	Creates a new GravityBody instance.
]=]
function Constructors:SolarSystemBodyConstructor(part: Part): SolarSystemBody.SolarSystemBody
	local self = setmetatable({}, SolarSystemBody)
	self.Part = part
	return self
end


--[=[
	Creates a new GravityBody instance.
]=]
function Constructors:GravityBodyConstructor(part: Part): GravityBody.GravityBody
	local self = setmetatable({}, GravityBody)
	self.Part = part
	return self
end


return Constructors

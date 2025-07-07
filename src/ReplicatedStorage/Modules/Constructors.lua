--!strict

local Modules = require(game.ReplicatedStorage.Modules.Modules)

--[[
	Module with constructors for all classes.
]]

local Constructors = { __index = {} }

--[=[
	Creates a new GravityBody instance.
]=]
function Constructors.GravityBodyConstructor(part: Part): Modules.GravityBody
	local self = setmetatable({}, GravityBody)
	self.RootPart = part
	return self
end

return Constructors

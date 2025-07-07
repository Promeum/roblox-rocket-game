--!strict

local Modules = require(game.ReplicatedStorage.Modules.Modules)

local Vector3P = {}

--[=[
    Creates a new Vector3P instance.
    Note: Use the set() methods to change rho, theta, and phi.
]=]
function Vector3P.new(rho: number, theta: number, phi: number): Modules.Vector3P
	local newVector3P = table.clone(Vector3P)

	newVector3P.Rho = rho
	newVector3P.Theta = theta
	newVector3P.Phi = phi

	local magnitudeInXYPlane = rho * math.sin(phi)

	local x = magnitudeInXYPlane * math.cos(theta)
	local y = magnitudeInXYPlane * math.sin(theta)
	local z = rho * math.cos(phi)

	local metatable = { __index = Vector3.new(x, y, z), __type = "Vector3P" }

	setmetatable(newVector3P, metatable)

	return newVector3P
end

--[=[
    Creates a new Vector3P instance from a Vector3.
]=]
function Vector3P.fromVector3(Vector: Vector3): Modules.Vector3P
	local rho = Vector.Magnitude
	local theta = Vector:Angle(Vector3.zAxis)
	local phi = math.atan2(Vector.Y, Vector.X)

	return Vector3P.new(rho, theta, phi)
end

--[=[
    Sets the value of rho and returns the updated value of this Vector3P.
]=]
function Vector3P:setRho(value: number): Modules.Vector3P
	self.Rho = value

	local magnitudeInXYPlane = self.Rho * math.sin(self.Phi)

	local x = magnitudeInXYPlane * math.cos(self.Theta)
	local y = magnitudeInXYPlane * math.sin(self.Theta)
	local z = self.Rho * math.cos(self.Phi)

	getmetatable(self).__index = Vector3.new(x, y, z)

	return self
end

--[=[
    Sets the value of theta and returns the updated value of this Vector3P.
]=]
function Vector3P:setTheta(value: number): Modules.Vector3P
	self.Theta = value

	local magnitudeInXYPlane = self.Rho * math.sin(self.Phi)

	local x = magnitudeInXYPlane * math.cos(self.Theta)
	local y = magnitudeInXYPlane * math.sin(self.Theta)
	local z = self.Rho * math.cos(self.Phi)

	getmetatable(self).__index = Vector3.new(x, y, z)

	return self
end

--[=[
    Sets the value of phi and returns the updated value of this Vector3P.
]=]
function Vector3P:setPhi(value: number): Modules.Vector3P
	self.Phi = value

	local magnitudeInXYPlane = self.Rho * math.sin(self.Phi)

	local x = magnitudeInXYPlane * math.cos(self.Theta)
	local y = magnitudeInXYPlane * math.sin(self.Theta)
	local z = self.Rho * math.cos(self.Phi)

	getmetatable(self).__index = Vector3.new(x, y, z)

	return self
end

--[=[
    Returns the internal Vector3 instance stored within a Vector3P.
]=]
function Vector3P:ToVector3(): Vector3
	return getmetatable(self).__index
end

return Vector3P

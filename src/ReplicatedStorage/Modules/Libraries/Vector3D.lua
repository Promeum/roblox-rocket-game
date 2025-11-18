--[[

MIT License

Copyright (c) 2025 Promeum

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

]]

--[=[
	Vector3D: A 64-bit floating point vector module intended to replace
	Roblox's built-in 32-bit floating point Vector3/vector library.

	See Roblox's documentation for the Vector3 and vector libraries
	for further information on the included functions.

	By Promeum
--]=]

-- Vector3D
local Vector3D = {}
local metatable = {}

-- Metamethods

function __tostring(self): string
	return `Vector3D({self.X}, {self.Y}, {self.Z})`
end

function __unm(self)
	return Vector3D.new(-self.X, -self.Y, -self.Z)
end

function __add(self, other)
	return Vector3D.new(self.X + other.X, self.Y + other.Y, self.Z + other.Z)
end

function __sub(self, other)
	return Vector3D.new(self.X - other.X, self.Y - other.Y, self.Z - other.Z)
end

function Vector__mul(self, other)
	return Vector3D.new(self.X * other.X, self.Y * other.Y, self.Z * other.Z)
end

function Number__mul(self, other: number)
	return Vector3D.new(self.X * other, self.Y * other, self.Z * other)
end

function Vector__div(self, other)
	return Vector3D.new(self.X / other.X, self.Y / other.Y, self.Z / other.Z)
end

function Number__div(self, other: number)
	return Vector3D.new(self.X / other, self.Y / other, self.Z / other)
end

function Vector__idiv(self, other)
	return Vector3D.new(self.X // other.X, self.Y // other.Y, self.Z // other.Z)
end

function Number__idiv(self, other: number)
	return Vector3D.new(self.X // other, self.Y // other, self.Z // other)
end

function __eq(self, other): boolean
	return self.X == other.X and self.Y == other.Y and self.Z == other.Z
end

-- Other Functions

local function EnsureCompatibilityVectorOrNumber(FuncVector, FuncDouble, Unary)
	if Unary then
		return function(a)
			if getmetatable(a) ~= metatable then
				error("bad argument: expected Vector3D, got " .. typeof(a))
			end

			return FuncVector(a)
		end
	else
		return function(a, b)
			local type_a = typeof(a)

			if type_a == "table" and getmetatable(a) == metatable then
				type_a = "Vector3D"
			end

			local type_b = typeof(b)

			if type_b == "table" and getmetatable(b) == metatable then
				type_b = "Vector3D"
			end

			if type_a == "Vector3D" and type_b == "Vector3D" then
				return FuncVector(a, b)
			elseif table.find({type_a, type_b}, "number") and table.find({type_a, type_b}, "Vector3D") and FuncDouble then
				if type_a == "number" then
					return FuncDouble(b, a)
				else
					return FuncDouble(a, b)
				end
			else
				if type_a ~= "Vector3D" then
					if type_a ~= "number" and FuncDouble then
						error("bad argument to #1: expected Vector3D or number, got " .. type_a)
					end

					error("bad argument to #1: expected Vector3D, got " .. type_a)
				end

				if type_b ~= "Vector3D" then
					if type_b ~= "number" and FuncDouble then
						error("bad argument to #2: expected Vector3D or number, got " .. type_b)
					end
					
					error("bad argument to #2: expected Vector3D, got " .. type_b)
				end

				error("bad arguments, got " .. type_a .. " and " .. type_b)
			end
		end
	end
end

function Vector3D.new(x, y, z)
	local newVector3D = table.clone(Vector3D)

	newVector3D.X = x
	newVector3D.Y = y
	newVector3D.Z = z

	return table.freeze(newVector3D)
end

function Vector3D.FromNormalId(normal)
	if table.find({0, 1, 2, 3, 4, 5}, normal) then
		if normal < 3 then
			return Vector3D.FromAxis(normal)
		else
			return -Vector3D.FromAxis(normal - 3)
		end
	else
		error(`bad argument: expected number from 0 to 5, got {normal}`)
	end
end

function Vector3D.FromAxis(axis)
	if axis == 0 then
		return Vector3D.xAxis
	elseif axis == 1 then
		return Vector3D.yAxis
	elseif axis == 2 then
		return Vector3D.zAxis
	else
		error(`bad argument: expected number from 0 to 2, got {axis}`)
	end
end

-- Setup metatable

-- Unary operators
metatable.__tostring = EnsureCompatibilityVectorOrNumber(__tostring, nil, true)
metatable.__unm = EnsureCompatibilityVectorOrNumber(__unm, nil, true)

-- Binary operators
metatable.__add = EnsureCompatibilityVectorOrNumber(__add)
metatable.__sub = EnsureCompatibilityVectorOrNumber(__sub)
metatable.__mul = EnsureCompatibilityVectorOrNumber(Vector__mul, Number__mul)
metatable.__div = EnsureCompatibilityVectorOrNumber(Vector__div, Number__div)
metatable.__idiv = EnsureCompatibilityVectorOrNumber(Vector__idiv, Number__idiv)

metatable.__eq = EnsureCompatibilityVectorOrNumber(__eq)

setmetatable(Vector3D, metatable)

-- Constants

Vector3D.zero = Vector3D.new(0, 0, 0)
Vector3D.one = Vector3D.new(1, 1, 1)
Vector3D.xAxis = Vector3D.new(1, 0, 0)
Vector3D.yAxis = Vector3D.new(0, 1, 0)
Vector3D.zAxis = Vector3D.new(0, 0, 1)

-- Methods

function Vector3D.FromVector3(vector)
	return Vector3D.new(vector.X, vector.Y, vector.Z)
end

function Vector3D:Magnitude()
	return math.sqrt(self.X ^ 2 + self.Y ^ 2 + self.Z ^ 2)
end

function Vector3D:Unit()
	return self / self:Magnitude()
end

function Vector3D:Abs()
	return Vector3D.new(math.abs(self.X), math.abs(self.Y), math.abs(self.Z))
end

function Vector3D:Ceil()
	return Vector3D.new(math.ceil(self.X), math.ceil(self.Y), math.ceil(self.Z))
end

function Vector3D:Floor()
	return Vector3D.new(math.floor(self.X), math.floor(self.Y), math.floor(self.Z))
end

function Vector3D:Sign()
	return Vector3D.new(math.sign(self.X), math.sign(self.Y), math.sign(self.Z))
end

function Vector3D:Cross(other)
	return Vector3D.new(
		self.Y * other.Z - self.Z * other.Y,
		self.Z * other.X - self.X * other.Z,
		self.X * other.Y - self.Y * other.X
	)
end

function Vector3D:Angle(other, axis)
	local result = math.acos( (self:Unit()):Dot(other:Unit()) )

	if axis then
		return result * math.sign( self:Cross(other):Dot(axis) )
	else
		return result
	end
end

function Vector3D:Dot(other)
	return self.X * other.X + self.Y * other.Y + self.Z * other.Z
end

function Vector3D:FuzzyEq(other, epsilon)
	if not epsilon then
		epsilon = 1e-5
	end

	return math.abs(self:Magnitude() ^ 2 - other:Magnitude() ^ 2) < epsilon
end

function Vector3D:Lerp(other, alpha)
	local toOther = other - self
	return self + alpha * toOther
end

function Vector3D:Max()
	local max = math.max(self.X, self.Y, self.Z)
	return Vector3D.new(max, max, max)
end

function Vector3D:Min()
	local min = math.min(self.X, self.Y, self.Z)
	return Vector3D.new(min, min, min)
end

function Vector3D:ToVector3()
	return Vector3.new(self.X, self.Y, self.Z)
end

local Vector3DConstructorType = require(script.Parent.Parent.Constructor)
return (table.freeze(Vector3D) :: any) :: Vector3DConstructorType.Vector3D

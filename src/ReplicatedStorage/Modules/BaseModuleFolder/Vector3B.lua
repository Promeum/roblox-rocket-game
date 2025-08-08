--!nonstrict

local Modules = require(game.ReplicatedStorage.Modules.Modules)
local BigNum = require(game.ReplicatedStorage.Modules.Libraries.BigNum)
local BigMath = require(game.ReplicatedStorage.Modules.BigMath)

-- Vector3B
local Vector3B = {}
local metatable = { __type = "Vector3B" }

-- Metamethods

function __tostring(self: Modules.Vector3B): string
	return `Vector3B({self.X}, {self.Y}, {self.Z})`
end

function __unm(self: Modules.Vector3B): Modules.Vector3B
	return Vector3B.new(-self.X, -self.Y, -self.Z)
end

function Vector__add(self: Modules.Vector3B, other: Modules.Vector3B): Modules.Vector3B
	return Vector3B.new(self.X + other.X, self.Y + other.Y, self.Z + other.Z)
end

function Fraction__add(self: Modules.Vector3B, other: Modules.BigNum | Modules.Fraction | number): Modules.Vector3B
	local otherFraction = BigMath.toFraction(other)
	return Vector3B.new(self.X + otherFraction, self.Y + otherFraction, self.Z + otherFraction)
end

function Vector__sub(self: Modules.Vector3B, other: Modules.Vector3B): Modules.Vector3B
	return Vector3B.new(self.X - other.X, self.Y - other.Y, self.Z - other.Z)
end

function Fraction__sub(self: Modules.Vector3B, other: Modules.BigNum | Modules.Fraction | number): Modules.Vector3B
	local otherFraction = BigMath.toFraction(other)
	return Vector3B.new(self.X - otherFraction, self.Y - otherFraction, self.Z - otherFraction)
end

function Vector__mul(self: Modules.Vector3B, other: Modules.Vector3B): Modules.Vector3B
	return Vector3B.new(self.X * other.X, self.Y * other.Y, self.Z * other.Z)
end

function Fraction__mul(self: Modules.Vector3B, other: Modules.BigNum | Modules.Fraction | number): Modules.Vector3B
	local otherFraction = BigMath.toFraction(other)
	return Vector3B.new(self.X * otherFraction, self.Y * otherFraction, self.Z * otherFraction)
end

function Vector__div(self: Modules.Vector3B, other: Modules.Vector3B): Modules.Vector3B
	return Vector3B.new(self.X / other.X, self.Y / other.Y, self.Z / other.Z)
end

function Fraction__div(self: Modules.Vector3B, other: Modules.BigNum | Modules.Fraction | number): Modules.Vector3B
	local otherFraction = BigMath.toFraction(other)
	return Vector3B.new(self.X / otherFraction, self.Y / otherFraction, self.Z / otherFraction)
end

function __lt(self: Modules.Vector3B, other: Modules.Vector3B): boolean
	return self:Magnitude() < other:Magnitude()
end

function __eq(self: Modules.Vector3B, other: Modules.Vector3B): boolean
	return self.X == other.X and self.Y == other.Y and self.Z == other.Z
end

function __le(self: Modules.Vector3B, other: Modules.Vector3B): boolean
	return self:Magnitude() <= other:Magnitude()
end

-- Wrapper Functions

local function EnsureCompatibilityVectorOrFraction(FuncVector, FuncFraction, Unary)
	if Unary then
		return function(a: Modules.Vector3B)
			if getmetatable(a) ~= metatable then
				error("bad argument to #1: expected Vector3B, got " .. typeof(a))
			end

			return FuncVector(a)
		end
	else
		return function(a: Modules.Vector3B, b: Modules.Vector3B | Modules.BigNum | Modules.Fraction | number)
			if getmetatable(a) ~= metatable then
				error("bad argument to #1: expected Vector3B, got " .. typeof(a))
			end

			if typeof(b) ~= "number" and getmetatable(b) == metatable then
				return FuncVector(a, b)
			else
				if FuncFraction then
					return FuncFraction(a, BigMath.toFraction(b))
				else
					error("bad argument: expected Vector3B, got " .. typeof(a))
				end
			end
		end
	end
end

function Vector3B.new(
	x: Modules.BigNum | Modules.Fraction | number | string,
	y: Modules.BigNum | Modules.Fraction | number | string,
	z: Modules.BigNum | Modules.Fraction | number | string
): Modules.Vector3B
	local newVector3B = table.clone(Vector3B)

	newVector3B.X = BigMath.toFraction(x)
	newVector3B.Y = BigMath.toFraction(y)
	newVector3B.Z = BigMath.toFraction(z)

	return newVector3B
end

-- Setup metatable

-- Unary operators
metatable.__tostring = EnsureCompatibilityVectorOrFraction(__tostring, nil, true)
metatable.__unm = EnsureCompatibilityVectorOrFraction(__unm, nil, true)

-- Binary operators
metatable.__add = EnsureCompatibilityVectorOrFraction(Vector__add, Fraction__add)
metatable.__sub = EnsureCompatibilityVectorOrFraction(Vector__sub, Fraction__sub)
metatable.__mul = EnsureCompatibilityVectorOrFraction(Vector__mul, Fraction__mul)
metatable.__div = EnsureCompatibilityVectorOrFraction(Vector__div, Fraction__div)

metatable.__lt = EnsureCompatibilityVectorOrFraction(__lt)
metatable.__eq = EnsureCompatibilityVectorOrFraction(__eq)
metatable.__le = EnsureCompatibilityVectorOrFraction(__le)

setmetatable(Vector3B, metatable)

-- Constants

Vector3B.one = Vector3B.new(1, 1, 1)
Vector3B.zero = Vector3B.new(0, 0, 0)

-- Methods

--[=[

]=]
function Vector3B.fromVector3(vector: Vector3): Modules.Vector3B
	return Vector3B.new(vector.X, vector.Y, vector.Z)
end

local TWO = BigNum.newFraction(2, 1)
local ONE_OVER_TWO = BigNum.newFraction(1, 2)

--[=[

]=]
function Vector3B:Magnitude(): Modules.Fraction
	return BigMath.pow(BigMath.pow(self.X, TWO) + BigMath.pow(self.Y, TWO) + BigMath.pow(self.Z, TWO), ONE_OVER_TWO):Reduce()
end

--[=[

]=]
function Vector3B:Unit(): Modules.Vector3B
	return self / self:Magnitude()
end

--[=[

]=]
function Vector3B:Abs(): Modules.Vector3B
	return Vector3B.new(self.X:abs(), self.Y:abs(), self.Z:abs())
end

--[=[

]=]
function Vector3B:Ceil(): Modules.Vector3B
	return Vector3B.new(BigMath.ceil(self.X), BigMath.ceil(self.Y), BigMath.ceil(self.Z))
end

--[=[

]=]
function Vector3B:Floor(): Modules.Vector3B
	return Vector3B.new(BigMath.floor(self.X), BigMath.floor(self.Y), BigMath.floor(self.Z))
end

--[=[

]=]
function Vector3B:Sign(): Modules.Vector3B
	return Vector3B.new(BigMath.sign(self.X), BigMath.sign(self.Y), BigMath.sign(self.Z))
end

--[=[

]=]
function Vector3B:Cross(other: Modules.Vector3B): Modules.Vector3B
	return Vector3B.new(
		(self.Y * other.Z - self.Z * other.Y):Reduce(),
		(self.Z * other.X - self.X * other.Z):Reduce(),
		(self.X * other.Y - self.Y * other.X):Reduce()
	)
end

--[=[

]=]
function Vector3B:Angle(other: Modules.Vector3B, axis: Modules.Vector3B?): Modules.Fraction
	local result = BigMath.acos( (self:Unit()):Dot(other:Unit()) )

	if axis then
		return (result * BigNum.newFraction(BigMath.sign( self:Cross(other):Dot(axis) ), 1)):Reduce()
	else
		return result:Reduce()
	end
end

--[=[

]=]
function Vector3B:Dot(other: Modules.Vector3B): Modules.Fraction
	return (self.X * other.X + self.Y * other.Y + self.Z * other.Z):Reduce()
end

--[=[

]=]
function Vector3B:Lerp(other: Modules.Vector3B, alpha: Modules.Fraction | Modules.BigNum | number): Modules.Vector3B
	local toOther = other - self

	return self + BigMath.toFraction(alpha) * toOther
end

--[=[

]=]
function Vector3B:Max(): Modules.Vector3B
	local max = BigMath.max(self.X, self.Y, self.Z)
	return Vector3B.new(max, max, max)
end

--[=[

]=]
function Vector3B:Min(): Modules.Vector3B
	local min = BigMath.min(self.X, self.Y, self.Z)
	return Vector3B.new(min, min, min)
end

--[=[
	
]=]
function Vector3B:toVector3(): Vector3
	return Vector3.new(self.X:toNumber(), self.Y:toNumber(), self.Z:toNumber())
end

return Vector3B

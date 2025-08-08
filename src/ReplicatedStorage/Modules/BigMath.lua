--[[

MIT License

Copyright (c) 2018 RoStrap

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

--[[
    BigMath: A math module implementation for BigNums / Fractions.
    By ppoopeefart
--]]

local Modules = require(script.Parent.Modules)
local BigNum = require(game.ReplicatedStorage.Modules.Libraries.BigNum)

-- Constants
local RAD_TO_DEG = BigNum.newFraction(180e16, BigNum.new(math.pi * 1e16))
local DEG_TO_RAD = BigNum.newFraction(BigNum.new(math.pi * 1e16), 180e16)
local PI = BigNum.newFraction(math.pi * 1e16, 1e16)

-- BigMath
local BigMath = {}

-- Supplementary Functions And Et Cetera

function toDecimal(a): number
	if getmetatable(a) == BigNum then
		return a:toScientificNotation()
	elseif getmetatable(a) == BigNum.Fraction then
		return a:toNumber()
	elseif type(a) == "number" then
		return a
	else
		return error("bad argument: expected BigNum or Fraction, got " .. typeof(a))
	end
end

local commonlyUsedValues = {
	[0] = BigNum.newFraction(0, 1),
	[1] = BigNum.newFraction(1, 1),
	[2] = BigNum.newFraction(2, 1),
	[math.pi] = PI
}

function toFraction(a: Modules.BigNum | Modules.Fraction | number | string): Modules.Fraction
	if type(a) == "number" then
		if a ~= a then
			-- warn(`a is nan ({a})`)
			return BigNum.newFraction(0, 0)
		elseif math.abs(a) == math.huge then
			-- warn(`a is inf ({a})`)
			return BigNum.newFraction(math.sign(a), 0)
		end
		if table.find({0, 1, 2, math.pi}, a) then
			return commonlyUsedValues[a]
		end
		a = tostring(a)
	end

	if type(a) == "string" then
		local eLocation = a:find("e")

		if not eLocation then
			local aSplit = a:split(".")
			local powerOfTen = if #aSplit == 2 then aSplit[2]:len() else 0

			return BigNum.newFraction(table.concat(aSplit, ""), 10 ^ powerOfTen):Reduce()
		else
			local esplit = a:split("e")
			local ePower = tonumber(esplit[2])
			local aSplit = esplit[1]:split(".")
			local powerOfTen = (if #aSplit == 2 then aSplit[2]:len() else 0) - ePower

			if math.sign(powerOfTen) == -1 then
				return BigNum.newFraction(a, 1)
			else
				return BigNum.newFraction(table.concat(aSplit, ""), 10 ^ powerOfTen):Reduce()
			end
		end
	elseif getmetatable(a) == BigNum.Fraction then
		return a:Reduce()
	elseif getmetatable(a) == BigNum then
		return BigNum.newFraction(a, 1)
	else
		return error("bad argument: expected BigNum or Fraction or number, got " .. typeof(a))
	end
end

function toFractionOrBigNum(a: Modules.BigNum | Modules.Fraction | number | string): Modules.BigNum | Modules.Fraction
	local result = toFraction(a)

	return if result.Denominator == BigNum.new(1) then result.Numerator else result
end

function toBigNum(a: Modules.BigNum | Modules.Fraction | number | string): Modules.BigNum
	local result = toFraction(a)

	return if result.Denominator == BigNum.new(1) then result.Numerator else error("argument could not be converted into BigNum, result: " .. result)
end

function isNaN(a: Modules.BigNum | Modules.Fraction | number): boolean
	if type(a) == "number" then
		return a ~= a
	elseif getmetatable(a) == BigNum.Fraction then
		return a.Numerator == 0 and a.Denominator == 0
	elseif getmetatable(a) == BigNum then
		return false
	else
		return error("bad argument: expected BigNum or Fraction or number, got " .. typeof(a))
	end
end

--Functions

function abs<t>(a: t): t
	return a:abs()
end

function sign(a): number
	return a:sign()
end

function factorial(n): Modules.BigNum
	local result = BigNum.new(1)

	for i = toDecimal(n), 1, -1 do
		result *= i
	end

	return result
end

function fmod(a, b): Modules.BigNum
	if getmetatable(a) == BigNum then
		return (BigMath.abs(a) % b) * BigNum.new(BigMath.sign(a))
	else
		return (BigMath.abs(a) - BigNum.newFraction(BigMath.floor(BigMath.abs(a) / b), 1)) * BigNum.newFraction(BigMath.sign(a), 1)
	end
end

function floor(a): Modules.BigNum
	if getmetatable(a) == BigNum then
		return a
	else
		return a:floor()
	end
end

function ceil(a): Modules.BigNum
	if getmetatable(a) == BigNum then
		return a
	else
		return a:ceil()
	end
end

function pow(a, b): Modules.Fraction
	return toFraction(math.pow(toDecimal(a), toDecimal(b)))
end

function acos(a): Modules.Fraction
	return toFraction(math.acos(toDecimal(a)))
end

function asin(a): Modules.Fraction
	return toFraction(math.asin(toDecimal(a)))
end

function atan(a): Modules.Fraction
	return toFraction(math.atan(toDecimal(a)))
end

function atan2(y, x): Modules.Fraction
	return toFraction(math.atan2(toDecimal(y), toDecimal(x)))
end

function cos(a): Modules.Fraction
	return toFraction(math.cos(toDecimal(a)))
end

function cosh(a): Modules.Fraction
	return toFraction(math.cosh(toDecimal(a)))
end

function deg(a): Modules.Fraction
	return toFraction(a) * RAD_TO_DEG
end

function sin(a): Modules.Fraction
	return toFraction(math.sin(toDecimal(a)))
end

function sinh(a): Modules.Fraction
	return toFraction(math.sinh(toDecimal(a)))
end

local ONE_OVER_TWO = BigNum.newFraction(1, 2)

function sqrt(a): Modules.Fraction
	return pow(a, ONE_OVER_TWO)
end

function tan(a): Modules.Fraction
	return toFraction(math.tan(toDecimal(a)))
end

function tanh(a): Modules.Fraction
	return toFraction(math.tanh(toDecimal(a)))
end

function log(a, b): Modules.Fraction
	if b then
		return toFraction(math.log(toDecimal(a), toDecimal(b)))
	else
		return toFraction(math.log(toDecimal(a)))
	end
end

function log10(a): Modules.Fraction
	return toFraction(math.log10(toDecimal(a)))
end

function sort(...: Modules.BigNum | Modules.Fraction | number | string): {Modules.Fraction}
	local array = ...
	local resultArray = {}

	for i, v in array do
		resultArray[i] = toFraction(v)
	end

	table.sort(resultArray)

	return resultArray
end

function max(...: Modules.BigNum | Modules.Fraction | number | string): Modules.Fraction
	return sort(...)[1]
end

function min(...: Modules.BigNum | Modules.Fraction | number | string): Modules.Fraction
	return sort(...)[-1]
end

function rad(a): Modules.Fraction
	return toFraction(a) * DEG_TO_RAD
end

function round(a): Modules.BigNum
	local fraction = toFraction(a)
	return toFractionOrBigNum(math.round(toDecimal(fraction.Numerator) / toDecimal(fraction.Denominator)))
end

-- Wrapper Functions

local function EnsureCompatibility(Func, Unary)
	local typeof = typeof or type

	if Unary then
		return function(a, ...)
			if getmetatable(a) ~= BigNum.Fraction and getmetatable(a) ~= BigNum and typeof(a) ~= "number" and typeof(a) ~= "string" then
				error("bad argument to #1: expected BigNum, Fraction, number, or string, got " .. typeof(a))
			end

			a = toFraction(a)

			return Func(a, ...)
		end
	else
		return function(a, b)
			if getmetatable(a) ~= BigNum.Fraction and getmetatable(a) ~= BigNum and typeof(a) ~= "number" and typeof(a) ~= "string" then
				error("bad argument to #1: expected BigNum or Fraction, got " .. typeof(a))
			end

			a = toFraction(a)
			
			if getmetatable(b) ~= BigNum.Fraction and getmetatable(b) ~= BigNum and typeof(b) ~= "number" and typeof(b) ~= "string" then
				error("bad argument to #1: expected BigNum or Fraction, got " .. typeof(b))
			end

			b = toFraction(b)
			
			if #a ~= #b then
				error("You cannot operate on Fractions with BigNums of different sizes: " .. #a .. " and " .. #b)
			end

			return Func(a, b)
		end
	end
end

local function EnsureCompatibilityBigNum(Func, Unary)
	local typeof = typeof or type

	if Unary then
		return function(a, ...)
			if getmetatable(a) ~= BigNum and typeof(a) ~= "number" and typeof(a) ~= "string" then
				local typeof_a = if getmetatable(a) == BigNum.Fraction then "Fraction" else typeof(a)
				error("bad argument to #1: expected BigNum, got " .. typeof_a)
			end

			a = toFraction(a)

			return Func(a, ...)
		end
	else
		return function(a, b)
			if getmetatable(a) ~= BigNum and typeof(a) ~= "number" and typeof(a) ~= "string" then
				local typeof_a = if getmetatable(a) == BigNum.Fraction then "Fraction" else typeof(a)
				error("bad argument to #1: expected BigNum, got " .. typeof_a)
			end

			a = toFraction(a)

			if getmetatable(b) ~= BigNum and typeof(b) ~= "number" and typeof(b) ~= "string" then
				local typeof_b = if getmetatable(b) == BigNum.Fraction then "Fraction" else typeof(b)
				error("bad argument to #2: expected BigNum, got " .. typeof_b)
			end

			b = toFraction(b)

			if #a ~= #b then
				error("You cannot operate on BigNums with different radix: " .. #a .. " and " .. #b)
			end

			return Func(a, b)
		end
	end
end

-- Setup BigMath

BigMath.abs = EnsureCompatibility(abs, true)
BigMath.acos = EnsureCompatibility(acos, true)
BigMath.asin = EnsureCompatibility(asin, true)
BigMath.atan = EnsureCompatibility(atan, true)
BigMath.atan2 = EnsureCompatibility(atan2)
BigMath.factorial = EnsureCompatibilityBigNum(factorial, true)
BigMath.fmod = EnsureCompatibility(fmod, true)
BigMath.floor = EnsureCompatibility(floor, true)
BigMath.ceil = EnsureCompatibility(ceil, true)
BigMath.sign = EnsureCompatibility(sign, true)
BigMath.sin = EnsureCompatibility(sin, true)
BigMath.sinh = EnsureCompatibility(sinh, true)
BigMath.sqrt = EnsureCompatibility(sqrt, true)
BigMath.cos = EnsureCompatibility(cos, true)
BigMath.cosh = EnsureCompatibility(cosh, true)
BigMath.deg = EnsureCompatibility(deg, true)
BigMath.tan = EnsureCompatibility(tan, true)
BigMath.tanh = EnsureCompatibility(tanh, true)
BigMath.log = EnsureCompatibility(log, true)
BigMath.log10 = EnsureCompatibility(log10, true)
BigMath.max = EnsureCompatibility(sort, true)
BigMath.max = EnsureCompatibility(max, true)
BigMath.min = EnsureCompatibility(min, true)
BigMath.rad = EnsureCompatibility(rad, true)
BigMath.round = EnsureCompatibility(round, true)
BigMath.pow = EnsureCompatibility(pow)

BigMath.toFraction = toFraction
BigMath.toFractionOrBigNum = toFractionOrBigNum
BigMath.toBigNum = toBigNum
BigMath.toDecimal = EnsureCompatibility(toDecimal, true)

BigMath.isNaN = EnsureCompatibility(isNaN, true)

return BigMath

--[[
the old taylor series trig mechanisms (abandoned; built-in math functions are more efficient)

local TAYLOR_SERIES_ITERATIONS = 6

local SinTaylorSeriesCoefficients = {}
local CosTaylorSeriesCoefficients = {}
local TanTaylorSeriesCoefficients = {
	BigNum.newFraction("1", "1"),
	BigNum.newFraction("1", "3"),
	BigNum.newFraction("2", "15"),
	BigNum.newFraction("17", "315"),
	BigNum.newFraction("62", "2835"),
	BigNum.newFraction("1382", "155925"),
	BigNum.newFraction("21844", "6081075"),
	BigNum.newFraction("929569", "638512875"),
	BigNum.newFraction("6404582", "10854718875"),
	BigNum.newFraction("18888466084", "194896477400625"),
	BigNum.newFraction("113927491862", "2900518163668125"),
	BigNum.newFraction("58870668456604", "3698160658676859375"),
	BigNum.newFraction("8374643517010684", "1298054391195577640625"),
	BigNum.newFraction("689005380505609448", "263505041412702261046875"),
	BigNum.newFraction("129848163681107301953", "122529844256906551386796875"),
	BigNum.newFraction("1736640792209901647222", "4043484860477916195764296875"),
}
local NLogTaylorSeriesCoefficients = {}

for n = 0, TAYLOR_SERIES_ITERATIONS - 1 do
	table.insert(SinTaylorSeriesCoefficients, BigNum.newFraction(((-1) ^ n) * factorial(2 * n + 1), 1))
	table.insert(CosTaylorSeriesCoefficients, BigNum.newFraction(((-1) ^ n) * factorial(2 * n), 1))
	table.insert(NLogTaylorSeriesCoefficients, BigNum.new(((-1) ^ (n - 1)) * n))
end

function proto_sin(x): Modules.BigNum | Modules.Fraction
	local summation = BigNum.newFraction(0, 1)

	for n = 1, TAYLOR_SERIES_ITERATIONS do
		summation += (x ^ BigNum.newFraction(2 * n, 1)) / SinTaylorSeriesCoefficients[n]
		summation = summation:Reduce()
	end

	return summation
end

function proto_cos(x): Modules.BigNum | Modules.Fraction
	local summation = BigNum.newFraction(0, 1)

	for n = 0, TAYLOR_SERIES_ITERATIONS - 1 do
		summation += (x ^ BigNum.newFraction(2 * n, 1)) / CosTaylorSeriesCoefficients[n + 1]
	end

	return summation
end

local PI_OVER_2 = PI * BigNum.newFraction(1, 2)
local PI_OVER_4 = PI * BigNum.newFraction(1, 4)
local PI3_OVER_4 = PI * BigNum.newFraction(3, 4)
local PI3_OVER_4_NEGATIVE = PI * BigNum.newFraction(3, 4)

function sin(a): Modules.BigNum | Modules.Fraction
	if getmetatable(a) == BigNum then
		a = BigNum.newFraction(a, 1)
	end

	local x = BigMath.fmod(a, PI):Reduce()
	
	-- https://www.desmos.com/calculator/tx7bgjwxuf
	if abs(x) < PI_OVER_4 then
		return proto_sin(x)
	elseif sign(x) == 1 then
		if x <= PI3_OVER_4 then
			return proto_cos(x - PI_OVER_2)
		else
			return -proto_sin(x - PI)
		end
	else
		if x >= PI3_OVER_4_NEGATIVE then
			return -proto_cos(x + PI_OVER_2)
		else
			return -proto_sin(x + PI)
		end
	end
end

function cos(a): Modules.BigNum | Modules.Fraction
	if getmetatable(a) == BigNum then
		a = BigNum.newFraction(a, 1)
	end

	local x = BigMath.fmod(a, PI):Reduce()
	
	-- https://www.desmos.com/calculator/tx7bgjwxuf
	if abs(x) < PI_OVER_4 then
		return proto_cos(x)
	elseif sign(x) == 1 then
		if x <= PI3_OVER_4 then
			return -proto_sin(x - PI_OVER_2)
		else
			return -proto_cos(x - PI)
		end
	else
		if x >= PI3_OVER_4_NEGATIVE then
			return proto_sin(x + PI_OVER_2)
		else
			return -proto_cos(x + PI)
		end
	end
end

function tan(a): Modules.BigNum | Modules.Fraction
	if getmetatable(a) == BigNum then
		a = BigNum.newFraction(a, 1)
	end

	local x = BigMath.fmod(a, PI_OVER_2):Reduce()

	local summation = Constants.ZERO_FRACTION

	for n = 0, TAYLOR_SERIES_ITERATIONS - 1 do
		summation += (x ^ BigNum.newFraction(2 * n, 1)) * TanTaylorSeriesCoefficients[n + 1]
	end

	return summation
end

-- No support for logarithms with bases other than e yet
function log(a): Modules.BigNum | Modules.Fraction
	if getmetatable(a) == BigNum then
		assert(a < BigNum.new(1) and a > BigNum.new(0), `a is out of range (0, 1) ({a})`)
	elseif getmetatable(a) == BigNum.Fraction then
		assert(a < BigNum.newFraction(1, 1) and a > BigNum.newFraction(0, 1), `a is out of range (0, 1) ({a})`)
	end
	

	local summation = Constants.ZERO_FRACTION

	for n = 1, TAYLOR_SERIES_ITERATIONS do
		summation += BigNum.newFraction(BigNum.new((a - 1) ^ n), NLogTaylorSeriesCoefficients[n])
	end

	return summation
end

--]]
--!strict

local _Modules = require(game.ReplicatedStorage.Modules.Modules)
local BigNum = require(game.ReplicatedStorage.Modules.Libraries.BigNum)

local Constants = {
	SOLAR_SYSTEM_SCALE = 1 / 1_000_000, --10_000_000,

	GRAVITATIONAL_CONSTANT = BigNum.newFraction(66743, 1e15),
	PI = BigNum.newFraction(math.pi * 1e16, 1e16),
	PI_E16 = BigNum.new(math.pi * 1e16),
	ONE_E16 = BigNum.new(1e16),
	ZERO = BigNum.new(0),--BigNum.new({
	-- 	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	-- 	0, 0
	-- }),
	ZERO_FRACTION = BigNum.newFraction(0, 1),
	ONE = BigNum.new(1),--BigNum.new{
	-- 	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	-- 	0, 1
	-- },
	ONE_FRACTION = BigNum.newFraction(1, 1),
	TWO_FRACTION = BigNum.newFraction(2, 1),
}

return Constants

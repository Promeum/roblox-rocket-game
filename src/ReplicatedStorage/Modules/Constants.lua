--!strict

-- local Type = require(script.Parent.Type)

local Constants = {
	GRAVITATIONAL_CONSTANT = 6.6743e-11,
	SOLAR_SYSTEM_SCALE = 1 / 500_000_000 -- 1 / 1_500_000,
}

return Constants :: {
	GRAVITATIONAL_CONSTANT: number,
	SOLAR_SYSTEM_SCALE: number
}

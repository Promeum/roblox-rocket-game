--!strict

local Type = require("./Modules/Type")

local Globals = {
	rootCelestials = {}
}

return Globals :: {
    rootCelestials: { Type.Celestial }
}

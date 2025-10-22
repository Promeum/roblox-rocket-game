--!strict

local Type = require("./Modules/Type")

local Globals = {
	rootGravityCelestials = {},
    rootPhysicsCelestials = {},
}

return Globals :: {
    rootGravityCelestials: { Type.GravityCelestial },
    rootPhysicsCelestials: { Type.PhysicsCelestial }
}

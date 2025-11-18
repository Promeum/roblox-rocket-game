--!strict

local Type = require("../../Type")
local Constructor = require("../../Constructor")
local Constants = require("../../Constants")
local Globals = require("../../../Globals")
local Relative = require("../Relative")
local LinearTrajectory = require("../Trajectory/LinearTrajectory")
local OrbitalTrajectory = require("../Trajectory/OrbitalTrajectory")
local TemporalState = require("../Relative/State/TemporalState")
local KinematicTemporalState = require("../KinematicTemporalState")

-- Internal type
type Celestial = Type.CelestialEXTENSIBLE<Celestial,
		Type.RelativeEXTENSIBLE<Celestial,
			Type.BaseModuleEXTENSIBLE<Celestial
	>>>
	& Constructor.CelestialEXTENSIBLE<Celestial>
	& {
	trajectory: Type.LinearTrajectory | Type.OrbitalTrajectory,
}

local Celestial: Celestial = { __type = "Celestial" :: "Celestial" } :: any
local CelestialMT = {}

-- Constructors

--[=[
	Creates a new Celestial instance.
]=]
function Celestial.new(initialPosition: Type.KinematicTemporalState, orbiting: Celestial?): Celestial
	if orbiting then
		return Celestial.fromTrajectory(OrbitalTrajectory.newFromKinematicTemporalState(initialPosition, orbiting), orbiting)
	else
		assert(orbiting == nil, "Celestial new() Parameters inconsistent")
		return Celestial.fromTrajectory(LinearTrajectory.newFromKinematicTemporalState(initialPosition))
	end
end

--[=[
	Creates a new Celestial instance.
]=]
function Celestial.fromTrajectory(trajectory: Type.LinearTrajectory | Type.OrbitalTrajectory, orbiting: Celestial?): Celestial
	assert((trajectory.__type == "OrbitalTrajectory") ~= (orbiting == nil), "Celestial fromTrajectory() Parameters inconsistent")
	local self: Celestial = table.clone(Celestial) :: any

	local metatable = table.clone(CelestialMT)
	metatable.__index = Relative.new(orbiting)

	setmetatable(self, metatable)

	return self
		
end

-- Methods

function Celestial:func(): Type
end

return Celestial :: Constructor.CelestialEXTENSIBLE<any>

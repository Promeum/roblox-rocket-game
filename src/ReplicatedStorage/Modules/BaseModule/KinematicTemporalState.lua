--!strict
local Type = require("../Type")
local Constructor = require("../Constructor")
local BaseModule = require(".")
local TemporalState = require("../BaseModule/Relative/State/TemporalState")

-- Internal type
type KinematicTemporalState = Type.KinematicTemporalStateEXTENSIBLE<KinematicTemporalState,
		Type.BaseModuleEXTENSIBLE<KinematicTemporalState
	>>
	& Constructor.KinematicTemporalStateEXTENSIBLE<KinematicTemporalState>
	& {
		kinematicState: Type.KinematicState,
		temporalState: Type.TemporalState,
}

local KinematicTemporalState: KinematicTemporalState = { __type = "KinematicTemporalState" :: "KinematicTemporalState" } :: any
local KinematicTemporalStateMT = {}

function KinematicTemporalStateMT.__eq(self: KinematicTemporalState?, other: KinematicTemporalState?): boolean
	if (self ~= nil and other ~= nil) then
		self:assertTypesMatch(other)
		return self.kinematicState == other.kinematicState and self.temporalState == other.temporalState
	else
		return self == nil and other == nil
	end
end

-- Constructors

--[=[
	Creates a new KinematicTemporalState instance.
]=]
function KinematicTemporalState.new(kinematicState: Type.KinematicState, temporalState: Type.TemporalState): KinematicTemporalState
	local self = table.clone(KinematicTemporalState) :: any
	self.kinematicState = kinematicState
	self.temporalState = temporalState

	local metatable = table.clone(KinematicTemporalStateMT)
	metatable.__index = BaseModule

	setmetatable(self, metatable)

	return self
end

-- Methods

function KinematicTemporalState:getRelativeTime(): number
	return self.temporalState:getRelativeTime()
end

function KinematicTemporalState:getAbsoluteTime(): number
	return self.temporalState:getAbsoluteTime()
end

function KinematicTemporalState:getPosition(): Type.Vector3D
	return self.kinematicState:getPosition()
end

function KinematicTemporalState:getVelocity(): Type.Vector3D
	return self.kinematicState:getVelocity()
end

function KinematicTemporalState:getAbsolutePosition(): Type.Vector3D
	return self.kinematicState:getAbsolutePosition()
end

function KinematicTemporalState:getAbsoluteVelocity(): Type.Vector3D
	return self.kinematicState:getAbsoluteVelocity()
end

function KinematicTemporalState:addAcceleration(acceleration: Type.AccelerationState, delta: number?): KinematicTemporalState
	return KinematicTemporalState.new(
		self.kinematicState:addAcceleration(acceleration, delta),
		if delta then TemporalState.newIncrementTime(delta, self.temporalState) else self.temporalState
	)
end

function KinematicTemporalState:getKinematicState(): Type.KinematicState
	return self.kinematicState
end

function KinematicTemporalState:getTemporalState(): Type.TemporalState
	return self.temporalState
end

function KinematicTemporalState:getAbsoluteKinematicState(): Type.KinematicState
	return self.kinematicState:getAbsolute()
end

function KinematicTemporalState:getAbsoluteTemporalState(): Type.TemporalState
	return self.temporalState:getAbsolute()
end

function KinematicTemporalState:consolidateKinematic(): KinematicTemporalState
 	return KinematicTemporalState.new(
			self.kinematicState:getRelative(),
			self.temporalState
		)
end

function KinematicTemporalState:consolidateTemporal(): KinematicTemporalState
 	return KinematicTemporalState.new(
			self.kinematicState,
			self.temporalState:getRelative()
		)
end

function KinematicTemporalState:sameRelativeTree(other: KinematicTemporalState): boolean
 	return self:getKinematicState():sameRelativeTree(other:getKinematicState())
		and self:getTemporalState():sameRelativeTree(other:getTemporalState())
end

return KinematicTemporalState :: Constructor.KinematicTemporalState


local Type = require(script.Parent.Type)

--[=[
	Represents a 3D value in cartesian coordinates with 64-bit doubles.
]=]
export type Vector3D = {
	new: (x: number, y: number, z: number) -> Type.Vector3D,
	FromVector3: (vector: Vector3) -> Type.Vector3D,
	FromNormalId: (normal: Enum.NormalId) -> Type.Vector3D,
	FromAxis: (axis: Enum.Axis) -> Type.Vector3D,
	zero: Type.Vector3D,
	one: Type.Vector3D,
	xAxis: Type.Vector3D,
	yAxis: Type.Vector3D,
	zAxis: Type.Vector3D,
}

--[=[
	Base type for singly-linked list items.
]=]
export type RelativeEXTENSIBLE<T> = {
	--[=[
		Creates a new Relative instance.
	]=]
	new: (relativeTo: T?) -> T
}

--[=[
	Base coordinate type for all of the diffent spacetime state coordinate types.
]=]
export type StateEXTENSIBLE<T> = {
	--[=[
		Creates a new State instance.
	]=]
	new: (relativeTo: T?) -> T
}

--[=[
	Represents a time value in seconds, for physics calculation purposes.
	Can convert to other time units as well. (Or should this capability be in a planet/orbiting body instance?)
]=]
export type TemporalState = TemporalStateEXTENSIBLE<Type.TemporalState>
export type TemporalStateEXTENSIBLE<T> = {
	new: (relativeTime: number, relativeTo: T?) -> T,
	newRelativeTime: (relativeTime: number, temporalState: T) -> T,
	newIncrementTime: (delta: number, temporalState: T) -> T,
	newAbsoluteTime: (absoluteTime: number, relativeTo: T?) -> T
}

--[=[
	Represents a position and velocity.
]=]
export type KinematicState = KinematicStateEXTENSIBLE<Type.KinematicState>
export type KinematicStateEXTENSIBLE<T> = {
	new: (position: Type.Vector3D, velocity: Type.Vector3D, relativeTo: T?) -> T,
	newFromKinematicState: (kinematicState: T, relativeTo: T?) -> T,
}

--[=[
	Represents an acceleration over a period of time.
	Useful for stuff like simulating multiple rocket vectors whilst under the influence of gravity
]=]
export type AccelerationState = AccelerationStateEXTENSIBLE<Type.AccelerationState>
export type AccelerationStateEXTENSIBLE<T> = {
	new: (acceleration: Type.Vector3D, delta: number?, relativeTo: T?) -> T,
	newWithDelta: (accelerationState: T, delta: number?) -> T,
}

--[=[
	A composite state, made up of a KinematicState and TemporalState.
]=]
export type KinematicTemporalState = KinematicTemporalStateEXTENSIBLE<Type.KinematicTemporalState>
export type KinematicTemporalStateEXTENSIBLE<T> = {
	new: (kinematicState: Type.KinematicState, temporalState: Type.TemporalState) -> T,
}

--[=[
	Provides functionality regarding SOIs to superclasses.
]=]
export type TrajectoryEXTENSIBLE<T> = {
	new: (
		kinematicState: Type.KinematicState,
		temporalState: Type.TemporalState
	) -> T,
	fromPosition: (
		position: Type.KinematicTemporalState
	) -> T,
}

--[=[
	Used to calculate a linear trajectory through space, unaffected by any gravity force.
	Not-so-orbital mechanics!
]=]
export type LinearTrajectory = LinearTrajectoryEXTENSIBLE<Type.LinearTrajectory>
export type LinearTrajectoryEXTENSIBLE<T> = {
	new: (
		kinematicState: Type.KinematicState,
		temporalState: Type.TemporalState
	) -> T,
	fromPosition: (
		position: Type.KinematicTemporalState
	) -> T,
}

--[=[
	Provides functionality regarding SOIs to superclasses.
]=]
export type OrbitalTrajectory = OrbitalTrajectoryEXTENSIBLE<Type.OrbitalTrajectory>
export type OrbitalTrajectoryEXTENSIBLE<T> = {
	new: (
		kinematicState: Type.KinematicState,
		temporalState: Type.TemporalState,
		orbitingBody: Type.GravityCelestial
	) -> T,
	fromPosition: (
		position: Type.KinematicTemporalState,
		orbitingBody: Type.GravityCelestial
	) -> T,
}

export type CelestialEXTENSIBLE<T> = {
	new: (
		initialPosition: Type.KinematicTemporalState,
		orbiting: T?
	) -> T,
	fromTrajectory: (
		trajectory: Type.LinearTrajectory | Type.OrbitalTrajectory,
		orbiting: T?
	) -> T,
}

export type GravityCelestial = GravityCelestialEXTENSIBLE<Type.GravityCelestial>
export type GravityCelestialEXTENSIBLE<T> = {
	new: (
		mass: number,
		SOIRadius: number,
		initialPosition: Type.KinematicTemporalState,
		orbiting: T?
	) -> T,
	fromTrajectory: (
		mass: number,
		SOIRadius: number,
		trajectory: Type.LinearTrajectory | Type.OrbitalTrajectory,
		orbiting: T?
	) -> T,
}

export type PhysicsCelestial = PhysicsCelestialEXTENSIBLE<Type.PhysicsCelestial>
export type PhysicsCelestialEXTENSIBLE<T> = {
	new: (
		initialPosition: Type.KinematicTemporalState,
		orbiting: T?
	) -> T,
	fromTrajectory: (
		trajectory: Type.LinearTrajectory | Type.OrbitalTrajectory,
		orbiting: T?
	) -> T,
}

-- Silence warnings
return nil

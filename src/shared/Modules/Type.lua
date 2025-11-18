--!strict

-- export type PreciseNumber = typeof(setmetatable(
-- 	{} :: {
-- 		new: (value: number) -> PreciseNumber,
-- 		value: {
-- 			[number]: number
-- 		}
-- 	},
-- 	{} :: {
-- 		__add: (self: PreciseNumber, other: PreciseNumber | number) -> PreciseNumber,
-- 		__index: NumberValue,
-- 		__type: string
-- 	}
-- ))

-- --[=[
-- 	Represents a 3D value in cartesian coordinates with PreciseNumbers.
-- ]=]
-- export type Vector3P = typeof(setmetatable(
-- 	{} :: {
-- 		new: (x: PreciseNumber, y: PreciseNumber, z: PreciseNumber) -> Vector3P,
-- 		fromVector3: (Vector3: Vector3) -> Vector3P,
-- 		X: PreciseNumber,
-- 		Y: PreciseNumber,
-- 		Z: PreciseNumber,
-- 		setRho: (self: Vector3P, value: PreciseNumber) -> Vector3P,
-- 		setTheta: (self: Vector3P, value: PreciseNumber) -> Vector3P,
-- 		setPhi: (self: Vector3P, value: PreciseNumber) -> Vector3P,
-- 		ToVector3: (self: Vector3P) -> Vector3,
-- 	},
-- 	{} :: {
-- 		__type: string
-- 	}
-- ))

--[=[
	Base type for singly-linked list items.
	Immutable. Abstract.
]=]
export type RelativeEXTENSIBLE<T, S> = typeof(setmetatable(
	{} :: {
		hasRelative: (self: T) -> boolean,
		getRelative: (self: T) -> T,
		getRelativeOrNil: (self: T) -> T?,
		getRelativeTree: (self: T) -> { T },
		sameRelativeTree: (self: T, other: T) -> boolean,
		convergenceIndex: (self: T, other: T) -> number,
		convergenceItem: (self: T, other: T) -> T?,
		getSuper: (self: T) -> S,
		__type: "Relative",
	},
	{} :: {
		__index: S,
		__eq: (self: T, other: T) -> boolean,
		__len: (self: T) -> number,
	}
))

--[=[
	Base coordinate type for all of the diffent spacetime state coordinate types.
	Immutable. Abstract.
]=]
export type StateEXTENSIBLE<T, S> = typeof(setmetatable(
	{} :: {
		getAbsolute: (self: T) -> T,
		consolidateOnce: (self: T) -> T,
		synchronize: (self: T, other: T) -> (T, T),
		matchRelative: (self: T, other: T) -> T,
		getSuper: (self: T) -> S,
		__type: "State",
	},
	{} :: {
		__index: S,
		__add: (self: T, other: T) -> T,
		__sub: (self: T, other: T) -> T,
		-- __lt: (self: T, other: T) -> boolean,
		-- __le: (self: T, other: T) -> boolean,
	}
))

--[=[
	Represents a time value in seconds, for physics calculation purposes.
	Can convert to other time units as well. (Or should this capability be in a planet/orbiting body instance?)
	Immutable.
]=]
export type TemporalState = TemporalStateEXTENSIBLE<TemporalState,
	StateEXTENSIBLE<TemporalState,
		RelativeEXTENSIBLE<TemporalState,
			BaseModuleEXTENSIBLE<TemporalState
>>>>
export type TemporalStateEXTENSIBLE<T, S> = typeof(setmetatable(
	{} :: {
		getRelativeTime: (self: T) -> number,
		getAbsoluteTime: (self: T) -> number,
		getSuper: (self: T) -> S,
		__type: "TemporalState",
	},
	{} :: {
		__index: S,
		__add: (self: T, other: T) -> T,
		__sub: (self: T, other: T) -> T,
		__eq: (self: T, other: T) -> boolean,
		__lt: (self: T, other: T) -> boolean,
		__le: (self: T, other: T) -> boolean,
	}
))

--[=[
	Represents a position and velocity.
	Immutable.
]=]
export type KinematicState = KinematicStateEXTENSIBLE<KinematicState,
	StateEXTENSIBLE<KinematicState,
		RelativeEXTENSIBLE<KinematicState,
			BaseModuleEXTENSIBLE<KinematicState
>>>>
export type KinematicStateEXTENSIBLE<T, S> = KinematicStateSetup<T, S, AccelerationState>
-- Needs a setup type because of the declaration order of the types
-- (AccelerationState is declared after KinematicState)
type KinematicStateSetup<T, S, As> = typeof(setmetatable(
	{} :: {
		getPosition: (self: T) -> Vector3D,
		getVelocity: (self: T) -> Vector3D,
		getAbsolutePosition: (self: T) -> Vector3D,
		getAbsoluteVelocity: (self: T) -> Vector3D,
		addAcceleration: (self: T, acceleration: As, delta: number?) -> T,
		getSuper: (self: T) -> S,
		__type: "KinematicState",
	},
	{} :: {
		__index: S,
		__add: (self: T, other: T) -> T,
		__sub: (self: T, other: T) -> T,
		__eq: (self: T, other: T) -> boolean,
	}
))

--[=[
	An acceleration, represented by a velocity
	over a period of time (delta).
	Immutable.
]=]
export type AccelerationState = AccelerationStateEXTENSIBLE<AccelerationState,
	StateEXTENSIBLE<AccelerationState,
		RelativeEXTENSIBLE<AccelerationState,
			BaseModuleEXTENSIBLE<AccelerationState
>>>>
export type AccelerationStateEXTENSIBLE<T, S> = typeof(setmetatable(
	{} :: {
		changeDelta: (self: T, delta: number) -> T,
		getAccelerationVector: (self: T, delta: number?) -> Vector3D,
		getAbsoluteAcceleration: (self: T, delta: number?) -> Vector3D,
		getDelta: (self: T) -> number,
		consolidateOnce: (self: T, delta: number) -> T,
		getSuper: (self: T) -> S,
		__type: "AccelerationState"
	},
	{} :: {
		__index: S,
		__add: (self: T, other: T) -> T,
		__sub: (self: T, other: T) -> T,
		__eq: (self: T, other: T) -> boolean,
		__lt: (self: T, other: T) -> boolean,
		__le: (self: T, other: T) -> boolean,
	}
))

--[=[
	A composite state, made up of a KinematicState and TemporalState.
	Immutable.
]=]
export type KinematicTemporalState = KinematicTemporalStateEXTENSIBLE<KinematicTemporalState,
	BaseModuleEXTENSIBLE<KinematicTemporalState
>>
export type KinematicTemporalStateEXTENSIBLE<T, S> = KinematicTemporalStateSetup<T, S, AccelerationState>
-- Needs a setup type because of the declaration order of the types
-- (AccelerationState is declared after KinematicState)
type KinematicTemporalStateSetup<T, S, As> = KinematicStateEXTENSIBLE<T, S>
	& TemporalStateEXTENSIBLE<T, S>
	& typeof(setmetatable(
		{} :: {
			-- Convenience methods for quick access
			getRelativeTime: (self: T) -> number,
			getAbsoluteTime: (self: T) -> number,
			getPosition: (self: T) -> Vector3D,
			getVelocity: (self: T) -> Vector3D,
			getAbsolutePosition: (self: T) -> Vector3D,
			getAbsoluteVelocity: (self: T) -> Vector3D,
			addAcceleration: (self: T, acceleration: As, delta: number?) -> T,

			getKinematicState: (self: T) -> KinematicState,
			getTemporalState: (self: T) -> TemporalState,
			getAbsoluteKinematicState: (self: T) -> KinematicState,
			getAbsoluteTemporalState: (self: T) -> TemporalState,
			consolidateKinematic: (self: T) -> T,
			consolidateTemporal: (self: T) -> T,
			sameRelativeTree: (self: T, other: T) -> boolean,
			getSuper: (self: T) -> S,
			__type: "KinematicTemporalState"
		},
		{} :: {
			__index: S,
			__eq: (self: T, other: T) -> boolean,
		}
))

--[=[
	Provides functionality regarding SOIs to superclasses.
	Immutable. Abstract.
]=]
export type TrajectoryEXTENSIBLE<T, S> = typeof(setmetatable(
	{} :: {
		getStartPosition: (self: T) -> KinematicTemporalState,
		hasNextTrajectory: (self: T) -> boolean,
		nextTrajectory: (self: T) -> T,
		nextTrajectoryDirection: (self: T) -> "in" | "out",
		MOID: (self: T, other: T) -> KinematicTemporalState,
		calculatePointFromTime: (self: T, relativeTime: number) -> KinematicState,
		calculatePositionFromTime: (self: T, relativeTime: number) -> KinematicTemporalState,
		calculateTimeFromPoint: (self: T, position: Vector3D) -> number,
		calculatePositionFromPoint: (self: T, position: Vector3D) -> KinematicTemporalState,
		calculateTimeFromMagnitude: (self: T, magnitude: number) -> number,
		calculatePointFromMagnitude: (self: T, magnitude: number) -> KinematicState,
		calculatePositionFromMagnitude: (self: T, magnitude: number) -> KinematicTemporalState,
		atTime: (
			self: T,
			relativeTime: number,
			withAcceleration: AccelerationState?
		) -> T,
		increment: (
			self: T,
			delta: number,
			recursions: number?,
			withAcceleration: AccelerationState?
		) -> T,
		calculatePoints: (self: T, delta: number, recursions: number) -> { KinematicTemporalState },
		displayTrajectory: (self: T, delta: number, recursions: number, width: number) -> Folder,
		getSuper: (self: T) -> S,
		__type: "Trajectory",
	},
	{} :: {
		__index: S,
	}
))

--[=[
	Used to calculate a linear trajectory through space, unaffected by any gravity force.
	Not-so-orbital mechanics!
	Immutable.
]=]
export type LinearTrajectory = LinearTrajectoryEXTENSIBLE<LinearTrajectory,
	TrajectoryEXTENSIBLE<LinearTrajectory,
		BaseModuleEXTENSIBLE<LinearTrajectory
>>>
export type LinearTrajectoryEXTENSIBLE<T, S> = LinearTrajectoryStateSetup<T, S, OrbitalTrajectory>
-- Needs a setup type because of the declaration order of the types
type LinearTrajectoryStateSetup<T, S, Ot> = typeof(setmetatable(
	{} :: {
		nextTrajectory: (self: T) -> Ot,
		nextTrajectoryDirection: (self: T) -> "in",
		getSuper: (self: T) -> S,
		__type: "LinearTrajectory",
	},
	{} :: {
		__index: S,
	}
))

--[=[
	Used to calculate a conic orbit around a GravityBody.
	Orbital mechanics!
	https://www.desmos.com/3d/rfndgd4ppj
	Immutable.
]=]
export type OrbitalTrajectory = OrbitalTrajectoryEXTENSIBLE<OrbitalTrajectory,
	TrajectoryEXTENSIBLE<OrbitalTrajectory,
		BaseModuleEXTENSIBLE<OrbitalTrajectory
>>>
export type OrbitalTrajectoryEXTENSIBLE<T, S> = OrbitalTrajectorySetup<T, S, GravityCelestial>
type OrbitalTrajectorySetup<T, S, Gc> = typeof(setmetatable(
	{} :: {
		orbiting: (self: T) -> Gc,
		period: (self: T) -> number,
		hasApoapsis: (self: T) -> boolean,
		apoapsis: (self: T) -> KinematicState,
		periapsis: (self: T) -> KinematicState,
		semiMajorAxis: (self: T) -> number,
		semiMinorAxis: (self: T) -> number,
		eccentricity: (self: T) -> number,
		isBound: (self: T) -> boolean,
		isClosed: (self: T) -> boolean,
		recursiveTrueAnomalyHelper: (
			self: T,
			recursions: number,
			periapsisRelativeTime: number
		) -> number,
		calculateTimeFromTrueAnomaly: (self: T, trueAnomaly: number, referenceTrueAnomaly: number?) -> number,
		calculatePointFromTrueAnomaly: (self: T, trueAnomaly: number) -> KinematicState,
		calculatePositionFromTrueAnomaly: (self: T, trueAnomaly: number, referenceTime: number?) -> KinematicTemporalState,
		calculateTrueAnomalyFromTime: (self: T, relativeTime: number) -> number,
		calculateTrueAnomalyFromPoint: (self: T, position: Vector3D) -> number,
		calculateTimeFromPeriapsis: (self: T, trueAnomaly: number) -> number,
		calculateTrueAnomalyFromMagnitude: (self: T, magnitude: number) -> number,
		getSuper: (self: T) -> S,
		__type: "OrbitalTrajectory",
	},
	{} :: {
		__index: S,
	}
))

export type CelestialEXTENSIBLE<T, S> = typeof(setmetatable(
	{} :: {
		trajectoryType: (self: T) -> "LinearTrajectory" | "OrbitalTrajectory",
		getTrajectory: (self: T) -> LinearTrajectory | OrbitalTrajectory,
		getPosition: (self: T, relativeTime: number?) -> KinematicTemporalState,
		updatePosition: (self: T, delta: number) -> T,
		orbiting: (self: T) -> boolean,
		parentGravityCelestial: (self: T) -> T,
		getSuper: (self: T) -> S,
		__type: "Celestial",
	},
	{} :: {
		__index: S,
	}
))

export type GravityCelestial = GravityCelestialEXTENSIBLE<GravityCelestial,
	CelestialEXTENSIBLE<GravityCelestial,
		RelativeEXTENSIBLE<GravityCelestial,
			BaseModuleEXTENSIBLE<GravityCelestial
>>>, PhysicsCelestial>
export type GravityCelestialEXTENSIBLE<T, S, Pc> = typeof(setmetatable(
	{} :: {
		mass: (self: T) -> number,
		mu: (self: T) -> number,
		SOIRadius: (self: T) -> number,
		childGravityCelestials: (self: T) -> { T },
		childPhysicsCelestials: (self: T) -> { Pc },
		StandardGravitationalParameter: (self: T) -> number,
		orbitalVelocity: (self: T) -> number,
		escapeVelocity: (self: T) -> number,
		getSuper: (self: T) -> S,
		__type: "GravityCelestial",
	},
	{} :: {
		__index: S,
	}
))

export type PhysicsCelestial = PhysicsCelestialEXTENSIBLE<PhysicsCelestial,
	CelestialEXTENSIBLE<PhysicsCelestial,
		RelativeEXTENSIBLE<PhysicsCelestial,
			BaseModuleEXTENSIBLE<PhysicsCelestial
>>>, GravityCelestial>
export type PhysicsCelestialEXTENSIBLE<T, S, Gc> = typeof(setmetatable(
	{} :: {
		updatePositionAndChange: (
			self: T,
			time: number,
			toChange: {
				position: KinematicState?,
				acceleration: AccelerationState?,
				orbiting: Gc?,
			}?
		) -> KinematicTemporalState,
		getSuper: (self: T) -> S,
		__type: "PhysicsCelestial",
	},
	{} :: {
		__index: S,
	}
))

---------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------
-------------------------------------DEPRECEATED TYPES---------------------------------------
---------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------

--[=[
	Things affected by or used to calculate physics at the Solar System scale.
]=]
export type SolarSystemObject = typeof(setmetatable(
	{} :: {
		new: (
			position: Vector3D,
			velocity: Vector3D,
			temporalPosition: TemporalPosition,
			orbitingBody: GravityBody?
		) -> SolarSystemObject,
		fromMovingObject: (
			movingObject: MovingObject,
			temporalPosition: TemporalPosition,
			orbitingBody: GravityBody?
		) -> SolarSystemObject,
		OrbitingBody: GravityBody?,
		TemporalPosition: TemporalPosition,
		RelativeToParent: (self: SolarSystemObject) -> SolarSystemObject,
		RelativeToChild: (self: SolarSystemObject, childGravityBody: GravityBody) -> SolarSystemObject,
		CalculateWorkspacePosition: (self: any) -> Vector3D,
		__type: "SolarSystemObject",
	},
	{} :: {
		__index: MovingObject,
	}
))

--[=[
	Used to hold multiple TrajectoryObjects
	to represent a continuous trajectory through one or more SOIs.
	Orbital mechanics!
	https://www.desmos.com/3d/rfndgd4ppj
]=]

export type TrajectoryHolderObject = typeof(setmetatable(
	{} :: {
		new: (position: Vector3D, velocity: Vector3D, temporalPosition: TemporalPosition, orbitingBody: GravityBody?) -> TrajectoryHolderObject,
		allTrajectories: { { relativeTime: number, trajectory: TrajectoryObject } },
		CurrentTrajectorySegment: (
			self: TrajectoryHolderObject,
			relativeTime: number
		) -> { relativeTime: number, trajectory: TrajectoryObject },
		CurrentTrajectory: (self: TrajectoryHolderObject, relativeTime: number) -> TrajectoryObject,
		OrbitingBody: (self: TrajectoryHolderObject, relativeTime: number) -> GravityBody?,
		OrbitalPeriod: (self: TrajectoryHolderObject, relativeTime: number) -> number?,
		CurrentApoapsis: (self: TrajectoryHolderObject, relativeTime: number) -> MovingObject?,
		CurrentPeriapsis: (self: TrajectoryHolderObject, relativeTime: number) -> MovingObject?,
		SemiMajorAxis: (self: TrajectoryHolderObject, relativeTime: number) -> number?,
		SemiMinorAxis: (self: TrajectoryHolderObject, relativeTime: number) -> number?,
		Eccentricity: (self: TrajectoryHolderObject, relativeTime: number) -> number?,
		CalculateNextTrajectory: (self: TrajectoryHolderObject) -> TrajectoryObject?,
		CalculatePointFromTime: (self: TrajectoryHolderObject, relativeTime: number) -> MovingObject,
		CalculateTimeFromPoint: (self: TrajectoryHolderObject, position: Vector3D, orbitingBody: GravityBody) -> number?,
		Step: (self: TrajectoryHolderObject, delta: number, withAcceleration: Vector3D?) -> TrajectoryHolderObject,
		AtTime: (
			self: TrajectoryHolderObject,
			relativeTime: number,
			withAcceleration: Vector3D?
		) -> TrajectoryHolderObject,
		Increment: (
			self: TrajectoryHolderObject,
			delta: number,
			recursions: number,
			withAcceleration: Vector3D?
		) -> TrajectoryHolderObject,
		CalculatePoints: (self: TrajectoryHolderObject, delta: number, recursions: number) -> { MovingObject },
		DisplayTrajectory: (self: TrajectoryHolderObject, resolution: number) -> Folder,
		__type: "TrajectoryHolderObject",
	},
	{} :: {
		__index: SolarSystemObject,
	}
))

--[=[
	An object at the Solar System scale affected by physics.
]=]
export type SolarSystemPhysicsBody = typeof(setmetatable(
	{} :: {
		new: (position: Vector3D, velocity: Vector3D, part: Part, orbitingBody: GravityBody?) -> SolarSystemPhysicsBody,
		fromMovingObject: (movingObject: MovingObject, part: Part, orbitingBody: GravityBody?) -> SolarSystemPhysicsBody,
		fromSolarSystemObject: (solarSystemObject: SolarSystemObject, part: Part) -> SolarSystemPhysicsBody,
		RootPart: Part,
		TrajectoryHolder: TrajectoryHolderObject,
		Update: (
			self: SolarSystemPhysicsBody,
			time: number,
			toChange: {
				position: Vector3D?,
				velocity: Vector3D?,
				acceleration: Vector3D?,
				gravityBody: GravityBody?,
			}?
		) -> SolarSystemObject,
		__type: "SolarSystemPhysicsBody",
	},
	{} :: {
		__index: SolarSystemObject,
	}
))

--[=[
	An object at the Solar System scale that generates a gravitational field, unaffected by physics.
]=]
export type GravityBody = typeof(setmetatable(
	{} :: {
		new: (
			position: Vector3D,
			velocity: Vector3D,
			part: Part,
			mass: number,
			SOIRadius: number,
			OrbitingBody: GravityBody?
		) -> GravityBody,
		RootPart: Part,
		Mass: number,
		SOIRadius: number,
		Trajectory: TrajectoryObject,
		BakedTrajectory: { TrajectoryObject }?,
		ParentGravityBody: GravityBody?,
		ChildGravityBodies: { GravityBody },
		ChildSolarSystemPhysicsBodies: { SolarSystemPhysicsBody },
		StandardGravitationalParameter: (self: GravityBody) -> number,
		OrbitalVelocity: (self: GravityBody) -> number,
		EscapeVelocity: (self: GravityBody) -> number,
		Update: (self: GravityBody, delta: number) -> GravityBody,
		__type: "GravityBody",
	},
	{} :: {
		__index: SolarSystemObject,
	}
))

-- Silence warnings
return nil

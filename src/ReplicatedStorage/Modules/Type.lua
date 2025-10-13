--!strict

--[[
	Index of all types.

	TODO:

	Change type system
	- Type.Name - Public use
	- Constructor.Name - Constructor (includes constructor and static stuff)
	- Type.NameEXTENDABLE<[RuntimeType,] Subtype> - Subtype use (compatibility with subclasses)
	- Name [internal] - Internal use (includes private stuff)

	Clean up the inheritance tree to reduce mess and tidy up spilled spaghetti code

	Proposal for new inheritance tree:

✅ BaseModule (Abstract)
	✅ Relative [new] (Linked-back nodes)
		✅ State (Abstract) [new]
			✅ TemporalState (time) [TemporalPosition]
			✅ KinematicState (velocity and position, with means for inputting acceleration) [MovingObject]
			✅ AccelerationState (acceleration + delta) [new]
			⭕ OrientationState (maybe?) (very scary quaternion math aaaa) [new]
		⭕ Celestial (Abstract) [a bit of SolarSystemObject; mostly new]
			⭕ GravityCelestial [GravityBody]
			⭕ PhysicsCelestial (Need to account for development roadmap [adding actual rocket objects to the game])
	✅ KinematicTemporalState (KinematicState + TemporalState) (Not under Relative since this is a composite type) [SolarSystemObject]
		* ...Define a class for all (or just a few) composite states!
	✅ Trajectory (Abstract) (Not under Relative since this links forward) [TrajectoryObject, TrajectoryHolderObject]
		🔜 LinearTrajectory
		🔜 OrbitalTrajectory
		⭕ TrajectoryHolder (probably not) [TrajectoryHolderObject]
	⭕ RigidBody (physics stuff) [new and exciting]
		* Will have many different kinds of States, make them work together
		* Will also have to transfer kinematics data to/from the Roblox game engine itself
			* Toggle between a Roblox physics mode and a game physics mode
	(Now this is where we add the stuff from that note thingy on my phone)

	Notes:
	- Units are all SI base units (meters, kg, seconds, kelvin, etc.)
]]

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
	Represents a 3D value in cartesian coordinates with 64-bit doubles.
]=]
export type Vector3D = typeof(setmetatable(
	{} :: {
		X: number,
		Y: number,
		Z: number,
		Magnitude: (self: Vector3D) -> number,
		Unit: (self: Vector3D) -> Vector3D,
		Abs: (self: Vector3D) -> Vector3D,
		Ceil: (self: Vector3D) -> Vector3D,
		Floor: (self: Vector3D) -> Vector3D,
		Sign: (self: Vector3D) -> Vector3D,
		Cross: (self: Vector3D, other: Vector3D) -> Vector3D,
		Angle: (self: Vector3D, other: Vector3D, axis: Vector3D?) -> number,
		Dot: (self: Vector3D, other: Vector3D) -> number,
		Lerp: (self: Vector3D, other: Vector3D, alpha: number) -> number,
		Max: (self: Vector3D) -> Vector3D,
		Min: (self: Vector3D) -> Vector3D,
		ToVector3: (self: Vector3D) -> Vector3,
	},
	{} :: {
		__eq: (self: Vector3D, other: Vector3D) -> boolean,
		__lt: (self: Vector3D, other: Vector3D) -> boolean,
		__le: (self: Vector3D, other: Vector3D) -> boolean,
		__add: (self: Vector3D, other: Vector3D | number) -> Vector3D,
		__sub: (self: Vector3D, other: Vector3D | number) -> Vector3D,
		__mul: (self: Vector3D, other: Vector3D | number) -> Vector3D,
		__div: (self: Vector3D, other: Vector3D | number) -> Vector3D,
		__unm: (self: Vector3D) -> Vector3D,
		__tostring: (self: Vector3D) -> string,
	}
))

--[=[
	Base module (class) for all other modules.
	Immutable. Abstract. Non-instantiatable.
]=]
export type BaseModuleEXTENSIBLE<T> = {
	getSuper: (self: T) -> any,
	instanceOf: (self: T, typeName: string) -> boolean,
	typesMatch: (self: T, other: T) -> boolean,
	assertTypesMatch: (self: T, other: T) -> (),
	deepClone: (self: T) -> T,
	__type: "BaseModule",
}

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
	Abstract.
]=]
export type TrajectoryEXTENSIBLE<T, S> = typeof(setmetatable(
	{} :: {
		getStartPosition: (self: T) -> KinematicTemporalState,
		hasNextTrajectory: (self: T) -> boolean,
		nextTrajectory: (self: T) -> T,
		nextTrajectoryDirection: (self: T) -> "in" | "out",
		minimumOrbitalIntersectionDistance: (
			self: T,
			other: T,
			searchTimeMin: number,
			searchTimeMax: number
		) -> KinematicTemporalState,
		calculatePointFromTime: (self: T, relativeTime: number) -> KinematicState,
		calculatePositionFromTime: (self: T, relativeTime: number) -> KinematicTemporalState,
		calculateTimeFromPoint: (self: T, position: Vector3D) -> TemporalState,
		calculatePositionFromPoint: (self: T, position: Vector3D) -> KinematicTemporalState,
		calculateTimeFromMagnitude: (self: T, magnitude: number) -> TemporalState,
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
]=]
export type LinearTrajectory = LinearTrajectoryEXTENSIBLE<LinearTrajectory,
	TrajectoryEXTENSIBLE<LinearTrajectory,
		BaseModuleEXTENSIBLE<LinearTrajectory
>>>
export type LinearTrajectoryEXTENSIBLE<T, S> = typeof(setmetatable(
	{} :: {
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
]=]
export type OrbitalTrajectory = OrbitalTrajectoryEXTENSIBLE<OrbitalTrajectory,
	TrajectoryEXTENSIBLE<OrbitalTrajectory,
		BaseModuleEXTENSIBLE<OrbitalTrajectory
>>>
export type OrbitalTrajectoryEXTENSIBLE<T, S> = typeof(setmetatable(
	{} :: {
		new: (position: Vector3D, velocity: Vector3D, orbitingBody: GravityBody) -> OrbitalTrajectory,
		-- escapingSOI: (self: T) -> boolean,
		fromMovingObject: (movingObject: MovingObject, orbitingBody: GravityBody) -> OrbitalTrajectory,
		OrbitingBody: GravityBody,
		OrbitalPeriod: (self: T) -> number,
		TimeToPeriapsis: (self: T) -> number,
		TimeSincePeriapsis: (self: T) -> number,
		Apoapsis: (self: T) -> MovingObject,
		Periapsis: (self: T) -> MovingObject,
		SemiMajorAxis: (self: T) -> number,
		SemiMinorAxis: (self: T) -> number,
		Eccentricity: (self: T) -> number,
		IsBound: (self: T) -> boolean,
		IsClosed: (self: T) -> boolean,
		SpecificOrbitalEnergy: number,
		RecursiveTrueAnomalyHelper: (
			self: T,
			recursions: number,
			periapsisRelativeTime: number
		) -> number,
		CalculateTimeFromTrueAnomaly: (self: T, trueAnomaly: number, referenceTime: number?) -> number,
		CalculatePointFromTrueAnomaly: (self: T, trueAnomaly: number) -> KinematicState,
		CalculatePositionFromTrueAnomaly: (self: T, trueAnomaly: number, referenceTime: number?) -> KinematicTemporalState,
		CalculateTrueAnomalyFromTime: (self: T, relativeTime: number) -> number,
		CalculateTrueAnomalyFromPoint: (self: T, position: Vector3D) -> number,
		CalculateTimeFromPeriapsis: (self: T, trueAnomaly: number) -> number,
		CalculateTrueAnomalyFromMagnitude: (self: T, magnitude: number) -> number,
		getSuper: (self: T) -> S,
		__type: "OrbitalTrajectory",
	},
	{} :: {
		__index: S,
	}
))

export type Celestial = any

export type GravityCelestial = any

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

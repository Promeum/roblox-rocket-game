--!strict

--[[
    Index of all modules.

	Module hierarchy:
	BaseModule
	-MovingObject
	--SolarSystemObject
	---TrajectoryObject
	---SolarSystemBody
	---GravityBody

	Notes:
	- Coordinate system is relative to current orbiting body.
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
		new: (
			x: number,
			y: number,
			z: number
		) -> Vector3D,
		FromVector3: (vector: Vector3) -> Vector3D,
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
]=]
export type BaseModule = typeof(setmetatable(
	{} :: {
		new: () -> BaseModule,
		getSuper: (self: any) -> any,
		setSuper: (self: any, value: any) -> (),
		getType: (self: any) -> string,
		DeepClone: (self: any) -> any,
		__type: "BaseModule",
	},
	{} :: {
	}
))

--[=[
	Represents a time value in seconds, for physics calculation purposes.
]=]
export type TemporalPosition = typeof(setmetatable(
	{} :: {
		new: (relativeTime: number, relativeTo: TemporalPosition?) -> TemporalPosition,
		fromTemporalPosition: (self: TemporalPosition, relativeTime: number) -> TemporalPosition,
		fromTemporalPositionAbsoluteTime: (self: TemporalPosition, absoluteTime: number) -> TemporalPosition,
		RelativeTime: number,
		RelativeTo: TemporalPosition?,
		GetAbsoluteTime: (self: TemporalPosition) -> number,
		GetRelativeTime: (self: TemporalPosition) -> number,
		ConsolidateOnce: (self: TemporalPosition) -> TemporalPosition,
		Synchronize: (self: TemporalPosition, other: TemporalPosition) -> (TemporalPosition, TemporalPosition),
		MatchRelative: (self: TemporalPosition, other: TemporalPosition) -> TemporalPosition,
		__type: "TemporalPosition",
	},
	{} :: {
		__index: BaseModule,
	}
))

--[=[
	Things affected by or used to calculate physics.
]=]
export type MovingObject = typeof(setmetatable(
	{} :: {
		new: (position: Vector3D, velocity: Vector3D) -> MovingObject,
		Position: Vector3D,
		Velocity: Vector3D,
		__type: "MovingObject",
	},
	{} :: {
		__index: BaseModule,
		__add: (self: MovingObject, other: MovingObject) -> MovingObject,
		__sub: (self: MovingObject, other: MovingObject) -> MovingObject,
	}
))

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
	Used to calculate a linear trajectory through space, unaffected by any gravity force.
	Not-so-orbital mechanics!
	Note: Does not account for SOIs.
]=]
export type LinearTrajectory = typeof(setmetatable(
	{} :: {
		new: (
			position: Vector3D,
			velocity: Vector3D
		) -> LinearTrajectory,
		fromMovingObject: (
			movingObject: MovingObject
		) -> LinearTrajectory,
		CalculatePointFromTime: (self: LinearTrajectory, relativeTime: number) -> MovingObject,
		CalculateTimeFromPoint: (self: LinearTrajectory, position: Vector3D) -> number,
		CalculateTimeFromMagnitude: (self: LinearTrajectory, magnitude: number) -> number,
		CalculatePointFromMagnitude: (self: LinearTrajectory, magnitude: number) -> MovingObject,
		__type: "LinearTrajectory",
	},
	{} :: {
		__index: MovingObject,
	}
))

--[=[
	Used to calculate a conic orbit around a GravityBody.
	Orbital mechanics!
	Note: Does not account for SOIs.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
export type OrbitalTrajectory = typeof(setmetatable(
	{} :: {
		new: (position: Vector3D, velocity: Vector3D, orbitingBody: GravityBody) -> OrbitalTrajectory,
		fromMovingObject: (movingObject: MovingObject, orbitingBody: GravityBody) -> OrbitalTrajectory,
		OrbitingBody: GravityBody,
		OrbitalPeriod: (self: OrbitalTrajectory) -> number,
		TimeToPeriapsis: (self: OrbitalTrajectory) -> number,
		TimeSincePeriapsis: (self: OrbitalTrajectory) -> number,
		Apoapsis: (self: OrbitalTrajectory) -> MovingObject,
		Periapsis: (self: OrbitalTrajectory) -> MovingObject,
		SemiMajorAxis: (self: OrbitalTrajectory) -> number,
		SemiMinorAxis: (self: OrbitalTrajectory) -> number,
		Eccentricity: (self: OrbitalTrajectory) -> number,
		IsBound: (self: OrbitalTrajectory) -> boolean,
		IsClosed: (self: OrbitalTrajectory) -> boolean,
		SpecificOrbitalEnergy: number,
		RecursiveTrueAnomalyHelper: (
			self: OrbitalTrajectory,
			recursions: number,
			periapsisRelativeTime: number
		) -> number,
		CalculateTrueAnomalyFromTime: (self: OrbitalTrajectory, relativeTime: number) -> number,
		CalculatePointFromTrueAnomaly: (self: OrbitalTrajectory, trueAnomaly: number) -> MovingObject,
		CalculatePointFromTime: (self: OrbitalTrajectory, relativeTime: number) -> MovingObject,
		CalculateTrueAnomalyFromPoint: (self: OrbitalTrajectory, position: Vector3D) -> number,
		CalculateTimeFromPeriapsis: (self: OrbitalTrajectory, trueAnomaly: number) -> number,
		CalculateTimeFromTrueAnomaly: (self: OrbitalTrajectory, trueAnomaly: number, referenceTime: number?) -> number,
		CalculateTimeFromPoint: (self: OrbitalTrajectory, position: Vector3D, referenceTime: number?) -> number,
		CalculateTrueAnomalyFromMagnitude: (self: OrbitalTrajectory, magnitude: number) -> number,
		CalculateTimeFromMagnitude: (self: OrbitalTrajectory, magnitude: number) -> number,
		CalculatePointFromMagnitude: (self: OrbitalTrajectory, magnitude: number) -> MovingObject,
		__type: "OrbitalTrajectory",
	},
	{} :: {
		__index: MovingObject,
	}
))

--[=[
	Wraps a LinearTrajectory or OrbitalTrajectory object,
	providing additional functionality regarding SOI's, TemporalPosition, et cetera.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
export type TrajectoryObject = typeof(setmetatable(
	{} :: {
		new: (position: Vector3D, velocity: Vector3D, temporalPosition: TemporalPosition, orbitingBody: GravityBody?) -> TrajectoryObject,
		fromMovingObject: (movingObject: MovingObject, temporalPosition: TemporalPosition, orbitingBody: GravityBody?) -> TrajectoryObject,
		fromSolarSystemObject: (solarSystemObject: SolarSystemObject) -> TrajectoryObject,
		Trajectory: LinearTrajectory | OrbitalTrajectory,
		Orbit: {
			Trajectory: OrbitalTrajectory,
			Body: GravityBody,
			OrbitalPeriod: (self: any) -> number,
			TimeToPeriapsis: (self: any) -> number,
			TimeSincePeriapsis: (self: any) -> number,
			Apoapsis: (self: any) -> MovingObject,
			Periapsis: (self: any) -> MovingObject,
			SemiMajorAxis: (self: any) -> number,
			SemiMinorAxis: (self: any) -> number,
			Eccentricity: (self: any) -> number,
			IsBound: (self: any) -> boolean,
			IsClosed: (self: any) -> boolean,
			SpecificOrbitalEnergy: (self: any) -> number,
		}?,
		minimumOrbitalIntersectionDistance: (
			self: TrajectoryObject,
			trajectory: TrajectoryObject,
			searchTimeMin: TemporalPosition,
			searchTimeMax: TemporalPosition
		) -> SolarSystemObject,
		EscapingSOI: (self: TrajectoryObject) -> boolean,
		SOIChange: (self: TrajectoryObject) -> (SolarSystemObject?, TemporalPosition?, ("out" | "in")?),
		NextTrajectory: (self: TrajectoryObject) -> (TrajectoryObject?, TemporalPosition?),
		CalculatePointFromTime: (self: TrajectoryObject, relativeTime: number) -> MovingObject,
		CalculateTimeFromPoint: (self: TrajectoryObject, position: Vector3D, referenceTime: number?) -> number,
		CalculateTimeFromMagnitude: (self: TrajectoryObject, magnitude: number) -> number,
		CalculatePointFromMagnitude: (self: TrajectoryObject, magnitude: number) -> MovingObject,
		Step: (self: TrajectoryObject, delta: number, withAcceleration: Vector3D?) -> TrajectoryObject,
		AtTime: (
			self: TrajectoryObject,
			relativeTime: number,
			withAcceleration: Vector3D?
		) -> TrajectoryObject,
		Increment: (
			self: TrajectoryObject,
			delta: number,
			recursions: number,
			withAcceleration: Vector3D?
		) -> TrajectoryObject,
		CalculatePoints: (self: TrajectoryObject, delta: number, recursions: number) -> { SolarSystemObject },
		DisplayTrajectory: (self: TrajectoryObject, delta: number, recursions: number) -> Folder,
		__type: "TrajectoryObject",
	},
	{} :: {
		__index: SolarSystemObject,
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

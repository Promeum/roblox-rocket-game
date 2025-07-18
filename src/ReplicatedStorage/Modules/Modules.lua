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
	Base module (class) for all other modules.
]=]
export type BaseModule = typeof(setmetatable(
	{} :: {
		new: () -> BaseModule,
		getSuper: (self: any) -> any,
		setSuper: (self: any, value: any) -> (),
		getType: (self: any) -> string,
		DeepClone: (self: any) -> any,
	},
	{} :: { __type: string }
))

--[=[
	Things affected by or used to calculate physics.
]=]
export type MovingObject = typeof(setmetatable(
	{} :: {
		new: (position: Vector3, velocity: Vector3) -> MovingObject,
		Position: Vector3,
		Velocity: Vector3,
		CalculatePointFromTime: (self: MovingObject, relativeTime: number) -> MovingObject,
		CalculateTimeFromPoint: (self: MovingObject, position: Vector3) -> number?,
		CalculateTimeFromDistance: (self: MovingObject, distanceFromSelf: number) -> number,
	},
	{} :: {
		__index: BaseModule,
		__type: string,
		__add: (self: MovingObject, other: MovingObject) -> MovingObject,
	}
))

--[=[
	Things affected by or used to calculate physics at the Solar System scale.
]=]
export type SolarSystemObject = typeof(setmetatable(
	{} :: {
		new: (position: Vector3, velocity: Vector3) -> SolarSystemObject,
		from: (movingObject: MovingObject) -> SolarSystemObject,
		CalculateWorkspacePosition: (newPosition: Vector3, OrbitingBody: GravityBody?) -> Vector3,
	},
	{} :: { __index: MovingObject, __type: string }
))

--[=[
	Used to calculate and display a single conic section,
	whether or not that may be an orbit around a GravityBody.
	Orbital mechanics!
	Note: Does not account for SOIs.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
export type TrajectoryObject = typeof(setmetatable(
	{} :: {
		new: (position: Vector3, velocity: Vector3, orbitingBody: GravityBody?) -> TrajectoryObject,
		from: (solarSystemObject: SolarSystemObject, orbitingBody: GravityBody?) -> TrajectoryObject,
		OrbitingBody: GravityBody?,
		NextTrajectory: (self: TrajectoryObject) -> TrajectoryObject?,
		OrbitalPeriod: (self: TrajectoryObject) -> number,
		TimeToPeriapsis: (self: TrajectoryObject) -> number,
		TimeSincePeriapsis: (self: TrajectoryObject) -> number,
		Apoapsis: (self: TrajectoryObject) -> MovingObject,
		Periapsis: (self: TrajectoryObject) -> MovingObject,
		SemiMajorAxis: (self: TrajectoryObject) -> number,
		SemiMinorAxis: (self: TrajectoryObject) -> number,
		Eccentricity: (self: TrajectoryObject) -> number,
		IsBound: (self: TrajectoryObject) -> boolean,
		IsClosed: (self: TrajectoryObject) -> boolean,
		SpecificOrbitalEnergy: number?,
		RecursiveTrueAnomalyHelper: (
			self: TrajectoryObject,
			recursions: number,
			periapsisRelativeTime: number
		) -> number,
		CalculateTrueAnomalyFromTime: (self: TrajectoryObject, relativeTime: number) -> number,
		CalculatePointFromTrueAnomaly: (self: TrajectoryObject, trueAnomaly: number) -> MovingObject,
		CalculatePointFromTime: (self: TrajectoryObject, relativeTime: number) -> MovingObject,
		CalculateTrueAnomalyFromPoint: (self: TrajectoryObject, position: Vector3) -> number,
		CalculateTimeFromPeriapsis: (self: TrajectoryObject, trueAnomaly: number) -> number,
		CalculateTimeFromTrueAnomaly: (self: TrajectoryObject, trueAnomaly: number, referenceTime: number?) -> number,
		CalculateTimeFromPoint: (self: TrajectoryObject, position: Vector3, referenceTime: number?) -> number,
		CalculateTrueAnomalyFromMagnitude: (self: TrajectoryObject, magnitude: number) -> number,
		CalculateTimeFromMagnitude: (self: TrajectoryObject, magnitude: number) -> number,
		CalculatePointFromMagnitude: (self: TrajectoryObject, magnitude: number) -> MovingObject,
		Step: (self: TrajectoryObject, delta: number, withAcceleration: Vector3?) -> TrajectoryObject,
		AtTime: (self: TrajectoryObject, time: number, withAcceleration: Vector3?) -> TrajectoryObject,
		Increment: (
			self: TrajectoryObject,
			delta: number,
			recursions: number,
			withAcceleration: Vector3?
		) -> TrajectoryObject,
		CalculateTrajectory: (self: TrajectoryObject, delta: number, recursions: number) -> { MovingObject },
		DisplayTrajectory: (self: TrajectoryObject, delta: number, recursions: number) -> Folder,
	},
	{} :: {
		_OrbitalPeriod: any,
		_TimeToPeriapsis: any,
		_TimeSincePeriapsis: any,
		_Apoapsis: any,
		_Periapsis: any,
		_SemiMajorAxis: any,
		_SemiMinorAxis: any,
		_Eccentricity: any,
		_IsBound: any,
		_IsClosed: any,
		__index: SolarSystemObject,
		__type: string,
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
		new: (position: Vector3, velocity: Vector3, orbitingBody: GravityBody?) -> TrajectoryHolderObject,
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
		CalculateTimeFromPoint: (self: TrajectoryHolderObject, position: Vector3, orbitingBody: GravityBody) -> number?,
		Step: (self: TrajectoryHolderObject, delta: number, withAcceleration: Vector3?) -> TrajectoryHolderObject,
		AtTime: (
			self: TrajectoryHolderObject,
			relativeTime: number,
			withAcceleration: Vector3?
		) -> TrajectoryHolderObject,
		Increment: (
			self: TrajectoryHolderObject,
			delta: number,
			recursions: number,
			withAcceleration: Vector3?
		) -> TrajectoryHolderObject,
		CalculateTrajectory: (self: TrajectoryHolderObject, delta: number, recursions: number) -> { MovingObject },
		DisplayTrajectory: (self: TrajectoryHolderObject, resolution: number) -> Folder,
	},
	{} :: { __index: SolarSystemObject, __type: string }
))

--[=[
	An object at the Solar System scale affected by physics.
]=]
export type SolarSystemPhysicsBody = typeof(setmetatable(
	{} :: {
		new: (position: Vector3, velocity: Vector3, part: Part, inSOIOf: GravityBody?) -> SolarSystemPhysicsBody,
		from: (solarSystemObject: SolarSystemObject, inSOIOf: GravityBody?) -> SolarSystemPhysicsBody,
		RootPart: Part,
		TrajectoryHolder: TrajectoryHolderObject,
		ParentGravityBody: GravityBody?,
		Update: (
			SolarSystemPhysicsBody,
			time: number,
			delta: number,
			toChange: {
				position: Vector3?,
				velocity: Vector3?,
				acceleration: Vector3?,
				inSOIOf: GravityBody?,
			}
		) -> TrajectoryHolderObject,
	},
	{} :: { __index: SolarSystemObject, __type: string }
))

--[=[
	An object at the Solar System scale that generates a gravitational field, unaffected by physics.
]=]
export type GravityBody = typeof(setmetatable(
	{} :: {
		new: (
			position: Vector3,
			velocity: Vector3,
			part: Part,
			mass: number,
			SOIRadius: number,
			OrbitingBody: GravityBody?
		) -> GravityBody,
		RootPart: Part,
		Mass: number,
		SOIRadius: number,
		Trajectory: TrajectoryObject?,
		BakedTrajectory: { TrajectoryObject }?,
		ParentGravityBody: GravityBody?,
		ChildGravityBodies: { GravityBody },
		ChildSolarSystemPhysicsBodies: { SolarSystemPhysicsBody },
		StandardGravitationalParameter: (self: GravityBody) -> number,
		OrbitalVelocity: (self: GravityBody) -> number,
		EscapeVelocity: (self: GravityBody) -> number,
		Update: (self: GravityBody, delta: number) -> GravityBody,
	},
	{} :: { __index: SolarSystemObject, __type: string }
))

-- Silence warnings
return nil

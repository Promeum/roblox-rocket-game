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

--[=[
	Represents an arbritrary-presicion number value.
]=]
export type BigNum = typeof(setmetatable(
	{} :: { number },
	{} :: {
		__tostring: (self: BigNum) -> string,
		__unm: (self: BigNum) -> BigNum,

		__add: (self: BigNum, other: BigNum) -> BigNum,
		__sub: (self: BigNum, other: BigNum) -> BigNum,
		__mul: (self: BigNum, other: BigNum) -> BigNum,
		__div: (self: BigNum, other: BigNum) -> BigNum,
		__pow: (self: BigNum, other: BigNum) -> BigNum,
		__mod: (self: BigNum, other: BigNum) -> BigNum,

		__lt: (self: BigNum, other: BigNum) -> boolean,
		__eq: (self: BigNum, other: BigNum) -> boolean,
		__le: (self: BigNum, other: BigNum) -> boolean,

		__index: {
			toScientificNotation: (self: BigNum) -> BigNum,
			GDC: (self: BigNum) -> BigNum,
			LCM: (self: BigNum) -> BigNum,
			abs: (self: BigNum) -> BigNum,
			isNegative: (self: BigNum) -> boolean,
			sign: (self: BigNum) -> number,
		},
	}
))

--[=[
	Represents an arbritrary-presicion non-integer number value.
]=]
export type Fraction = typeof(setmetatable(
	{} :: {
		Numerator: BigNum,
		Denominator: BigNum,
	},
	{} :: {
		__tostring: (self: Fraction) -> string,
		__unm: (self: Fraction) -> Fraction,

		__add: (self: Fraction, other: Fraction) -> Fraction,
		__sub: (self: Fraction, other: Fraction) -> Fraction,
		__mul: (self: Fraction, other: Fraction) -> Fraction,
		__div: (self: Fraction, other: Fraction) -> Fraction,
		__pow: (self: Fraction, other: Fraction) -> Fraction,
		__mod: (self: Fraction, other: Fraction) -> Fraction,

		__lt: (self: Fraction, other: Fraction) -> boolean,
		__eq: (self: Fraction, other: Fraction) -> boolean,
		__le: (self: Fraction, other: Fraction) -> boolean,

		__index: {
			toScientificNotation: (self: Fraction) -> Fraction,
			toNumber: (self: BigNum) -> number,
			GDC: (self: Fraction) -> Fraction,
			LCM: (self: Fraction) -> Fraction,
			abs: (self: Fraction) -> Fraction,
			isNegative: (self: Fraction) -> boolean,
			sign: (self: Fraction) -> number,
			ceil: (self: Fraction) -> BigNum,
			floor: (self: Fraction) -> BigNum,
		},
	}
))

--[=[
	Represents a 3D value in cartesian coordinates with BigNums.
]=]
export type Vector3B = typeof(setmetatable(
	{} :: {
		one: () -> Vector3B,
		zero: () -> Vector3B,
		new: (
			x: BigNum | Fraction | number | string,
			y: BigNum | Fraction | number | string,
			z: BigNum | Fraction | number | string
		) -> Vector3B,
		fromVector3: (vector: Vector3) -> Vector3B,
		X: Fraction,
		Y: Fraction,
		Z: Fraction,
		Magnitude: (self: Vector3B) -> Fraction,
		Unit: (self: Vector3B) -> Vector3B,
		Abs: (self: Vector3B) -> Vector3B,
		Ceil: (self: Vector3B) -> Vector3B,
		Floor: (self: Vector3B) -> Vector3B,
		Sign: (self: Vector3B) -> Vector3B,
		Cross: (self: Vector3B, other: Vector3B) -> Vector3B,
		Angle: (self: Vector3B, other: Vector3B, axis: Vector3B?) -> Fraction,
		Dot: (self: Vector3B, other: Vector3B) -> Fraction,
		Lerp: (self: Vector3B, other: Vector3B, alpha: BigNum | Fraction | number) -> Fraction,
		Max: (self: Vector3B) -> Vector3B,
		Min: (self: Vector3B) -> Vector3B,
		toVector3: (self: Vector3B) -> Vector3,
	},
	{} :: {
		__eq: (self: Vector3B, other: Vector3B) -> boolean,
		__lt: (self: Vector3B, other: Vector3B) -> boolean,
		__le: (self: Vector3B, other: Vector3B) -> boolean,
		__add: (self: Vector3B, other: Vector3B | BigNum | Fraction | number) -> Vector3B,
		__sub: (self: Vector3B, other: Vector3B | BigNum | Fraction | number) -> Vector3B,
		__mul: (self: Vector3B, other: Vector3B | BigNum | Fraction | number) -> Vector3B,
		__div: (self: Vector3B, other: Vector3B | BigNum | Fraction | number) -> Vector3B,
		__unm: (self: Vector3B) -> Vector3B,
		__tostring: (self: Vector3B) -> string,
		__type: string,
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
	},
	{} :: { __type: string }
))

--[=[
	Things affected by or used to calculate physics.
]=]
export type MovingObject = typeof(setmetatable(
	{} :: {
		new: (position: Vector3B, velocity: Vector3B) -> MovingObject,
		Position: Vector3B,
		Velocity: Vector3B,
		CalculatePointFromTime: (self: MovingObject, relativeTime: BigNum | Fraction | number) -> MovingObject,
		CalculateTimeFromPoint: (self: MovingObject, position: Vector3B) -> Fraction?,
		CalculateTimeFromDistance: (self: MovingObject, distanceFromSelf: BigNum | Fraction | number) -> Fraction,
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
		new: (position: Vector3B, velocity: Vector3B) -> SolarSystemObject,
		from: (movingObject: MovingObject) -> SolarSystemObject,
		CalculateWorkspacePosition: (newPosition: Vector3B, OrbitingBody: GravityBody?) -> Vector3B,
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
		new: (position: Vector3B, velocity: Vector3B, orbitingBody: GravityBody?) -> TrajectoryObject,
		from: (solarSystemObject: SolarSystemObject, orbitingBody: GravityBody?) -> TrajectoryObject,
		OrbitingBody: GravityBody?,
		NextTrajectory: (self: TrajectoryObject) -> TrajectoryObject?,
		OrbitalPeriod: (self: TrajectoryObject) -> Fraction,
		TimeToPeriapsis: (self: TrajectoryObject) -> Fraction,
		TimeSincePeriapsis: (self: TrajectoryObject) -> Fraction,
		Apoapsis: (self: TrajectoryObject) -> MovingObject,
		Periapsis: (self: TrajectoryObject) -> MovingObject,
		SemiMajorAxis: (self: TrajectoryObject) -> Fraction,
		SemiMinorAxis: (self: TrajectoryObject) -> Fraction,
		Eccentricity: (self: TrajectoryObject) -> Fraction,
		IsBound: (self: TrajectoryObject) -> boolean,
		IsClosed: (self: TrajectoryObject) -> boolean,
		SpecificOrbitalEnergy: Fraction?,
		RecursiveTrueAnomalyHelper: (
			self: TrajectoryObject,
			recursions: BigNum | number,
			periapsisRelativeTime: BigNum | Fraction | number
		) -> Fraction,
		CalculateTrueAnomalyFromTime: (self: TrajectoryObject, relativeTime: BigNum | Fraction | number) -> Fraction,
		CalculatePointFromTrueAnomaly: (self: TrajectoryObject, trueAnomaly: BigNum | Fraction | number) -> MovingObject,
		CalculatePointFromTime: (self: TrajectoryObject, relativeTime: BigNum | Fraction | number) -> MovingObject,
		CalculateTrueAnomalyFromPoint: (self: TrajectoryObject, position: Vector3B) -> Fraction,
		CalculateTimeFromPeriapsis: (self: TrajectoryObject, trueAnomaly: BigNum | Fraction | number) -> Fraction,
		CalculateTimeFromTrueAnomaly: (self: TrajectoryObject, trueAnomaly: BigNum | Fraction | number, referenceTrueAnomaly: BigNum | Fraction | number?) -> Fraction,
		CalculateTimeFromPoint: (self: TrajectoryObject, position: Vector3B, referenceTrueAnomaly: BigNum | Fraction | number?) -> Fraction,
		CalculateTrueAnomalyFromMagnitude: (self: TrajectoryObject, magnitude: BigNum | Fraction | number) -> Fraction,
		CalculateTimeFromMagnitude: (self: TrajectoryObject, magnitude: BigNum | Fraction | number) -> Fraction,
		CalculatePointFromMagnitude: (self: TrajectoryObject, magnitude: BigNum | Fraction | number) -> MovingObject,
		Step: (self: TrajectoryObject, delta: BigNum | Fraction | number, withAcceleration: Vector3B?) -> TrajectoryObject,
		AtTime: (self: TrajectoryObject, relativeTime: BigNum | Fraction | number, withAcceleration: Vector3B?) -> TrajectoryObject,
		Increment: (
			self: TrajectoryObject,
			delta: BigNum | Fraction | number,
			recursions: BigNum | number,
			withAcceleration: Vector3B?
		) -> TrajectoryObject,
		CalculateTrajectory: (self: TrajectoryObject, delta: BigNum | Fraction | number, recursions: BigNum | number) -> { MovingObject },
		DisplayTrajectory: (self: TrajectoryObject, delta: BigNum | Fraction | number, recursions: BigNum | number) -> Folder,
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
		-- _mu_r_rM_rxvxv_magnitude: any,
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
		new: (position: Vector3B, velocity: Vector3B, orbitingBody: GravityBody?) -> TrajectoryHolderObject,
		from: (solarSystemObject: SolarSystemObject, orbitingBody: GravityBody?) -> TrajectoryHolderObject,
		allTrajectories: { { relativeTime: Fraction, trajectory: TrajectoryObject } },
		CurrentTrajectorySegment: (
			self: TrajectoryHolderObject,
			relativeTime: BigNum | Fraction | number
		) -> { relativeTime: Fraction, trajectory: TrajectoryObject },
		CurrentTrajectory: (self: TrajectoryHolderObject, relativeTime: BigNum | Fraction | number) -> TrajectoryObject,
		OrbitingBody: (self: TrajectoryHolderObject, relativeTime: BigNum | Fraction | number) -> GravityBody?,
		OrbitalPeriod: (self: TrajectoryHolderObject, relativeTime: BigNum | Fraction | number) -> Fraction?,
		CurrentApoapsis: (self: TrajectoryHolderObject, relativeTime: BigNum | Fraction | number) -> MovingObject?,
		CurrentPeriapsis: (self: TrajectoryHolderObject, relativeTime: BigNum | Fraction | number) -> MovingObject?,
		SemiMajorAxis: (self: TrajectoryHolderObject, relativeTime: BigNum | Fraction | number) -> Fraction?,
		SemiMinorAxis: (self: TrajectoryHolderObject, relativeTime: BigNum | Fraction | number) -> Fraction?,
		Eccentricity: (self: TrajectoryHolderObject, relativeTime: BigNum | Fraction | number) -> Fraction?,
		CalculateNextTrajectory: (self: TrajectoryHolderObject) -> TrajectoryObject?,
		CalculatePointFromTime: (self: TrajectoryHolderObject, relativeTime: BigNum | Fraction | number) -> MovingObject,
		CalculateTimeFromPoint: (self: TrajectoryHolderObject, position: Vector3B, orbitingBody: GravityBody) -> Fraction?,
		Step: (self: TrajectoryHolderObject, delta: BigNum | Fraction | number, withAcceleration: Vector3B?) -> TrajectoryHolderObject,
		AtTime: (
			self: TrajectoryHolderObject,
			relativeTime: BigNum | Fraction | number,
			withAcceleration: Vector3B?
		) -> TrajectoryHolderObject,
		Increment: (
			self: TrajectoryHolderObject,
			delta: BigNum | Fraction | number,
			recursions: BigNum | Fraction | number,
			withAcceleration: Vector3B?
		) -> TrajectoryHolderObject,
		CalculateTrajectory: (self: TrajectoryHolderObject, delta: BigNum | Fraction | number, recursions: BigNum | number) -> { MovingObject },
		DisplayTrajectory: (self: TrajectoryHolderObject, resolution: BigNum | number) -> Folder,
	},
	{} :: { __index: SolarSystemObject, __type: string }
))

--[=[
	An object at the Solar System scale affected by physics.
]=]
export type SolarSystemPhysicsBody = typeof(setmetatable(
	{} :: {
		new: (position: Vector3B, velocity: Vector3B, part: Part, inSOIOf: GravityBody?) -> SolarSystemPhysicsBody,
		from: (solarSystemObject: SolarSystemObject, inSOIOf: GravityBody?) -> SolarSystemPhysicsBody,
		RootPart: Part,
		TrajectoryHolder: TrajectoryHolderObject,
		ParentGravityBody: GravityBody?,
		Update: (
			SolarSystemPhysicsBody,
			time: BigNum | Fraction | number,
			delta: BigNum | Fraction | number,
			toChange: {
				position: Vector3B?,
				velocity: Vector3B?,
				acceleration: Vector3B?,
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
			position: Vector3B,
			velocity: Vector3B,
			part: Part,
			mass: BigNum | number | string,
			SOIRadius: BigNum | number | string,
			OrbitingBody: GravityBody?
		) -> GravityBody,
		RootPart: Part,
		Mass: BigNum,
		SOIRadius: BigNum,
		Trajectory: TrajectoryObject?,
		BakedTrajectory: { TrajectoryObject }?,
		ParentGravityBody: GravityBody?,
		ChildGravityBodies: { GravityBody },
		ChildSolarSystemPhysicsBodies: { SolarSystemPhysicsBody },
		StandardGravitationalParameter: (self: GravityBody) -> Fraction,
		OrbitalVelocity: (self: GravityBody) -> BigNum | Fraction,
		EscapeVelocity: (self: GravityBody) -> BigNum | Fraction,
		Update: (self: GravityBody, time: BigNum | Fraction | number) -> GravityBody,
	},
	{} :: { __index: SolarSystemObject, __type: string }
))

-- Silence warnings
return nil

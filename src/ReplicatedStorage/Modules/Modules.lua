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
	Represents a 3D value in spherical coordinates. Uses mathematical convention.
	https://en.wikipedia.org/wiki/Spherical_coordinate_system
	@class Vector3P
]=]
export type Vector3P = typeof(setmetatable(
	{} :: {
		new: (rho: number, theta: number, phi: number) -> Vector3P,
		fromVector3: (Vector3: Vector3) -> Vector3P,
		Rho: number,
		Theta: number,
		Phi: number,
		setRho: (self: Vector3P, value: number) -> Vector3P,
		setTheta: (self: Vector3P, value: number) -> Vector3P,
		setPhi: (self: Vector3P, value: number) -> Vector3P,
		ToVector3: (self: Vector3P) -> Vector3,
	},
	{} :: { __index: Vector3, __type: string }
))

-- export type Number = typeof(setmetatable(
-- 	{} :: {
-- 		new: (value: number) -> Number
-- 	},
-- 	{} :: {

-- 	}
-- ))

--[=[
	Base module (class) for all other modules.
	@class BaseModule
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
	@class MovingObject
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
	{} :: { __index: BaseModule, __type: string }
))

--[=[
	Things affected by or used to calculate physics at the Solar System scale.
	@class SolarSystemObject
]=]
export type SolarSystemObject = typeof(setmetatable(
	{} :: {
		new: (position: Vector3, velocity: Vector3) -> SolarSystemObject,
		CalculateWorkspacePosition: (newPosition: Vector3, OrbitingBody: GravityBody?) -> Vector3,
	},
	{} :: { __index: MovingObject, __type: string }
))

--[=[
	Used to calculate and display a single conic section,
	whether or not that may be an orbit around a GravityBody.
	Orbital mechanics!
	https://www.desmos.com/3d/rfndgd4ppj
	@class TrajectoryObject
]=]
export type TrajectoryObject = typeof(setmetatable(
	{} :: {
		new: (position: Vector3, velocity: Vector3, orbitingBody: GravityBody?) -> TrajectoryObject,
		from: (solarSystemObject: SolarSystemObject, orbitingBody: GravityBody?) -> TrajectoryObject,
		OrbitingBody: GravityBody?,
		nextTrajectory: TrajectoryObject?,
		OrbitalPeriod: number?,
		TimeToPeriapsis: number?,
		Apoapsis: MovingObject?,
		Periapsis: MovingObject?,
		SemiMajorAxis: number?,
		SemiMinorAxis: number?,
		Eccentricity: number?,
		IsBound: boolean,
		IsClosed: boolean,
		SpecificOrbitalEnergy: number?,
		RecursiveTrueAnomalyHelper: (
			self: TrajectoryObject,
			recursions: number,
			periapsisRelativeTime: number
		) -> number?,
		CalculateTrueAnomalyFromTime: (self: TrajectoryObject, relativeTime: number) -> number?,
		CalculatePointFromTrueAnomaly: (self: TrajectoryObject, trueAnomaly: number) -> MovingObject?,
		CalculatePointFromTime: (self: TrajectoryObject, relativeTime: number) -> MovingObject,
		CalculateTrueAnomalyFromPoint: (self: TrajectoryObject, position: Vector3) -> number?,
		CalculateTimeFromTrueAnomaly: (self: TrajectoryObject, trueAnomaly: number) -> number?,
		CalculateTimeFromPoint: (self: TrajectoryObject, position: Vector3, direction: number) -> number?,
		Step: (self: TrajectoryObject, delta: number, withAcceleration: Vector3?) -> TrajectoryObject,
		Increment: (
			self: TrajectoryObject,
			delta: number,
			recursions: number,
			withAcceleration: Vector3?
		) -> TrajectoryObject,
		CalculateTrajectory: (self: TrajectoryObject, delta: number, recursions: number) -> { MovingObject },
		DisplayTrajectory: (self: TrajectoryObject, delta: number, recursions: number) -> Folder,
	},
	{} :: { __index: SolarSystemObject, __type: string }
))

--[=[
	An object at the Solar System scale affected by physics.
	@class SolarSystemPhysicsBody
]=]
export type SolarSystemPhysicsBody = typeof(setmetatable(
	{} :: {
		new: (Vector3, Vector3, Part, GravityBody?) -> SolarSystemPhysicsBody,
		RootPart: Part,
		Trajectory: TrajectoryObject,
		ParentGravityBody: GravityBody?,
		Update: (
			SolarSystemPhysicsBody,
			delta: number,
			toChange: {
				position: Vector3?,
				velocity: Vector3?,
				acceleration: Vector3?,
				inSOIOf: GravityBody?,
			}
		) -> TrajectoryObject,
	},
	{} :: { __index: SolarSystemObject, __type: string }
))

--[=[
	An object at the Solar System scale that generates a gravitational field, unaffected by physics.
	@class GravityBody
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

--!strict

--! Index of all modules.

-- BaseModule = require(game.ReplicatedStorage.Modules.BaseModule)
-- Constructors = require(game.ReplicatedStorage.Modules.BaseModule.Constructors)
-- OrbitObject = require(game.ReplicatedStorage.Modules.)
-- SolarSystemObject = require(game.ReplicatedStorage.Modules.)
-- SolarSystemBody = require(game.ReplicatedStorage.Modules.)
-- GravityBody = require(game.ReplicatedStorage.Modules.)

--[=[
	Base module (class) for all other modules.

	@class BaseModule
]=]
export type BaseModule = {
	__type: string,
}

export type OrbitObject = {
	OrbitingBody: GravityBody,
	Apoapsis: number,
	Periapsis: number,
	SemiMajorAxis: () -> number,
	SemiMinorAxis: () -> number,
	Eccentricity: () -> number,
	__index: BaseModule,
}

export type SolarSystemObject = {
	Position: Vector3,
	CurrentVelocity: () -> Vector3,
	__index: OrbitObject,
}

export type SolarSystemBody = {
	RootPart: Part,
	ApplyGravity: ({ GravityBody }) -> Vector3,
	__index: SolarSystemObject,
}

export type GravityBody = {
	RootPart: Part,
	Gravity: number,
	__index: SolarSystemBody,
}

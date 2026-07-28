// import { $error } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";

import BaseModule from "..";
import Chrono from "../Chrono";
import Trajectory from "../Relative/Trajectory";
import OrbitalTrajectory from "../Relative/Trajectory/OrbitalTrajectory";
import LinearTrajectory from "../Relative/Trajectory/LinearTrajectory";
import CelestialState from "../Relative/CelestialState";

import type GravityCelestial from "./GravityCelestial";
import type UniverseInstance from "../UniverseInstance";

export default abstract class Celestial extends BaseModule {
	public readonly name: string;
	public universe!: UniverseInstance;
	public trajectory: Trajectory;
	public state!: CelestialState;

	// Constructors

	// This class is accessible and simple since it accepts Vector3Ds
	// and an orbiting parameter, using more complex stuff internally
	// Only sets state and orbiting; state and
	// trajectory are to be reassigned in superclasses
	public constructor(
		name: string,
		initialPosition: Vector3D,
		initialVelocity: Vector3D,
		initialChrono: Chrono,
		orbiting?: GravityCelestial
	) {
		super();

		if (orbiting !== undefined) {
			this.trajectory = new OrbitalTrajectory(
				initialPosition, initialVelocity, initialChrono, orbiting
			);
		} else {
			this.trajectory = new LinearTrajectory(
				initialPosition, initialVelocity, initialChrono
			);
		}

		this.name = name;
	}

	// Methods

	/**
	 * Retrives the state at given time.
	 * @param chrono The given time.
	 * @returns A CelestialState.
	 */
	public abstract calculateState(chrono: Chrono): CelestialState

	/**
	 * Updates the current state with a given time.
	 * @param chrono The given time.
	 * @returns The new, updated CelestialState.
	 */
	public setState(chrono: Chrono): CelestialState {
		return this.state = this.calculateState(chrono);
	}

	public abstract serialize(): string
}

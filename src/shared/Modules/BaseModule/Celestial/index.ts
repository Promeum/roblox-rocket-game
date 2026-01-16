// import { $error } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";

import BaseModule from "..";
import TemporalState from "../Relative/State/TemporalState";
import Trajectory from "../Relative/Trajectory";
import OrbitalTrajectory from "../Relative/Trajectory/OrbitalTrajectory";
import LinearTrajectory from "../Relative/Trajectory/LinearTrajectory";

import type GravityCelestial from "./GravityCelestial";
import CelestialState from "../Relative/CelestialState";

export default abstract class Celestial extends BaseModule {
	public readonly name: string;
	public trajectory!: Trajectory;

	// Constructors

	// This class is accessible and simple since it accepts Vector3Ds
	// and an orbiting parameter, using more complex stuff internally
	// Only sets state and orbiting; state and
	// trajectory are to be reassigned in superclasses
	public constructor(
		name: string,
		initialPosition: Vector3D,
		initialVelocity: Vector3D,
		initialTemporal: TemporalState,
		orbiting?: GravityCelestial
	) {
		super();

		if (orbiting !== undefined) {
			this.trajectory = new OrbitalTrajectory(
				initialPosition,
				initialVelocity,
				initialTemporal,
				orbiting
			);
		} else {
			this.trajectory = new LinearTrajectory(
				initialPosition,
				initialVelocity,
				initialTemporal
			);
		}

		this.name = name;
	}

	// Methods

	/**
	 * Updates the current state with a given time.
	 * @param temporalState The given time.
	 * @returns The new, updated CelestialState.
	 */
	public calculateState(temporalState: TemporalState): CelestialState {
		return new CelestialState(
			this,
			this.trajectory.calculateStateFromTime(temporalState)
		);
	}

	abstract override deepClone(): Celestial
}

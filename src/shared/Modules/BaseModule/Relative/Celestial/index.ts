// import { $error } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";
import Relative from "..";
import KinematicTemporalState from "../State/KinematicTemporalState";
import Trajectory from "../../Trajectory";
import GravityCelestial from "./GravityCelestial";
import KinematicState from "../State/KinematicState";
import TemporalState from "../State/TemporalState";
import CelestialState from "../../CelestialState";
import OrbitalState from "../../CelestialState/OrbitalState";
import LinearState from "../../CelestialState/LinearState";
import * as Globals from "../../../../Globals";

export default abstract class Celestial extends Relative {
	public trajectory!: Trajectory;
	public state: CelestialState;
	public orbiting?: GravityCelestial;

	// Constructors

	// This class is accessible and simple since it accepts Vector3Ds
	// and an orbiting parameter, using more complex stuff internally
	// Handles TemporalState via a time variable in Globals
	// Only sets state and orbiting; state and
	// trajectory are to be reassigned in superclasses
	public constructor(initialPosition: Vector3D, initialVelocity: Vector3D, initialTemporal: TemporalState | undefined, orbiting?: GravityCelestial) {
		super(orbiting);
		
		if (initialVelocity.magnitude() === 0) {
			initialVelocity = new Vector3D(0, 1e-10, 0);
		} // patch for 0 velocity

		if (orbiting !== undefined) {
			this.state = new OrbitalState(
				new KinematicTemporalState(
					new KinematicState(
						initialPosition,
						initialVelocity,
						orbiting.state.kinematicPosition.kinematicState
					),
					orbiting.state.kinematicPosition.temporalState
				),
				orbiting,
				this
			);
		} else {
			this.state = new LinearState(
				new KinematicTemporalState(
					new KinematicState(
						initialPosition,
						initialVelocity
					),
					initialTemporal ?? Globals.globalTime
				),
				this
			);
		}

		this.orbiting = orbiting;
	}

	// Methods

	/**
	 * Updates the current state with a given time.
	 * @param temporalState If omitted, uses GLobals.globalTime
	 * @returns The new, updated CelestialState.
	 */
	public updateState(temporalState?: TemporalState): CelestialState {
		// make the parameter compatible with the trajectory first
		const calibratedRelativeTime: number = this.trajectory
			.initialPosition.kinematicPosition.temporalState
			.matchRelative(temporalState ?? Globals.globalTime).relativeTime;

		this.state = this.trajectory.calculateAbsolutePositionFromTime(calibratedRelativeTime);

		return this.state;
	}

}

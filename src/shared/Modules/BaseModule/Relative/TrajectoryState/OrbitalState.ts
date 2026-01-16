import KinematicState from "../State/KinematicState";
import TemporalState from "../State/TemporalState";
import KinematicTemporalState from "../State/KinematicTemporalState";
import TrajectoryState from ".";

import type OrbitalTrajectory from "../Trajectory/OrbitalTrajectory";

/*
	Useful links
	https://www.bogan.ca/orbits/kepler/orbteqtn.html
	https://orbital-mechanics.space/classical-orbital-elements/classical-orbital-elements.html
	https://orbital-mechanics.space/classical-orbital-elements/orbital-elements-and-the-state-vector.html
	https://en.wikipedia.org/wiki/Orbital_elements
*/

/**
 * OrbitalState is the state of a position on an OrbitalTrajectory,
 * storing orbital parameters.
 * Intended only to be created by Trajectory classes.
 */
export default class OrbitalState extends TrajectoryState {
	declare readonly trajectory: OrbitalTrajectory;
	private kinematics: KinematicState;
	// private depth: number | true = 0; // Cache

	// Orbital parameters
	public readonly trueAnomaly: number;

	// Constructors

	/**
	 * Copy-constructor.
	 */
	public constructor(state: OrbitalState);

	/**
	 * Creates a new OrbitalState instance.
	 */
	public constructor(trajectory: OrbitalTrajectory, time: TemporalState, trueAnomaly: number, position: KinematicState);

	public constructor(
		arg1: OrbitalState | OrbitalTrajectory,
		arg2?: TemporalState,
		arg3?: number,
		arg4?: KinematicState
	) {
		if (arg1 instanceof OrbitalState) {
			super(arg1);
			this.trueAnomaly = arg1.trueAnomaly;
			this.kinematics = arg1.kinematics;
		} else {
			assert(arg2 && arg3 !== undefined && arg4)
			super(arg1, arg2);
			this.trueAnomaly = arg3;
			this.kinematics = arg4;
		}
	}

	override getKinematic(): KinematicTemporalState {
		return new KinematicTemporalState(this.kinematics, this.time);
	}

	// /**
	//  * Retrieves this position as a KinematicTemporalState.
	//  * Internally caches the result.
	//  */
	// override getKinematic(depth?: number): KinematicTemporalState {
	// 	if (depth !== undefined && depth < 1) error("OrbitalState getKinematic() Invalid argument(s)");
	// 	if (this.depth === true || (depth !== undefined && depth <= this.depth)) {
	// 		// retrieve cache
	// 		return new KinematicTemporalState(this.kinematics!, this.time);
	// 	} else {
	// 		// calculate more specific kinematic and update cache
	// 		const result = this.trajectory.getKinematic(depth);
	// 		this.kinematics = result.kinematicState;
	// 		this.depth = depth ?? true;
	// 		if (this.depth !== true && this.depth === this.kinematics.length())
	// 			this.depth = true;
	// 		return result;
	// 	}
	// }

	override equals(other?: OrbitalState): other is OrbitalState {
		return super.equals(other) && this.trueAnomaly === other.trueAnomaly;
	}

	override deepClone(): OrbitalState {
		return this;
	}
}

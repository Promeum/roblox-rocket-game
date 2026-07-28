import Vector3D from "shared/Modules/Libraries/Vector3D";

import Kinematic from "../Physics/Kinematic";
import Chrono from "../../Chrono";
import KinematicChrono from "../Physics/KinematicChrono";
import TrajectoryState from ".";

import type LinearTrajectory from "../Trajectory/LinearTrajectory";

/**
 * Represents the state of a Celestial on a LinearTrajectory.
 * Intended only to be created by Trajectory classes.
 * Guaranteed not to have a relativeTo (since not orbiting anything).
 * Immutable, doesn't cache values.
 */
export default class LinearState extends TrajectoryState {
	declare readonly trajectory: LinearTrajectory;
	public readonly kinematics: Kinematic;
	declare readonly position: Vector3D;
	declare readonly velocity: Vector3D;

	// Constructors

	/**
	 * Copy-constructor.
	 */
	public constructor(state: LinearState);

	/**
	 * Creates a new LinearState instance.
	 */
	public constructor(trajectory: LinearTrajectory, time: Chrono, kinematics: Kinematic);

	public constructor(
		arg1: LinearTrajectory | LinearState,
		arg2?: Chrono,
		arg3?: Kinematic
	) {
		if (arg1 instanceof LinearState) {
			super(arg1);
			this.kinematics = arg1.kinematics;
		 } else {
			assert(arg2 && arg3)
			super(arg1, arg2);
			this.kinematics = arg3;
			this.position = arg3.position;
			this.velocity = arg3.velocity;
		 }
	}

	override getKinematic(): KinematicChrono {
		return new KinematicChrono(this.kinematics, this.time);
	}

	override equals(other?: LinearState): other is LinearState {
		return super.equals(other) && this.kinematics === other.kinematics;
	}
}

import KinematicState from "../State/KinematicState";
import TemporalState from "../State/TemporalState";
import KinematicTemporalState from "../State/KinematicTemporalState";
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
	public readonly kinematics: KinematicState;

	// Constructors

	/**
	 * Copy-constructor.
	 */
	public constructor(state: LinearState);

	/**
	 * Creates a new LinearState instance.
	 */
	public constructor(trajectory: LinearTrajectory, time: TemporalState, position: KinematicState);

	public constructor(
		arg1: LinearTrajectory | LinearState,
		arg2?: TemporalState,
		arg3?: KinematicState
	) {
		if (arg1 instanceof LinearState) {
			super(arg1);
			this.kinematics = arg1.kinematics;
		 } else {
			assert(arg2 && arg3)
			super(arg1, arg2);
			this.kinematics = arg3;
		 }
	}

	override getKinematic(): KinematicTemporalState {
		return new KinematicTemporalState(this.kinematics, this.time);
	}

	override equals(other?: LinearState): other is LinearState {
		return super.equals(other) && this.kinematics === other.kinematics;
	}

	override deepClone(): LinearState {
		return this;
	}
}

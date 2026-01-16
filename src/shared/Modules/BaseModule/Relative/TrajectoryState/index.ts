import Relative from "..";
import KinematicTemporalState from "../State/KinematicTemporalState";
import TemporalState from "../State/TemporalState";

import type Trajectory from "../Trajectory";

/**
 * Represents a position state on a Trajectory.
 * Intended only to be created by Trajectory classes.
 * Allows for cached values but otherwise immutable.
 */
export default abstract class TrajectoryState extends Relative {
	public readonly trajectory: Trajectory;
	public readonly time: TemporalState;

	// Constructors

	/**
	 * Copy-constructor.
	 */
	public constructor(state: TrajectoryState);

	/**
	 * Creates a new TrajectoryState instance.
	 */
	public constructor(trajectory: Trajectory, time: TemporalState);

	public constructor(arg1: Trajectory | TrajectoryState, arg2?: TemporalState) {
		if (arg1 instanceof TrajectoryState) {
			super(arg1.getRelativeOrUndefined());
			this.trajectory = arg1.trajectory;
			this.time = arg1.time;
		} else {
			assert(arg2)
			super(arg1.getRelativeOrUndefined()?.calculateStateFromTime(arg2));
			this.trajectory = arg1;
			this.time = arg2;
		}
	}

	/**
	 * Retrieves this position as a KinematicTemporalState.
	 */
	public abstract getKinematic(): KinematicTemporalState;

	// /**
	//  * Retrieves this position as a KinematicTemporalState.
	//  * @param depth Positive integer to specify how many relative
	//  * TrajectoryStates should be calculated (to eliminate redundant
	//  * calculations). Omit for maximum depth.
	//  */
	// public abstract getKinematic(depth?: number): KinematicTemporalState;

	override equals(other?: TrajectoryState): other is TrajectoryState {
		return other !== undefined && this.trajectory.equals(other.trajectory)
			&& this.time.equals(other.time);
	}

	abstract override deepClone(): TrajectoryState;
}

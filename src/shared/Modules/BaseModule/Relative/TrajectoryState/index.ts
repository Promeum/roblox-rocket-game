import Vector3D from "shared/Modules/Libraries/Vector3D";

import Relative from "..";
import Kinematic from "../Physics/Kinematic";
import KinematicChrono from "../Physics/KinematicChrono";
import Chrono from "../../Chrono";

import type Trajectory from "../Trajectory";

/**
 * Represents a position state on a Trajectory.
 * Intended only to be created by Trajectory classes.
 * Allows for cached values but otherwise immutable.
 */
export default abstract class TrajectoryState extends Relative {
	public readonly trajectory: Trajectory;
	public readonly time: Chrono;
	public readonly kinematics!: Kinematic;
	public readonly position!: Vector3D;
	public readonly velocity!: Vector3D;

	// Constructors

	/**
	 * Copy-constructor.
	 */
	public constructor(state: TrajectoryState);

	/**
	 * Creates a new TrajectoryState instance.
	 */
	public constructor(trajectory: Trajectory, time: Chrono);

	public constructor(arg1: Trajectory | TrajectoryState, arg2?: Chrono) {
		if (arg1 instanceof TrajectoryState) {
			super(arg1.queryRelative());
			this.trajectory = arg1.trajectory;
			this.time = arg1.time;
			this.kinematics = arg1.kinematics;
			this.position = arg1.position;
			this.velocity = arg1.velocity;
		} else {
			assert(arg2)
			super(arg1.queryRelative()?.calculateStateFromTime(arg2));
			this.trajectory = arg1;
			this.time = arg2;
		}
	}

	/**
	 * Retrieves this position as a KinematicChrono.
	 */
	public abstract getKinematic(): KinematicChrono;

	// /**
	//  * Retrieves this position as a TrajectoryState.
	//  * @param depth Positive integer to specify how many relative
	//  * TrajectoryStates should be calculated (to eliminate redundant
	//  * calculations). Omit for maximum depth.
	//  */
	// public abstract getKinematic(depth?: number): TrajectoryState;

	override equals(other?: TrajectoryState): other is TrajectoryState {
		return other !== undefined && this.trajectory.equals(other.trajectory)
			&& this.time.equals(other.time);
	}

	override getRelative(): TrajectoryState {
		return super.getRelative() as TrajectoryState;
	}

	abstract override deepClone(): TrajectoryState;
}

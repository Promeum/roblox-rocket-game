// import { $assert, $error } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";
// import Thread from "shared/Modules/Libraries/Thread";

import Relative from "..";
import TemporalState from "../State/TemporalState";
import AccelerationState from "../State/AccelerationState";
import KinematicTemporalState from "../State/KinematicTemporalState";
import TrajectoryState from "../TrajectoryState";

/**
 * Trajectory represents a trajectory in spacetime with kinematic and temporal components.
 */
export default abstract class Trajectory extends Relative {
	public readonly start!: TrajectoryState;

	// Position Calculations

	/**
	 * Calculates a position as a KinematicTemporalState.
	 */
	public abstract getKinematic(time: TemporalState | number): KinematicTemporalState

	// /**
	//  * Retrieves this position as a KinematicTemporalState.
	//  * @param depth Positive integer to specify how many relative
	//  * TrajectoryStates should be calculated (to eliminate redundant
	//  * calculations). Omit for maximum depth.
	//  */
	// public abstract getKinematic(time: number, depth?: number): KinematicTemporalState

	/**
	 * Calculates a CelestialState from a time.
	 * Note: time can be negative.
	 * @param time The time relative to this trajectory
	 * @returns The CelestialState at that time
	 */
	public abstract calculateStateFromTime(time: TemporalState | number): TrajectoryState

	/**
	 * Calculates the closest approach to position.
	 * Times are relative to this Trajectory.
	 * Time may be negative if the current orbit is hyperbolic.
	 * https://www.desmos.com/3d/rfndgd4ppj
	 * @param position The position to be reached
	 * @returns The CelestialState at the closest point to that position
	 */
	public abstract calculateStateFromPoint(position: Vector3D): TrajectoryState

	/**
	 * Calculates the time the craft reaches a specific magnitude on this Trajectory.
	 * Times are relative to this Trajectory.
	 * https://www.desmos.com/3d/rfndgd4ppj
	 * @param magnitude The altitude/magnitude to reach
	 * @returns The CelestialState when that magnitude is reached
	 */
	public abstract calculateStateFromMagnitude(magnitude: number): TrajectoryState

	// Methods

	/**
	 * Computes the location of closest approach of this and another Trajectory in spacetime.
	 * @param other The trajectory of the other body.
	 * @param searchTimeMin The minimum time to search.
	 * @param searchTimeMax The maximum time to search.
	 * @returns The state of this and other at closest approach, respectively.
	 */
	public abstract MOID(other: Trajectory): TrajectoryState[]

	/**
	 * Computes the location when this and another Trajectory are
	 * a certain distance away from each other.
	 * @param other The trajectory of the other body.
	 * @returns The state of this and other at closest approach, respectively,
	 * or false if no intersections are found.
	 */
	public abstract orbitalIntersection(other: Trajectory, distance: number): TrajectoryState[] | false

	/**
	 * Adds acceleration to the start position, then
	 * returns a new Trajectory based on the new position.
	 * Checks for SOI changes.
	 * @param delta The change in time. Is most accurate with small values.
	 * @param withAcceleration Adds an acceleration to this Trajectory, modifying the trajectory
	 * @returns The incremented trajectory
	 */
	public abstract atTime(delta: number, withAcceleration?: AccelerationState): Trajectory

	// calculatePoints

	/**
	 * Calculates a trajectory as a series of states.
	 * @param recursions The number of points to calculate
	 * @returns An array of CelestialStates
	 */
	public abstract calculatePoints(
		startTime: TemporalState | number,
		endTime: TemporalState | number,
		recursions: number
	): TrajectoryState[];

	protected calculatePointsInternal(
			startBound: number,
			endBound: number,
			recursions: number,
			calculatorMethod: (x: number) => TrajectoryState
		): TrajectoryState[] {
		const increment: number = (endBound - startBound) / recursions;
		const points: TrajectoryState[] = [];

		// const threads: Thread[] = [];
		for (let i = 0; i < recursions; i++) {
			// const newThread: Thread = Thread.create(() => this.calculatePositionFromTime(delta * i), player);
			// newThread.start().Event.Once((result) => points[i] = result);
			const arg = calculatorMethod(i * increment + startBound);
			points.push(arg);
		}

		return points;
	}

	/**
	 * Calculates a trajectory as a series of states.
	 * Use for large volumes of recursions.
	 * @param recursions The number of points to calculate
	 * @returns An array of CelestialStates
	 */
	public abstract calculatePointsAsync(
		startTime: TemporalState | number, endTime: TemporalState | number,
		recursions: number, batchSize?: number
	): Promise<TrajectoryState[]>;

	protected async calculatePointsAsyncInternal(
		startBound: number,
		endBound: number,
		recursions: number,
		batchSize: number = 500,
		calculatorMethod: (x: number) => TrajectoryState
	): Promise<TrajectoryState[]> {
		if (recursions <= batchSize) {
			return this.calculatePointsInternal(
				startBound, endBound, recursions, calculatorMethod
			);
		}

		const increment: number = (endBound - startBound) / recursions;
		const points: TrajectoryState[] = [];
		const threads: Promise<TrajectoryState[]>[] = [];

		// create multiple threads
		for (let batch = 1; batch <= math.ceil(recursions / batchSize); batch++) {
			threads.push((async () => {
				const points: TrajectoryState[] = [];
				for (let i = (batch - 1) * batchSize; i < math.min(batch * batchSize, recursions); i++) {
					const state = calculatorMethod(startBound + increment * i);
					points.push(state);
				}
				return points;
			})());
		}

		// join the threads
		for (const thread of threads) {
			for (const point of thread.expect()) {
				points.push(point);
			}
		}

		return points;
	}

	// Internal utility methods

	/** Ensures input is relativeTime */
	protected asRelativeTime(time: TemporalState | number): number {;
		if (typeIs(time, "number"))
			return time;
		else
			return this.start.time.matchRelative(time).relativeTime;
	}

	// Superclass return type overrides

	override getRelative(): Trajectory {
		return super.getRelative() as Trajectory;
	}

	override getRelativeOrUndefined(): Trajectory | undefined {
		return super.getRelativeOrUndefined() as Trajectory | undefined;
	}

	override getRelativeTree(): Trajectory[] {
		return super.getRelativeTree() as Trajectory[];
	}

	override sameRelativeTree(other: Trajectory): boolean {
		return super.sameRelativeTree(other);
	}

	abstract override deepClone(): Trajectory
}

import Vector3D from "../../Libraries/Vector3D";
import KinematicState from "../Relative/State/KinematicState";
import TemporalState from "../Relative/State/TemporalState";
import AccelerationState from "../Relative/State/AccelerationState";
import KinematicTemporalState from "../Relative/State/KinematicTemporalState";
import Trajectory from "../Trajectory";
import LinearState from "../CelestialState/LinearState";
import type Celestial from "../Relative/Celestial";

/**
 * LinearTrajectory represents a linear trajectory in spacetime with constant velocity.
 */
export default class LinearTrajectory extends Trajectory {
	declare initialPosition: LinearState;

	// Constructors

	/**
	 * Creates a new LinearTrajectory instance.
	 */
	public constructor(initialPosition: LinearState);

	/**
	 * Creates a new LinearTrajectory instance.
	 */
	public constructor(initialPosition: KinematicTemporalState, celestial: Celestial);

	public constructor(arg1: KinematicTemporalState | LinearState, arg2?: Celestial) {
		if (arg1 instanceof LinearState) {
			super(arg1);
		} else {
			assert(arg2);
			super(arg1, arg2);
			this.initialPosition = new LinearState(this.initialPosition);
		}
	}

	// Return type override methods

	override calculatePositionFromTime(relativeTime: number): LinearState {
		return new LinearState(super.calculatePositionFromTime(relativeTime));
	}

	override calculatePoints(delta: number, recursions: number): LinearState[] {
		return super.calculatePoints(delta, recursions);
	}

	override calculatePositionFromMagnitude(magnitude: number): LinearState {
		return new LinearState(super.calculatePositionFromMagnitude(magnitude));
	}

	override calculatePositionFromPoint(position: Vector3D): LinearState {
		return new LinearState(super.calculatePositionFromPoint(position));
	}

	override displayTrajectory(delta: number, recursions: number, width: number): Folder {
		const display: Folder = super.displayTrajectory(delta, recursions, width);

		display.Parent = game.Workspace.WaitForChild("Orbits");
		return display;
	}

	// Methods

	/**
	 * Computes the location of closest approach of this and another LinearTrajectory in spacetime.
	 * @param other The LinearTrajectory of the other body.
	 * @returns The KinematicTemporalState representing the MOID position, pointing from self to other.
	 */
	override MOID(other: LinearTrajectory): LinearState {
		const selfStartTemporal: TemporalState = this.initialPosition.kinematicPosition.temporalState;
		const selfStart: KinematicState = this.initialPosition.kinematicPosition.kinematicState;

		const otherStartTemporal: TemporalState = other.initialPosition.kinematicPosition.temporalState
			.matchRelative(this.initialPosition.kinematicPosition.temporalState);
		const otherAdjusted: LinearTrajectory = other.atTime(otherStartTemporal.relativeTime);
		const otherStart: KinematicState = otherAdjusted.initialPosition.kinematicPosition.kinematicState;

		assert(selfStart.sameRelativeTree(otherStart), "relative trees different")

		const p1: Vector3D = selfStart.position;
		const p2: Vector3D = otherStart.position;
		const v1: Vector3D = selfStart.velocity;
		const v2: Vector3D = otherStart.velocity;

		// time formula
		const resultMoidTime: number = - (p1.sub(p2)).dot(v1.sub(v2)) / ((v1.sub(v2)).magnitude() ** 2);
		// difference between kinematics at MOID, relative to self
		const resultKinematic: KinematicState = otherAdjusted.calculatePointFromTime(resultMoidTime)
			.sub(this.calculatePointFromTime(resultMoidTime));

		return new LinearState(
			new KinematicTemporalState(
				new KinematicState(resultKinematic, selfStart),
				selfStartTemporal.withRelativeTime(resultMoidTime)
			),
			this.celestial
		);
	}

	/**
	 * Calculates the point at which this LinearTrajectory will reach relativeTime seconds from now.
	 * Note: relativeTime can be negative.
	 * @param relativeTime The time relative to this trajectory
	 * @returns The KinematicState at that time, relative to the initialPosition
	 */
	override calculatePointFromTime(relativeTime: number): KinematicState {
		const initialKinematicState: KinematicState = this.initialPosition.kinematicPosition.kinematicState;

		// Compute new position; velocity remains unchanged
		return new KinematicState(
			initialKinematicState.velocity.mul(relativeTime),
			Vector3D.zero,
			initialKinematicState
		)
	}

	/**
	 * Calculates the time of closest approach to position.
	 * Note: Calculated time may be negative.
	 * @param position The target position
	 * @returns The time to reach closest approach
	 */
	override calculateTimeFromPoint(position: Vector3D): number {
		const startPosition: KinematicTemporalState = this.initialPosition.kinematicPosition;

		// Transform position relative to this LinearTrajectory
		const transformedTargetPoint: Vector3D = position.sub(startPosition.getPosition());

		// Find magnitude of the target point as if it was already projected to the velocity vector
		return transformedTargetPoint.dot(startPosition.getVelocity());
	}

	/**
	 * Calculates the time at which this LinearTrajectory will be magnitude meters away from its current position.
	 * Note: magnitude, and calculated time, may be negative.
	 * @param magnitude The target distance
	 * @returns The time to reach that distance
	 */
	override calculateTimeFromMagnitude(magnitude: number): number {
		// Meters / (Meters / Seconds) => Seconds
		return magnitude / this.initialPosition.kinematicPosition.getVelocity().magnitude();
	}

	override atTime(delta: number, withAcceleration?: AccelerationState): LinearTrajectory {
		return new LinearTrajectory(
			this.initialPosition.kinematicPosition.step(delta, withAcceleration),
			this.celestial
		);
	}

}

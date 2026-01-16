import Vector3D from "../../../Libraries/Vector3D";

import KinematicState from "../State/KinematicState";
import TemporalState from "../State/TemporalState";
import AccelerationState from "../State/AccelerationState";
import KinematicTemporalState from "../State/KinematicTemporalState";
import LinearState from "../TrajectoryState/LinearState";
import Trajectory from ".";

/**
 * LinearTrajectory represents a linear trajectory in spacetime with constant velocity.
 * Guaranteed not to have a relativeTo (since not orbiting anything).
 * Immutable.
 */
export default class LinearTrajectory extends Trajectory {
	declare readonly start: LinearState;

	// Constructors

	/**
	 * Internal constructor.
	 */
	public constructor(start: LinearState);

	/**
	 * Creates a new LinearTrajectory instance.
	 */
	public constructor(position: KinematicTemporalState);

	/**
	 * Creates a new LinearTrajectory instance.
	 */
	public constructor(position: Vector3D, velocity: Vector3D, temporal: TemporalState);

	public constructor(
		arg1: LinearState | KinematicTemporalState | Vector3D,
		arg2?: Vector3D,
		arg3?: TemporalState
	) {
		super(); // LinearTrajectory does not orbit things so has no Relative

		if (arg1 instanceof LinearState) {
			this.start = arg1;
		} else if (arg1 instanceof KinematicTemporalState) {
			this.start = new LinearState(
				this,
				arg1.temporalState,
				arg1.kinematicState
			);
		} else {
			assert(arg2 instanceof Vector3D && arg3)
			this.start = new LinearState(
				this,
				arg3,
				new KinematicState(arg1, arg2)
			);
		}
	}

	// Position Calculations

	override getKinematic(time: TemporalState | number): KinematicTemporalState {
		const relativeTime: number = this.asRelativeTime(time);
		return new KinematicTemporalState(
			new KinematicState(
				this.start.kinematics.velocity.mul(relativeTime),
				Vector3D.zero, // velocity remains unchanged
				this.start.kinematics
			),
			new TemporalState(relativeTime, this.start.time)
		);
	}

	override calculateStateFromTime(time: TemporalState | number): LinearState {
		const start: KinematicState = this.start.kinematics;
		const relativeTime: number = this.asRelativeTime(time);

		// Compute new state relative to this.start
		return new LinearState(
			this,
			new TemporalState(relativeTime, this.start.time),
			new KinematicState(
				start.velocity.mul(relativeTime),
				Vector3D.zero, // velocity remains unchanged
				start
			)
		);
	}

	/**
	 * Calculates the closest approach to position.
	 * Note: Calculated time may be negative.
	 * @param position The target position
	 * @returns The time to reach closest approach
	 */
	override calculateStateFromPoint(position: Vector3D): LinearState {
		// Transform position relative to this LinearTrajectory
		const transformedTargetPoint: Vector3D = position.sub(this.start.kinematics.position);
		// Find magnitude of the target point as if it was already projected to the velocity vector
		const time: number = transformedTargetPoint.dot(this.start.kinematics.velocity);

		return this.calculateStateFromTime(time);
	}

	/**
	 * Calculates the LinearState at which this LinearTrajectory will be magnitude meters away from its current position.
	 * Note: magnitude, and calculated time, may be negative.
	 * @param magnitude The target distance
	 * @returns The time to reach that distance
	 */
	override calculateStateFromMagnitude(magnitude: number): LinearState {
		// Meters / (Meters / Seconds) => Seconds
		const time: number = magnitude / this.start.kinematics.velocity.magnitude();
		return this.calculateStateFromTime(time);
	}

	// Methods

	override MOID(other: LinearTrajectory): LinearState[] {
		const startTimeS: TemporalState = this.start.time;
		const startS: KinematicState = this.start.kinematics;
		const startTimeO: TemporalState = other.start.time.matchRelative(startTimeS);
		const startO: KinematicState = other.calculateStateFromTime(startTimeO.relativeTime).kinematics;

		assert(startS.sameRelativeTree(startO), "relative trees different")

		const p1: Vector3D = startS.position;
		const p2: Vector3D = startO.position;
		const v1: Vector3D = startS.velocity;
		const v2: Vector3D = startO.velocity;

		// time formula
		const resultMoidTime: number = - (p1.sub(p2)).dot(v1.sub(v2)) / ((v1.sub(v2)).magnitude() ** 2);
		const resultMoidTemporal: TemporalState = startTimeS.withRelativeTime(resultMoidTime);

		return [
			this.calculateStateFromTime(resultMoidTime),
			other.calculateStateFromTime(startTimeO.matchRelative(resultMoidTemporal).relativeTime)
		];
	}

	/**
	 * Computes the 2, 1, or 0 possible locations when this and another
	 * LinearTrajectory are a certain distance away from each other.
	 * @param other The trajectory of the other body.
	 * @returns The state of this and other at closest approach, respectively.
	 */
	override orbitalIntersection(other: LinearTrajectory, distance: number): LinearState[] {
		// Kinematic problem:
		// There exists two points, A and B, both in linear motion.
		// Find the earliest point where A is M distance from B.
		const selfPosition: KinematicState = this.start.kinematics;
		const otherPosition: KinematicState = other.start.kinematics;

		// distance vector relative to other
		const distancePoint: Vector3D = otherPosition.position.sub(selfPosition.position);
		const distanceVelocity: Vector3D = otherPosition.velocity.sub(selfPosition.velocity);

		// solve for time(s) by finding roots of polynomial
		const [time1, time2] = quadraticFormula(
			distanceVelocity.dot(distanceVelocity), // coefficient 2
			distanceVelocity.dot(distancePoint), // coefficient 1
			distancePoint.dot(distancePoint) - distance * distance // coefficient 0
		);

		// Check for NaN
		if (time1 !== time1 || time2 !== time2)
			error("LinearTrajectory orbitalIntersection() time(s) are nan "+`(time1 = ${time1}, time2 = ${time2})`)

		const results: LinearState[] = [
			this.calculateStateFromTime(time1),
			this.calculateStateFromTime(time2)
		];

		return results;
	}

	override atTime(delta: number, withAcceleration?: AccelerationState): LinearTrajectory {
		return new LinearTrajectory(
			// Computed state is not relative to this.start
			new KinematicTemporalState(
				this.start.kinematics.step(delta, withAcceleration),
				this.start.time.withIncrementTime(delta)
			)
		);
	}

	override calculatePoints(
		startTime: TemporalState | number,
		endTime: TemporalState | number,
		recursions: number
	): LinearState[] {
		return super.calculatePointsInternal(
			this.asRelativeTime(startTime), this.asRelativeTime(endTime),
			recursions, x => this.calculateStateFromTime(x)
		) as LinearState[];
	}

	override async calculatePointsAsync(
		startTime: TemporalState | number, endTime: TemporalState | number,
		recursions: number, batchSize: number = 1000
	): Promise<LinearState[]> {
		return super.calculatePointsAsyncInternal(
			this.asRelativeTime(startTime), this.asRelativeTime(endTime),
			recursions, batchSize, x => this.calculateStateFromTime(x)
		) as Promise<LinearState[]>;
	}

	override deepClone(): LinearTrajectory {
		return new LinearTrajectory(
			this.start.getKinematic()
		);
	}
}

/**
 * The quadratic formula, modified to work with orbitalIntersection()
 */
function quadraticFormula(a: number, b: number, c: number): [number, number] {
	const sqrtPart = math.sqrt(b * b - a * c);
	return [
		(-b - sqrtPart) / a,
		(-b + sqrtPart) / a
	];
}

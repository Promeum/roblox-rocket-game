import Vector3D from "../../Libraries/Vector3D";
import Trajectory from "../Trajectory";
import OrbitalTrajectory from "./OrbitalTrajectory";
import KinematicState from "../Relative/State/KinematicState";
import TemporalState from "../Relative/State/TemporalState";
import KinematicTemporalState from "../KinematicTemporalState";
import * as Globals from "../../../Globals";
// import { $assert } from "rbxts-transform-debug";
import GravityCelestial from "../Relative/Celestial/GravityCelestial";
import AccelerationState from "../Relative/State/AccelerationState";

/**
 * LinearTrajectory represents a linear trajectory in spacetime with constant velocity.
 */
export default class LinearTrajectory extends Trajectory {

	// Constructors

	/**
	 * Creates a new LinearTrajectory instance.
	 */
	public constructor(kinematicState: KinematicState, temporalState: TemporalState)

	/**
	 * Creates a new LinearTrajectory instance from a KinematicTemporalState.
	 */
	public constructor(position: KinematicTemporalState)

	public constructor(arg1: KinematicState | KinematicTemporalState, arg2?: TemporalState) {
		if (arg1 instanceof KinematicState) { // Constructor 1
			assert(arg2 instanceof TemporalState);
			super(arg1, arg2);
		} else { // Constructor 2
			super(arg1);
		}
	}

	// Methods

	/**
	 * The quadratic formula, adjusted so it will work with kinematic vectors.
	 * Cannot be used with regular numbers as the coefficients 4 and 2 are not here.
	 */
	private static quadraticFormula(a: number, b: number, c: number): [number, number] {
		const sqrtPart = math.sqrt(b * b - a * c);
		return [
			(-b - sqrtPart) / a,
			(-b + sqrtPart) / a
		];
	}

	/**
	 * Returns whether this LinearTrajectory leads into a new Trajectory (in a new SOI).
	 * @returns true if there is a next Trajectory
	 */
	public hasNextTrajectory(): boolean {
		// check cache
		if (this.nextTrajectoryDirectionCache !== undefined) {
			return this.nextTrajectoryDirectionCache !== false;
		} else { // calculate next trajectory
			// Kinematic problem:
			// There exists two points, A and B, in linear motion.
			// Find the earliest point where A is M distance from B.
			if (Globals.rootGravityCelestials.size() > 0) {
				const selfPosition: KinematicState = this.startPosition.kinematicState;
				let closestSOIEntryTime: number | undefined = undefined;
				let closestCelestialSOI: GravityCelestial | undefined;

				// calculate SOI entry for all root GravityCelestials
				for (let i = 0; i < Globals.rootGravityCelestials.size(); i++) {
					const gravityCelestial: GravityCelestial = Globals.rootGravityCelestials[i];
					const otherPosition: KinematicState = gravityCelestial.trajectory.startPosition.kinematicState;

					assert(selfPosition.sameRelativeTree(otherPosition),
						"self and gravityCelestial start positions are not relative to the same thing");

					// distance vector relative to other
					const distancePoint: Vector3D = selfPosition.position.sub(otherPosition.position);
					const distanceVelocity: Vector3D = selfPosition.velocity.sub(otherPosition.velocity);

					// solve for time(s) by finding roots of polynomial
					const [time1, time2] = LinearTrajectory.quadraticFormula(
						distanceVelocity.dot(distanceVelocity), // coefficient 2
						distanceVelocity.dot(distancePoint), // coefficient 1
						distancePoint.dot(distancePoint) - gravityCelestial.SOIRadius // coefficient 0
					);

					// get earliest valid (time >= 0) SOI entry time
					let SOIEntryTime: number | false
					if (time1 >= 0 && time1 > time2)
						SOIEntryTime = time1;
					else if (time2 >= 0 && time2 > time1)
						SOIEntryTime = time2;
					else
						SOIEntryTime = false;

					// set new closest (or keep current closest) SOI
					if (SOIEntryTime !== false && (closestSOIEntryTime === undefined || SOIEntryTime < closestSOIEntryTime)) {
						closestSOIEntryTime = SOIEntryTime;
						closestCelestialSOI = gravityCelestial;
					}
				}

				if (closestSOIEntryTime !== undefined) { // trajectory enters an SOI
					assert(closestCelestialSOI !== undefined);
					this.timeOfNextTrajectory = new TemporalState(closestSOIEntryTime, this.startPosition.temporalState);
					this.nextTrajectoryCache = new OrbitalTrajectory(
						this.calculatePositionFromTime(closestSOIEntryTime),
						closestCelestialSOI
					);
					this.nextTrajectoryDirectionCache = "in";
					this.nextSOICache = closestCelestialSOI;
				} else { // trajectory misses all root GravityCelestial SOIs
					this.timeOfNextTrajectory = false;
					this.nextTrajectoryCache = false;
					this.nextTrajectoryDirectionCache = false;
					this.nextSOICache = false;
				}
			} else { // no root GravityCelestials exist (i.e. space is empty)
				this.timeOfNextTrajectory = false;
				this.nextTrajectoryCache = false;
				this.nextTrajectoryDirectionCache = false;
				this.nextSOICache = false;
			}

			return this.hasNextTrajectory();
		}
	}

	public nextTrajectory(): OrbitalTrajectory {
		return super.nextTrajectory() as OrbitalTrajectory;
	}

	public nextTrajectoryDirection(): "in" {
		return "in";
	}

	/**
	 * Computes the location of closest approach of this and another LinearTrajectory in spacetime.
	 * @param other The LinearTrajectory of the other body.
	 * @returns The KinematicTemporalState representing the MOID position, pointing from self to other.
	 */
	public MOID(other: LinearTrajectory): KinematicTemporalState {
		const selfStartTemporal: TemporalState = this.startPosition.temporalState;
		const selfStart: KinematicState = this.startPosition.kinematicState;

		const otherStartTemporal: TemporalState = other.startPosition.temporalState
			.matchRelative(this.startPosition.temporalState);
		const otherAdjusted: LinearTrajectory = other.atTime(otherStartTemporal.relativeTime);
		const otherStart: KinematicState = otherAdjusted.startPosition.kinematicState;

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

		return new KinematicTemporalState(
			new KinematicState(resultKinematic, selfStart),
			selfStartTemporal.withRelativeTime(resultMoidTime)
		);
	}

	/**
	 * Calculates the point at which this LinearTrajectory will reach relativeTime seconds from now.
	 * Note: relativeTime can be negative.
	 * @param relativeTime The time relative to this trajectory
	 * @returns The KinematicState at that time, relative to the current start position's KinematicState
	 */
	public calculatePointFromTime(relativeTime: number): KinematicState {
		const kinematicState: KinematicState = this.startPosition.kinematicState;

		// Compute new position; velocity remains unchanged
		return new KinematicState(
			kinematicState.velocity.mul(relativeTime),
			Vector3D.zero,
			kinematicState
		)
	}

	/**
	 * Calculates the time of closest approach to position.
	 * Note: Calculated time may be negative.
	 * @param position The target position
	 * @returns The time to reach closest approach
	 */
	public calculateTimeFromPoint(position: Vector3D): number {
		const startPosition: KinematicTemporalState = this.startPosition;

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
	public calculateTimeFromMagnitude(magnitude: number): number {
		// Meters / (Meters / Seconds) => Seconds
		return magnitude / this.startPosition.getVelocity().magnitude();
	}

	public step(delta: number, withAcceleration?: AccelerationState): Trajectory {
		if (this.hasNextTrajectory() && this.timeToNextTrajectory(delta) <= 0) {
			// target time overflows into next trajectory
			// and lands on the other side of SOI boundary
			return this.nextTrajectory().step(delta, withAcceleration);
		} else {
			// extrapolated trajectory lands on the same side of SOI boundary as before
			// or target time stays within current trajectory
			return this.atTime(delta, withAcceleration);
		}
	}

	protected atTime(delta: number, withAcceleration?: AccelerationState): LinearTrajectory {
		return new LinearTrajectory(this.startPosition.step(delta, withAcceleration));
	}

}

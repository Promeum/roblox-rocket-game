// import { $assert, $error, $warn } from "rbxts-transform-debug";
import * as Globals from "shared/Globals";
import Vector3D from "../../Libraries/Vector3D";
import KinematicState from "../Relative/State/KinematicState";
import TemporalState from "../Relative/State/TemporalState";
import KinematicTemporalState from "../KinematicTemporalState";
import Trajectory from "../Trajectory";
import GravityCelestial from "../Relative/Celestial/GravityCelestial";
// import MOID from "shared/Modules/Libraries/MOID";
import AccelerationState from "../Relative/State/AccelerationState";
import OrbitalState from "../OrbitalState";

/*
	TODO:
	Consolidate orbital/kinematic parameters into the OrbitalState class!
	Move the complex math stuff into a library!
	Add a Bisection Search function!
*/

/**
 * OrbitalTrajectory represents an orbital trajectory with elliptical or hyperbolic motion.
 */
export default class OrbitalTrajectory extends Trajectory {
	public readonly orbitalState: OrbitalState;
	public readonly orbiting: GravityCelestial;

	// Constructors

	/**
	 * Creates a new OrbitalTrajectory instance.
	 */
	public constructor(kinematicState: KinematicState, temporalState: TemporalState, orbiting: GravityCelestial);

	/**
	 * Creates a new OrbitalTrajectory instance from a KinematicTemporalState.
	 */
	public constructor(position: KinematicTemporalState, orbiting: GravityCelestial);

	public constructor(arg1: KinematicTemporalState | KinematicState, arg2: GravityCelestial | TemporalState, arg3?: GravityCelestial) {
		// Constructor parameters
		let kinematicTemporalState: KinematicTemporalState;
		let orbiting: GravityCelestial;

		if (arg1 instanceof KinematicState) { // Constructor 1
			assert(arg2 instanceof TemporalState && arg3 instanceof GravityCelestial);
			kinematicTemporalState = new KinematicTemporalState(arg1, arg2);
			orbiting = arg3;
		} else { // Constructor 2
			assert(arg1 instanceof KinematicTemporalState && arg2 === undefined);
			kinematicTemporalState = arg1;
			orbiting = arg2;
		}

		super(kinematicTemporalState);
		this.orbiting = orbiting;
		this.orbitalState = new OrbitalState(kinematicTemporalState, orbiting);
	}

	// Accessors

	/**
	 * Returns whether this trajectory has an apoapsis.
	 * @returns true if there is an apoapsis
	 */
	public hasApoapsis(): boolean {
		return this.orbitalState.hasApoapsis();
	}

	/**
	 * Returns the apoapsis.
	 * @returns The apoapsis kinematic state
	 */
	public getApoapsis(): KinematicState {
		return this.orbitalState.getApoapsis();
	}

	/**
	 * Returns the periapsis.
	 * @returns The periapsis kinematic state
	 */
	public getPeriapsis(): KinematicState {
		return this.orbitalState.getPeriapsis();
	}

	/**
	 * Returns whether this trajectory has a semi major axis.
	 * @returns true if there is a semi major axis
	 */
	public hasSemiMajorAxis(): boolean {
		return this.orbitalState.hasSemiMajorAxis();
	}

	/**
	 * Returns the semi major axis.
	 * @returns The semi major axis in meters
	 */
	public getSemiMajorAxis(): number {
		return this.orbitalState.getSemiMajorAxis();
	}

	/**
	 * Returns the semi minor axis.
	 * @returns The semi minor axis in meters
	 */
	public getSemiMinorAxis(): number {
		return this.orbitalState.getSemiMinorAxis();
	}

	// Methods

	/**
	 * Calculates a new KinematicState at a given point in time on this OrbitalTrajectory.
	 * @param relativeTime The time relative to this trajectory
	 * @returns The kinematic state at that time
	 */
	public calculatePointFromTime(relativeTime: number): KinematicState {
		return this.orbitalState.calculatePointFromTime(relativeTime);
	}

	/**
	 * Calculates the time until the craft reaches a specific point on this OrbitalTrajectory.
	 * @param position The position to be reached
	 * @param referencePosition The reference position (defaults to current position)
	 * @returns The time in seconds
	 */
	public calculateTimeFromPoint(position: Vector3D, referencePosition?: Vector3D): number {
		return this.orbitalState.calculateTimeFromPoint(position, referencePosition);
	}

	/**
	 * Calculates the time the craft reaches a specific altitude on this OrbitalTrajectory.
	 * @param magnitude The target altitude
	 * @returns The time in seconds
	 */
	public calculateTimeFromMagnitude(magnitude: number): number {
		return this.orbitalState.calculateTimeFromMagnitude(magnitude);
	}

	/**
	 * Calculates a new KinematicState at a given altitude on this OrbitalTrajectory.
	 * @param magnitude The target altitude
	 * @returns The kinematic state at that altitude
	 */
	public calculatePointFromMagnitude(magnitude: number): KinematicState {
		return this.orbitalState.calculatePointFromMagnitude(magnitude);
	}

	// Superclass method implementations

	/**
	 * Returns whether this LinearTrajectory leads into a new Trajectory (in a new SOI).
	 * @returns true if there is a next Trajectory
	 */
	public hasNextTrajectory(): boolean {
		// check cache
		if (this.nextTrajectoryDirectionCache !== undefined) {
			return this.nextTrajectoryDirectionCache !== false;
		} else { // calculate next trajectory
			// const selfPosition: KinematicState = this.startPosition.kinematicState;
			let closestSOIEntryTime: number | false = false;
			let closestCelestialSOI: GravityCelestial | false = false;
			let nextTrajectoryDirection: "in" | "out" | false = false;

			if ( // check for exiting the current SOI
				!this.hasApoapsis()
				|| (
					this.hasApoapsis()
					&& this.getApoapsis().position.magnitude()
					> this.orbiting.SOIRadius
				)
			) {
				const SOIExit = this.calculatePositionFromMagnitude(this.orbiting.SOIRadius);
				closestSOIEntryTime = SOIExit.getRelativeTime();
				closestCelestialSOI = this.orbiting;
				nextTrajectoryDirection = "out";
			}

			// MOID algorithm
			if (Globals.rootGravityCelestials.size() > 0) {
				// calculate SOI entry for all root GravityCelestials
				warn("Attempt to check next inward trajectory");
				// for (const gravityCelestial of Globals.rootGravityCelestials) {
				// 	const otherPosition: KinematicState = gravityCelestial.trajectory.startPosition.kinematicState;

				// 	assert(selfPosition.sameRelativeTree(otherPosition),
				// 		"self and gravityCelestial start positions are not relative to the same thing");

				// 	// get earliest valid (time >= 0) SOI entry time
				// 	const MOID: KinematicTemporalState = this.MOID(gravityCelestial.trajectory);
				// 	let SOIEntryTime: number | false;
				// 	if (MOID.getPosition().magnitude() <= gravityCelestial.SOIRadius)
				// 		SOIEntryTime = MOID.getRelativeTime();
				// 	else
				// 		SOIEntryTime = false;

				// 	// set new closest (or keep current closest) SOI
				// 	if (SOIEntryTime !== false && (closestSOIEntryTime === false || SOIEntryTime < closestSOIEntryTime)) {
				// 		closestSOIEntryTime = SOIEntryTime;
				// 		closestCelestialSOI = gravityCelestial;
				// 		nextTrajectoryDirection = "in";
				// 	}
				// }
			}

			if (closestSOIEntryTime !== false) { // trajectory enters a new SOI
				assert(closestCelestialSOI !== false);
				this.timeOfNextTrajectory = new TemporalState(closestSOIEntryTime, this.startPosition.temporalState);
				this.nextTrajectoryCache = this.atTime(closestSOIEntryTime);
				this.nextTrajectoryDirectionCache = nextTrajectoryDirection;
				this.nextSOICache = closestCelestialSOI;
			} else { // trajectory misses all root GravityCelestial SOIs and stays within current SOI
				this.timeOfNextTrajectory = false;
				this.nextTrajectoryCache = false;
				this.nextTrajectoryDirectionCache = false;
				this.nextSOICache = false;
			}

			return this.hasNextTrajectory();
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public MOID(other: OrbitalTrajectory): KinematicTemporalState {
		error("Not implemented");
		// if (this.isBound) {
		// 	const thisParameters = this.getOrbitalParameters();
		// 	const otherParameters = other.getOrbitalParameters();
		// 	const MOIDDistance = MOID(
		// 		this.semiMajorAxis,
		// 		this.eccentricity,
		// 		thisParameters.argumentOfPeriapsis,
		// 		thisParameters.ascendingNode,
		// 		thisParameters.inclination,
		// 		other.semiMajorAxis,
		// 		other.eccentricity,
		// 		otherParameters.argumentOfPeriapsis,
		// 		otherParameters.ascendingNode,
		// 		otherParameters.inclination
		// 	);
		// // Find the KinematicTemporalState at which this and other
		// // are MOIDDistance away from each other
		// 	const
		// }
	}

	public step(delta: number, withAcceleration?: AccelerationState): Trajectory {
		if (this.hasNextTrajectory() && this.timeToNextTrajectory(delta) <= 0) {
			// target time overflows into next trajectory
			// and lands on the other side of SOI boundary
			return this.nextTrajectory().step(this.timeToNextTrajectory(), withAcceleration);
		} else {
			return this.atTime(delta, withAcceleration);
		}
	}

	protected atTime(delta: number, withAcceleration?: AccelerationState): OrbitalTrajectory {
		if (withAcceleration) {
			// Calculate and add the acceleration as a seperate velocity + position offset
			const velocityToAdd: Vector3D = withAcceleration.getAccelerationVector(delta);

			return new OrbitalTrajectory(
				new KinematicTemporalState(
					this.calculatePointFromTime(delta).add(
						new KinematicState(velocityToAdd.mul(delta), velocityToAdd)
					),
					this.startPosition.temporalState.withIncrementTime(delta)
				),
				this.orbiting
			);
		} else {
			return new OrbitalTrajectory(this.calculatePositionFromTime(delta), this.orbiting);
		}
	}

}

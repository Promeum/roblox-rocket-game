import Vector3D from "../../Libraries/Vector3D";
import KinematicState from "../Relative/State/KinematicState";
import TemporalState from "../Relative/State/TemporalState";
import AccelerationState from "../Relative/State/AccelerationState";
import KinematicTemporalState from "../Relative/State/KinematicTemporalState";
import LinearState from "../CelestialState/LinearState";
import OrbitalState from "../CelestialState/OrbitalState";
import Trajectory from ".";
import LinearTrajectory from "./LinearTrajectory";
import OrbitalTrajectory from "./OrbitalTrajectory";
import type GravityCelestial from "../Relative/Celestial/GravityCelestial";
import * as Globals from "../../../Globals";
import CelestialState from "../CelestialState";

// Types

type initialPositionType<T> = T extends OrbitalTrajectory ? OrbitalState : LinearState;
type nextTrajectoryType<T> = (T extends OrbitalTrajectory ? CompositeTrajectory<LinearTrajectory> : never) | CompositeTrajectory<OrbitalTrajectory>;
type nextTrajectoryDirectionType<T> = T extends OrbitalTrajectory ? "out" | "in" : "in";

/**
 * CompositeTrajectory wraps a linear or orbital trajectory.
 * Can lead into other CompositeTrajectories by linking forward to them.
 * Is used by PhysicsCelestials.
 */
export default class CompositeTrajectory<T extends LinearTrajectory | OrbitalTrajectory> extends Trajectory {
	declare initialPosition: initialPositionType<T>;
	protected currentTrajectory: T
	private timeOfNextTrajectory: TemporalState | false | undefined;
	private nextTrajectoryCache: nextTrajectoryType<T> | false | undefined;
	private nextTrajectoryDirectionCache: nextTrajectoryDirectionType<T> | false | undefined;
	private nextSOICache: GravityCelestial | false | undefined;

    // Contructors

	/**
	 * Creates a new CompositeTrajectory instance.
	 */
    public constructor(currentTrajectory: T) {
        super(currentTrajectory.initialPosition);

		this.currentTrajectory = currentTrajectory;
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
	 * Returns whether this CompositeTrajectory leads into a new Trajectory (in a new SOI).
	 * Caches results.
	 * @returns true if there is a next Trajectory
	 */
	public hasNextTrajectory(): boolean {
		// check cache
		if (this.nextTrajectoryDirectionCache !== undefined) {
			return this.nextTrajectoryDirectionCache !== false;
        } else if (this.currentTrajectory instanceof OrbitalTrajectory) {
			// OrbitalTrajectory
			warn("hasNextTrajectory (orbital)")
			print("start of this trajectory:")
			print(this.initialPosition)
			this.nextTrajectoryFromOrbital();
			return this.hasNextTrajectory();
		} else {
			// LinearTrajectory
			warn("hasNextTrajectory (linear)")
			this.nextTrajectoryFromLinear();
			return this.hasNextTrajectory();
		}
    }

	private nextTrajectoryFromOrbital(): void {
		assert(this.currentTrajectory instanceof OrbitalTrajectory);
		// const selfPosition: KinematicState = this.startPosition.kinematicState;
		let closestSOIEntryTime: number | false = false;
		let closestCelestialSOI: GravityCelestial | undefined | false = false;
		let nextTrajectoryDirection: "in" | "out" | false = false;

		if ( // check if exiting out of current SOI
			!this.currentTrajectory.hasApoapsis()
			|| (
				this.currentTrajectory.hasApoapsis()
				&& this.currentTrajectory.getApoapsis().position.magnitude() > this.currentTrajectory.orbiting.SOIRadius
			)
		) {
			const SOIExit = this.currentTrajectory.calculatePositionFromMagnitude(this.currentTrajectory.orbiting.SOIRadius);
			closestSOIEntryTime = SOIExit.kinematicPosition.getRelativeTime();
			// check if orbiting is, itself, orbiting something else
			if (this.currentTrajectory.orbiting.orbiting) {
				closestCelestialSOI = this.currentTrajectory.orbiting.orbiting;
			} else {
				closestCelestialSOI = undefined;
			}
			nextTrajectoryDirection = "out";
		}

		// TODO: MOID algorithm to be implemented
		// How to find all child orbiting bodies of a GravityState?
		// if (this.orbiting.childGravityCelestials.size() > 0) {
			// calculate SOI entry for all root GravityCelestials
			// warn("Attempt to check next inward trajectory");
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
		// }

		if (closestSOIEntryTime !== false) { // trajectory exits the current SOI
			assert(closestCelestialSOI !== false);
			this.timeOfNextTrajectory = new TemporalState(closestSOIEntryTime, this.initialPosition.kinematicPosition.temporalState);
			this.nextTrajectoryDirectionCache = nextTrajectoryDirection as nextTrajectoryDirectionType<T> | false;
			this.nextSOICache = closestCelestialSOI;
			if (this.nextTrajectoryDirectionCache === "out") {
				// Trajectory going into outer SOI
				// TODO: fix calculatePositionFromTime?

print("start point on previous trajectory:")
print(this.currentTrajectory.calculateAbsolutePositionFromTime(closestSOIEntryTime))
				const newKinematicState: KinematicTemporalState = this.currentTrajectory.calculateAbsolutePositionFromTime(closestSOIEntryTime).kinematicPosition.consolidateKinematic();
this._testpart(
	"pos of orbiting at next trajectory start",
	new BrickColor("Neon orange").Color,
	0.4,
	this.currentTrajectory.orbiting.trajectory.calculateAbsolutePositionFromTime(
		this.currentTrajectory.orbiting.trajectory.initialPosition.kinematicPosition.temporalState.matchRelative(newKinematicState.temporalState).relativeTime
	).kinematicPosition.getPosition(),
	game.Workspace
)
this._testpart(
	"real start of new trajectory",
	new BrickColor("Brick yellow").Color,
	0.4,
	newKinematicState.getPosition(),
	game.Workspace
)
print("start of new trajectory:")
print(newKinematicState)
				if (!closestCelestialSOI) {
					// No outer SOI exists,
					// Trajectory exiting into linear trajectory
					this.nextTrajectoryCache = new CompositeTrajectory<LinearTrajectory>(
						new LinearTrajectory(
							newKinematicState,
							this.celestial
						)
					) as nextTrajectoryType<T>;
				} else {
					// Outer SOI exists,
					// Trajectory exiting into orbital trajectory
					assert(closestCelestialSOI !== undefined)
					this.nextTrajectoryCache = new CompositeTrajectory<OrbitalTrajectory>(
						new OrbitalTrajectory(
							newKinematicState,
							this.celestial,
							closestCelestialSOI
						)
					) as nextTrajectoryType<T>;
				}
			} else {
				assert(closestCelestialSOI !== undefined);
				const newKinematicState: KinematicTemporalState = closestCelestialSOI.state.kinematicPosition.matchRelative(
					this.calculatePositionFromTime(closestSOIEntryTime).kinematicPosition
				);
				// Trajectory going into inner SOI
				// As such it is guaranteed an orbital trajectory
				this.nextTrajectoryCache = new CompositeTrajectory<OrbitalTrajectory>(
					new OrbitalTrajectory(
						newKinematicState,
						this.celestial,
						closestCelestialSOI
					)
				);
			}
		} else { // trajectory stays within current SOI
			this.timeOfNextTrajectory = false;
			this.nextTrajectoryCache = false;
			this.nextTrajectoryDirectionCache = false;
			this.nextSOICache = false;
		}
		print("\tnext is "+(this.nextTrajectoryCache === false ? "[none]" : (this.nextTrajectoryCache as CompositeTrajectory<OrbitalTrajectory | LinearTrajectory>).currentTrajectory instanceof OrbitalTrajectory ? "orbital" : "linear"))
	}

	private nextTrajectoryFromLinear(): void {
		assert(this.currentTrajectory instanceof LinearTrajectory);
		// Kinematic problem:
		// There exists two points, A and B, both in linear motion.
		// Find the earliest point where A is M distance from B.
		if (Globals.rootGravityCelestials.size() > 0) {
			let selfPosition: KinematicState = this.initialPosition.kinematicPosition.kinematicState;
			if (selfPosition.hasRelative())
				selfPosition = selfPosition.consolidateOnce();
			let closestSOIEntryTime: number | false = false;
			let closestCelestial: GravityCelestial | false = false;

			// calculate soonest SOI entry among all root GravityCelestials
			for (let i = 0; i < Globals.rootGravityCelestials.size(); i++) {
				const celestial: GravityCelestial = Globals.rootGravityCelestials[i];
				const celestialState: LinearState = celestial.state as LinearState;
				const celestialPosition: KinematicState = celestialState.kinematicPosition.kinematicState;

				assert(selfPosition.sameRelativeTree(celestialPosition),
					"self and gravityCelestial start positions are not relative to the same thing");

				// distance vector relative to other
				const distancePoint: Vector3D = selfPosition.position.sub(celestialPosition.position);
				const distanceVelocity: Vector3D = selfPosition.velocity.sub(celestialPosition.velocity);

				// solve for time(s) by finding roots of polynomial
				const [time1, time2] = CompositeTrajectory.quadraticFormula(
					distanceVelocity.dot(distanceVelocity), // coefficient 2
					distanceVelocity.dot(distancePoint), // coefficient 1
					distancePoint.dot(distancePoint) - celestial.SOIRadius // coefficient 0
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
				if (SOIEntryTime !== false && (closestSOIEntryTime === false || SOIEntryTime < closestSOIEntryTime)) {
					closestSOIEntryTime = SOIEntryTime;
					closestCelestial = celestial;
				}
			}

			if (closestSOIEntryTime !== false) { // trajectory enters an SOI
				assert(closestCelestial !== false);
				this.timeOfNextTrajectory = new TemporalState(
					closestSOIEntryTime,
					this.initialPosition.kinematicPosition.temporalState
				);
				this.nextTrajectoryDirectionCache = "in";
				this.nextSOICache = closestCelestial;
				// Convert LinearState to an OrbitalState by making the
				// underlying KinematicTemporalState relative to the next SOI
				const newKinematicState: KinematicTemporalState = closestCelestial.state.kinematicPosition.matchRelative(
					this.calculatePositionFromTime(closestSOIEntryTime).kinematicPosition
				);
				// A linear trajectory can only enter into an orbital trajectory,
				// never another linear trajectory
				this.nextTrajectoryCache = new CompositeTrajectory<OrbitalTrajectory>(
					new OrbitalTrajectory(
						newKinematicState,
						this.celestial,
						closestCelestial
					)
				);
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
		print("\tnext is "+(this.nextTrajectoryCache === false ? "[none]" : "orbital"))
	}

	/**
	 * Returns the next Trajectory.
	 * Otherwise, if there is no trajectory, throws an error.
	 * @returns The next Trajectory
	 */
	public nextTrajectory(): nextTrajectoryType<T> {
		if (this.nextTrajectoryCache === false)
			error("CompositeTrajectory nextTrajectory() cannot be called on a Trajectory with no nextTrajectory");

		if (this.nextTrajectoryCache === undefined) {
			this.hasNextTrajectory();
			return this.nextTrajectory();
		} else {
			return this.nextTrajectoryCache;
		}
	}

	/**
	 * Returns the time to the next Trajectory.
	 * Otherwise, if there is no next trajectory, throws an error.
	 * @param [relativeTime=0] Defaults to 0 (the initial position).
	 * @returns A TemporalState relative to the start position
	 */
	public timeToNextTrajectory(relativeTime: number = 0): number {
		if (this.timeOfNextTrajectory === false)
			error("Trajectory timeToNextTrajectory() cannot be called with no nextTrajectory");

		if (this.timeOfNextTrajectory === undefined) {
			this.hasNextTrajectory();
			return this.timeToNextTrajectory(relativeTime);
		} else {
			return this.timeOfNextTrajectory.relativeTime - relativeTime;
		}
	}

	/**
	 * Returns if the latest Trajectory goes into, or out of, an SOI.
	 * Otherwise, if there is no next trajectory, throws an error.
	 * @returns The next Trajectory
	 */
	public nextTrajectoryDirection(): nextTrajectoryDirectionType<T> {
		if (this.nextTrajectoryDirectionCache === false)
			error("CompositeTrajectory nextTrajectoryDirection() cannot be called with no nextTrajectory");

		if (this.nextTrajectoryDirectionCache === undefined) {
			this.hasNextTrajectory();
			return this.nextTrajectoryDirection();
		} else {
			return this.nextTrajectoryDirectionCache;
		}
	}

	/**
	 * Returns whether the latest Trajectory leads into a new SOI
	 * around a GravityCelestial.
	 * Caches results.
	 * @returns true if there is a next SOI
	 */
	public entersNewSOI(): boolean {
		if (this.nextTrajectoryCache === false)
			error("CompositeTrajectory entersNewSOI() cannot be called with no nextTrajectory");

		if (this.nextSOICache === undefined) {
			this.hasNextTrajectory();
			return this.entersNewSOI();
		} else {
			return this.nextSOICache !== false;
		}
	}

	/**
	 * Returns the next GravityState whose SOI this Celestial is entering.
	 * Otherwise, if there is no next trajectory, throws an error.
	 * @returns The next GravityState
	 */
	public nextSOI(): GravityCelestial {
		if (this.nextTrajectoryCache === false)
			error("CompositeTrajectory nextSOI() cannot be called with no nextTrajectory");
		if (this.nextSOICache === false)
			error("CompositeTrajectory nextSOI() cannot be called if not entering a new SOI");

		if (this.nextSOICache === undefined) {
			this.hasNextTrajectory();
			return this.nextSOI();
		} else {
			return this.nextSOICache;
		}
	}

	/**
	 * Computes the location of closest approach of this and another CompositeTrajectory in spacetime.
	 * @param other The CompositeTrajectory of the other body.
	 * @returns The KinematicTemporalState representing the MOID position, pointing from self to other.
	 */
    override MOID(other: T): initialPositionType<T> {
        if (this.currentTrajectory instanceof OrbitalTrajectory) {
			error("Not implemented");
			// assert(other instanceof OrbitalTrajectory);
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
		} else {
			assert(other instanceof LinearTrajectory);
			return this.currentTrajectory.MOID(other) as initialPositionType<T>;
		}
    }

    override calculatePointFromTime(relativeTime: number): KinematicState {
		if (!this.hasNextTrajectory() || this.timeToNextTrajectory(relativeTime) > 0)
        	return this.currentTrajectory.calculatePointFromTime(relativeTime);
		else
			return this.nextTrajectory().calculatePointFromTime(relativeTime - (this.timeOfNextTrajectory as TemporalState).relativeTime);
    }

	override calculateAbsolutePositionFromTime(relativeTime: number): CelestialState {
		if (!this.hasNextTrajectory() || this.timeToNextTrajectory(relativeTime) > 0)
        	return this.currentTrajectory.calculateAbsolutePositionFromTime(relativeTime);
		else
			return this.nextTrajectory().calculateAbsolutePositionFromTime(relativeTime - (this.timeOfNextTrajectory as TemporalState).relativeTime);
	}

    override calculateTimeFromPoint(position: Vector3D): number {
        return this.currentTrajectory.calculateTimeFromPoint(position);
    }

    override calculateTimeFromMagnitude(magnitude: number): number {
        return this.currentTrajectory.calculateTimeFromMagnitude(magnitude);
    }

	override displayTrajectory(delta: number, recursions: number, width: number): Folder {
		if (delta <= 0 || recursions < 1 || width < 0)
			error("Trajectory displayTrajectory() Invalid parameter(s)");

		const trajectoryFolder: Folder = new Instance("Folder");
		trajectoryFolder.Name = "CompositeTrajectory";

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let currentSegment: CompositeTrajectory<LinearTrajectory | OrbitalTrajectory> = this;
		let recursionsLeft: number = recursions;
		let segmentsProcessed = 0;
		while (recursionsLeft > 0) {
			if (currentSegment.hasNextTrajectory() && recursionsLeft * delta > currentSegment.timeToNextTrajectory()) {
				const recursionsToProcess = math.floor(currentSegment.timeToNextTrajectory() / delta);
				const newDisplay = currentSegment.currentTrajectory.displayTrajectory(delta, recursionsToProcess, width);
				newDisplay.Name += ++segmentsProcessed;
				newDisplay.Parent = trajectoryFolder;
				currentSegment = currentSegment.nextTrajectory();
				recursionsLeft -= recursionsToProcess;
			} else {
				const newDisplay = currentSegment.currentTrajectory.displayTrajectory(delta, recursionsLeft, width);
				newDisplay.Name += ++segmentsProcessed;
				newDisplay.Parent = trajectoryFolder;
				recursionsLeft = 0;
			}
		}

		trajectoryFolder.Parent = game.Workspace.WaitForChild("Orbits");
		return trajectoryFolder;
	}

    override atTime(delta: number, withAcceleration?: AccelerationState): CompositeTrajectory<LinearTrajectory> | CompositeTrajectory<OrbitalTrajectory> {
		if (this.hasNextTrajectory() && this.timeToNextTrajectory(delta) <= 0) {
			// target time overflows into next trajectory
			// and lands on the other side of SOI boundary
			return new CompositeTrajectory(this.nextTrajectory().atTime(delta, withAcceleration));
		} else {
			// extrapolated trajectory lands on the same side of SOI boundary as before
			// or target time stays within current trajectory
			return new CompositeTrajectory(this.currentTrajectory.atTime(delta, withAcceleration));
		}
    }

}
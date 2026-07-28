import Vector3D from "../../../../Libraries/Vector3D";

import Kinematic from "../../Physics/Kinematic";
import Chrono from "../../../Chrono";
import Acceleration from "../../Physics/Acceleration";
import KinematicChrono from "../../Physics/KinematicChrono";
import TrajectoryState from "../../TrajectoryState";
import LinearState from "../../TrajectoryState/LinearState";
import OrbitalState from "../../TrajectoryState/OrbitalState";
import Trajectory from "..";
import LinearTrajectory from "../LinearTrajectory";
import OrbitalTrajectory from "../OrbitalTrajectory";
import GravityCelestial from "../../../Celestial/GravityCelestial";
import { timeRanges } from "./TimeRanges";

// Types

type compositeTrajectory = CompositeTrajectory<LinearTrajectory | OrbitalTrajectory>;
type stateType<T> = T extends OrbitalTrajectory ? OrbitalState : LinearState;
type nextTrajectoryType<T> = (T extends OrbitalTrajectory ? CompositeTrajectory<LinearTrajectory> : never) | CompositeTrajectory<OrbitalTrajectory>;
type nextTrajectoryDirectionType<T> = T extends OrbitalTrajectory ? "out" | "in" : "in";

// TODO: Possibly eliminate cache getters in favor of making the cache variables public

/**
 * CompositeTrajectory wraps a linear or orbital trajectory.
 * Can lead into other CompositeTrajectories by linking forward to them.
 * Is used by PhysicsCelestials.
 */
export default class CompositeTrajectory<T extends LinearTrajectory | OrbitalTrajectory> extends Trajectory {
	declare readonly start: stateType<T>;
	public readonly current: T
	private timeOfNext: Chrono | false | undefined;
	private nextCache: nextTrajectoryType<T> | false | undefined;
	private nextDirectionCache: nextTrajectoryDirectionType<T> | false | undefined;
	private nextOrbitingCache: GravityCelestial | false | undefined;

    // Contructors

	/**
	 * Creates a new CompositeTrajectory instance.
	 */
    public constructor(current: T, private readonly rootGravityCelestials: GravityCelestial[]) {
        super();
		this.start = current.start as stateType<T>;
		this.current = current;
    }

	// Position Calculations

	public getKinematic(time: Chrono | number): KinematicChrono {
		const relativeTime: number = this.asRelativeTime(time);
		if (!this.hasNext() || this.timeToNext(relativeTime) > 0) {
        	return this.current.getKinematic(relativeTime);
		} else {
			return this.next().getKinematic(
				relativeTime - this.next().start.time.sub(this.start.time).toSeconds()
			);
		}
	}

	public calculateStateFromTime(time: Chrono | number): TrajectoryState {
		const relativeTime: number = this.asRelativeTime(time);
		if (!this.hasNext() || this.timeToNext(relativeTime) > 0) {
        	return this.current.calculateStateFromTime(relativeTime);
		} else {
			return this.next().calculateStateFromTime(
				relativeTime - this.next().start.time.sub(this.start.time).toSeconds()
			);
		}
	}

	public calculateStateFromPoint(position: Vector3D): stateType<T> {
		return this.current.calculateStateFromPoint(position) as stateType<T>;
	}

	public calculateStateFromMagnitude(magnitude: number): stateType<T> {
		return this.current.calculateStateFromMagnitude(magnitude) as stateType<T>;
	}

    // Methods

	/**
	 * Returns whether this CompositeTrajectory leads into a new Trajectory (in a new SOI).
	 * Caches results.
	 * @returns true if there is a next Trajectory
	 */
	public hasNext(): boolean {
		// check cache
		if (this.nextDirectionCache !== undefined) {
			return this.nextDirectionCache !== false;
        } else if (this.current instanceof OrbitalTrajectory) {
			// OrbitalTrajectory
			this.nextFromOrbital();
			return this.hasNext();
		} else {
			// LinearTrajectory
			this.nextFromLinear();
			return this.hasNext();
		}
    }

	private nextFromOrbital(): void {
		assert(this.current instanceof OrbitalTrajectory);
		// const selfPosition: KinematicState = this.startPosition.kinematicState;
		let SOIExit: OrbitalState | false = false;
		let closestSOIEntryTime: Chrono | false = false;
		let closestCelestialSOI: GravityCelestial | undefined | false = false;
		let nextTrajectoryDirection: "in" | "out" | false = false;

		if ( // check if exiting out of current SOI
			!this.current.hasApoapsis()
			|| (
				this.current.hasApoapsis()
				&& this.current.getApoapsis().position.magnitude() > this.current.orbiting.SOIRadius
			)
		) {
			SOIExit = this.current.calculateStateFromMagnitude(this.current.orbiting.SOIRadius);
			closestSOIEntryTime = SOIExit.time;

if (closestSOIEntryTime !== closestSOIEntryTime) closestSOIEntryTime = false
// this._testpart(
// 	"SOI exit",
// 	new BrickColor("Bright reddish lilac").Color,
// 	Vector3D.one.mul(0.6),
// 	SOIExit.getKinematic().consolidateOnce().position.mul(1/6371.01e3),
// 	game.Workspace
// )

// print(SOIExit)
// print(calcSOIExit)
// assert(SOIExit.trueAnomaly === calcSOIExit.trueAnomaly, "trueAnomaly mismatched by "+(calcSOIExit.trueAnomaly - SOIExit.trueAnomaly))
			// orbiting, itself, may or may not be orbiting something else
			closestCelestialSOI = this.current.orbiting.orbiting;
			nextTrajectoryDirection = "out";
		}

		// find soonest SOI change
		if (this.current.orbiting.childGravityCelestials.size() > 0) {
// warn("CompositeTrajectory moid attempt")
			// calculate SOI entry for all root GravityCelestials
			for (const gravityCelestial of this.current.orbiting.childGravityCelestials) {
				assert(gravityCelestial.trajectory instanceof OrbitalTrajectory)

				// get earliest valid (time >= 0) SOI entry time
				// subtract 0.5 to ensure SOI is not exited immediately
				const intersection = this.current.orbitalIntersection(
					gravityCelestial.trajectory, gravityCelestial.SOIRadius - 0.5);
// print("start time:")
				if (intersection !== false) {
					// set new closest (or keep current closest) SOI
					const SOIEntryTime = intersection[0].time;
// print(SOIEntryTime)
					if (closestSOIEntryTime === false || SOIEntryTime.lessThan(closestSOIEntryTime)) {
						closestSOIEntryTime = SOIEntryTime;
						closestCelestialSOI = gravityCelestial;
						nextTrajectoryDirection = "in";
					}
				}
// else print("[none found]")
			}
		}

		if (closestSOIEntryTime !== false) { // trajectory exits the current SOI
			assert(closestCelestialSOI !== false);
			this.timeOfNext = closestSOIEntryTime;
			this.nextDirectionCache = nextTrajectoryDirection as nextTrajectoryDirectionType<T> | false;
			this.nextOrbitingCache = closestCelestialSOI;
			if (this.nextDirectionCache === "out") {
				// Trajectory going into outer SOI
				const newKinematicState: KinematicChrono = this.current
					.calculateStateFromTime(closestSOIEntryTime).getKinematic().consolidateKinematic();
				// const newKinematicState: KinematicChrono = SOITExit !== false ? SOIExit.getKinematic().consolidateOnce();

				if (!closestCelestialSOI) {
					// No outer SOI exists,
					// Trajectory exiting into linear trajectory
					this.nextCache = new CompositeTrajectory<LinearTrajectory>(
						new LinearTrajectory(
							newKinematicState
						), this.rootGravityCelestials
					) as nextTrajectoryType<T>;
				} else {
					// Outer SOI exists,
					// Trajectory exiting into orbital trajectory
					assert(closestCelestialSOI !== undefined)
					this.nextCache = new CompositeTrajectory<OrbitalTrajectory>(
						new OrbitalTrajectory(
							newKinematicState,
							closestCelestialSOI
						), this.rootGravityCelestials
					) as nextTrajectoryType<T>;
				}
// this._testpart(
// 	"SOI entry last trajectory (pre-instantiation)",
// 	new BrickColor("Brick yellow").Color,
// 	Vector3D.one.mul(0.6),
// 	newKinematicState.position.mul(1/6371.01e3),
// 	game.Workspace
// )
			} else {
				// Trajectory going into inner SOI
				// and is guaranteed an orbital trajectory
				assert(closestCelestialSOI !== undefined);
				const futureOrbitingState = closestCelestialSOI
					.trajectory.getKinematic(closestSOIEntryTime);
				const futureThisState = this.current.getKinematic(this.timeOfNext);
				// const futureThisState = SOIExit.getKinematic();
				const startState = new KinematicChrono(
					new Kinematic(
						futureThisState.position.sub(futureOrbitingState.position),
						futureThisState.velocity.sub(futureOrbitingState.velocity),
						futureOrbitingState.kinematic
					),
					futureThisState.chrono
				);
// this._testpart(
// 	"SOI entry last trajectory (pre-instantiation)",
// 	new BrickColor("Neon orange").Color,
// 	Vector3D.one.mul(1),
// 	startState.consolidateOnce().position.mul(1/6371.01e3),
// 	game.Workspace,
// 	Enum.PartType.Ball
// )
				this.nextCache = new CompositeTrajectory<OrbitalTrajectory>(
					new OrbitalTrajectory(
						startState,
						closestCelestialSOI
					), this.rootGravityCelestials
				);
			}
		} else { // trajectory stays within current SOI
			this.timeOfNext = false;
			this.nextCache = false;
			this.nextDirectionCache = false;
			this.nextOrbitingCache = false;
		}
// print(
// 	"next is "
// 	+ (this.nextCache === false ? "[none]"
// 		: (
// 			(this.nextCache as compositeTrajectory).current instanceof OrbitalTrajectory ?
// 			("orbit, around " + (this.nextCache.current as OrbitalTrajectory).orbiting.name)
// 			: "linear"
// 		)
// 	)
// )
// if (this.nextCache){
// 	print(`\tstart time: ${this.timeOfNext instanceof Chrono ? this.timeOfNext.toString() : error("5hruirft")}`)
// }
	}

	private nextFromLinear(): void {
		assert(this.current instanceof LinearTrajectory
			&& this.start instanceof LinearState);
		let closestGravityCelestial: GravityCelestial | false = false;

		if (this.rootGravityCelestials.size() > 0) {
			// calculate soonest SOI entry among all root GravityCelestials
			let closestSOIEntry: LinearState | false = false;

			for (let i = 0; i < this.rootGravityCelestials.size(); i++) {
				const celestial: GravityCelestial = this.rootGravityCelestials[i];

				assert(celestial.trajectory instanceof LinearTrajectory,
					"self and gravityCelestial start positions are not relative to the same thing");

				// get valid (time >= 0) SOI entry time
				let result: LinearState | false = this.current
					.orbitalIntersection(celestial.trajectory, celestial.SOIRadius)[0] ?? false;
				if (!result || result.time.lessThan(0))
					result = false;

				// set new closest (or keep current closest) SOI
				if (result !== false
					&& (
						closestSOIEntry === false
						|| result.time.lessThan(closestSOIEntry.time)
					)) {
					closestSOIEntry = result;
					closestGravityCelestial = celestial;
				}
			}

			// trajectory enters an SOI
			if (closestSOIEntry !== false) {
				this.timeOfNext = closestSOIEntry.time;
				this.nextDirectionCache = "in";
				this.nextOrbitingCache = closestGravityCelestial as GravityCelestial;
				const newKinematic: Kinematic = (closestSOIEntry.trajectory.start as LinearState)
				.kinematics.matchRelative(
					closestSOIEntry.kinematics
				);
				// A linear trajectory can only enter into an orbital trajectory,
				// never another linear trajectory
				this.nextCache = new CompositeTrajectory<OrbitalTrajectory>(
					new OrbitalTrajectory(
						newKinematic.position,
						newKinematic.velocity,
						closestSOIEntry.time,
						this.nextOrbitingCache
					), this.rootGravityCelestials
				);
			} else { // trajectory misses all root GravityCelestial SOIs
				this.timeOfNext = false;
				this.nextCache = false;
				this.nextDirectionCache = false;
				this.nextOrbitingCache = false;
			}
		} else { // no root GravityCelestials exist (i.e. space is empty)
			this.timeOfNext = false;
			this.nextCache = false;
			this.nextDirectionCache = false;
			this.nextOrbitingCache = false;
		}
print(
	"next is "
	+ (this.nextCache === false ? "[none]"
		: (
			(this.nextCache as compositeTrajectory).current instanceof OrbitalTrajectory ?
			("orbit, around " + (this.nextCache.current as OrbitalTrajectory).orbiting.name)
			: "linear"
		)
	)
)
	}

	/**
	 * Returns the next Trajectory.
	 * Otherwise, if there is no trajectory, throws an error.
	 * @returns The next Trajectory
	 */
	public next(): nextTrajectoryType<T> {
		if (this.nextCache === false)
			error("CompositeTrajectory nextTrajectory() cannot be called on a Trajectory with no nextTrajectory");

		if (this.nextCache === undefined) {
			this.hasNext();
			return this.next();
		} else {
			return this.nextCache;
		}
	}

	/**
	 * Returns the time to the next Trajectory.
	 * Otherwise, if there is no next trajectory, throws an error.
	 * @param [relativeTime=0] Defaults to 0 (the initial position).
	 * @returns A Chrono relative to the start position
	 */
	public timeToNext(relativeTime: number = 0): number {
		if (this.timeOfNext === false)
			error("Trajectory timeToNextTrajectory() cannot be called with no nextTrajectory");

		if (this.timeOfNext === undefined) {
			this.hasNext();
			return this.timeToNext(relativeTime);
		} else {
			return this.timeOfNext.sub(this.start.time).toSeconds() - relativeTime;
		}
	}

	/**
	 * Returns if the latest Trajectory goes into, or out of, an SOI.
	 * Otherwise, if there is no next trajectory, throws an error.
	 * @returns The next Trajectory
	 */
	public nextDirection(): nextTrajectoryDirectionType<T> {
		if (this.nextDirectionCache === false)
			error("CompositeTrajectory nextTrajectoryDirection() cannot be called with no nextTrajectory");

		if (this.nextDirectionCache === undefined) {
			this.hasNext();
			return this.nextDirection();
		} else {
			return this.nextDirectionCache;
		}
	}

	/**
	 * Returns whether the latest Trajectory leads into a new SOI
	 * around a GravityCelestial.
	 * Caches results.
	 * @returns true if there is a next SOI
	 */
	public entersNewSOI(): boolean {
		if (this.nextCache === false)
			error("CompositeTrajectory entersNewSOI() cannot be called with no nextTrajectory");

		if (this.nextOrbitingCache === undefined) {
			this.hasNext();
			return this.entersNewSOI();
		} else {
			return this.nextOrbitingCache !== false;
		}
	}

	/**
	 * Returns the next GravityState whose SOI this Celestial is entering.
	 * Otherwise, if there is no next trajectory, throws an error.
	 * @returns The next GravityState
	 */
	public nextSOI(): GravityCelestial {
		if (this.nextCache === false)
			error("CompositeTrajectory nextSOI() cannot be called with no nextTrajectory");
		if (this.nextOrbitingCache === false)
			error("CompositeTrajectory nextSOI() cannot be called if not entering a new SOI");

		if (this.nextOrbitingCache === undefined) {
			this.hasNext();
			return this.nextSOI();
		} else {
			return this.nextOrbitingCache;
		}
	}

	/**
	 * Computes the location of closest approach of this and another Trajectory in spacetime.
	 * @param other The CompositeTrajectory of the other body.
	 * @returns The KinematicChrono representing the MOID position, pointing from self to other.
	 */
    override MOID(other: T): stateType<T>[] {
        if (this.current instanceof OrbitalTrajectory !== other instanceof OrbitalTrajectory)
			error("CompositeTrajectory MOID() argument differs from this.currentTrajectory");
		else if ((this.current as OrbitalTrajectory)?.orbiting !== (other as OrbitalTrajectory)?.orbiting)
			error("CompositeTrajectory MOID() other trajectory is not in the same SOI as this trajectory " + `(${this.current} !== ${other})`);

		return this.current.MOID(other as OrbitalTrajectory & LinearTrajectory) as stateType<T>[];
    }

	override orbitalIntersection(other: T, distance: number): stateType<T>[] {
        if (this.current instanceof OrbitalTrajectory !== other instanceof OrbitalTrajectory)
			error("CompositeTrajectory orbitalIntersection() argument differs from this.currentTrajectory");
		else if ((this.current as OrbitalTrajectory)?.orbiting !== (other as OrbitalTrajectory)?.orbiting)
			error("CompositeTrajectory orbitalIntersection() other trajectory is not in the same SOI as this trajectory " + `(${this.current} !== ${other})`);

		return this.current.orbitalIntersection(other as OrbitalTrajectory & LinearTrajectory, distance) as stateType<T>[];
	}

	/**
	 * Total duration of this entire Trajectory.
	 * @returns A duration, and a boolean representing
	 * if the last trajectory is a LinarTrajectory.
	 */
	public duration(): {duration: number, lastIsLinear: boolean} {
			let duration: number = 0;
			let lastIsLinear: boolean;
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			let currentSegment: compositeTrajectory = this;
			while (currentSegment.hasNext()) {
				duration += currentSegment.timeToNext();
				currentSegment = currentSegment.next();
			}
			if (currentSegment.current instanceof OrbitalTrajectory
				&& currentSegment.current.isClosed) {
				duration += currentSegment.current.getPeriod();
				lastIsLinear = false;
			} else {
				lastIsLinear = true;
			}

			return {duration: duration, lastIsLinear: lastIsLinear};
	}

	public timeRanges(
		startTime?: Chrono, endTime?: Chrono
	): Chrono[][] {
		return timeRanges(this, startTime, endTime);
	}

	override calculatePoints(
		startTime: Chrono | number,
		endTime: Chrono | number,
		recursions: number
	): TrajectoryState[] {
		return this.calculatePointsComposite(
			startTime, endTime, recursions, undefined, "calculatePoints"
		);
	}

	override async calculatePointsAsync(
		startTime: Chrono | number, endTime: Chrono | number,
		recursions: number, batchSize: number = 100
	): Promise<TrajectoryState[]> {
		return this.calculatePointsComposite(
			startTime, endTime, recursions, batchSize, "calculatePointsAsync"
		);
	}

	private calculatePointsComposite<T extends "calculatePoints" | "calculatePointsAsync">(
		startTime: Chrono | number, // TODO: Have this be absolute time rather than relative time
		endTime: Chrono | number,
		recursions: number,
		batchSize: number | undefined,
		variant: T
	): T extends "calculatePoints" ? TrajectoryState[] : Promise<TrajectoryState[]> {
		type returnType = T extends "calculatePoints" ? TrajectoryState[] : Promise<TrajectoryState[]>;

		const startBound = this.asRelativeTime(startTime);
		const endBound = this.asRelativeTime(endTime);
		const startChrono = this.start.time.add(startBound);
		const endChrono = this.start.time.add(endBound);
		const timeRanges = this.timeRanges(startChrono, endChrono);
		const result: returnType[] = [];

		// Insert each set of trajectory points, each clamped to
		// the correct time range for their respective trajectory
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let segment: compositeTrajectory = this;
		for (let i = 0; i < timeRanges.size(); i++) {
			const timeRange = timeRanges[i];
			result.push(
				segment.current[variant](
					timeRange[0], timeRange[1], recursions, batchSize
				) as unknown as returnType
			);

			if (i !== timeRanges.size() - 1)
				segment = segment.next();
		}

		// Destructure the result into the return type,
		// according to the result's type
		if (variant === "calculatePoints") {
			const res: TrajectoryState[] = [];
			for (const pointSet of (result as TrajectoryState[][]))
				for (const point of pointSet)
					res.push(point);
			return res as returnType;
		} else {
			const res: TrajectoryState[] = [];
			for (const promiseSet of (result as Promise<TrajectoryState[]>[]))
				for (const point of promiseSet.expect())
					res.push(point);
			return res as returnType;
		}
	}

	// Acceleration is added after trajectory change
    override atTime(delta: number, withAcceleration?: Acceleration): compositeTrajectory {
		if (this.hasNext() && this.timeToNext(delta) <= 0) {
			// target time overflows into next trajectory
			// and lands on the other side of SOI boundary
			return new CompositeTrajectory(
				(this.next() as compositeTrajectory).current
					.atTime(delta, withAcceleration),
				this.rootGravityCelestials
			);
		} else {
			// extrapolated trajectory lands on the same side of SOI boundary as before
			// or target time stays within current trajectory
			return new CompositeTrajectory(
				this.current.atTime(delta, withAcceleration),
				this.rootGravityCelestials
			);
		}
    }

	override changeVelocity(currentTime: Chrono, velocity: Vector3D): compositeTrajectory {
		return new CompositeTrajectory(
			this.current.changeVelocity(currentTime, velocity),
			this.rootGravityCelestials
		);
	}
}

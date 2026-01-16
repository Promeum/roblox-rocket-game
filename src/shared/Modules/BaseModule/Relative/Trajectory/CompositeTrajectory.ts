import Vector3D from "../../../Libraries/Vector3D";

import KinematicState from "../State/KinematicState";
import TemporalState from "../State/TemporalState";
import AccelerationState from "../State/AccelerationState";
import KinematicTemporalState from "../State/KinematicTemporalState";
import TrajectoryState from "../TrajectoryState";
import LinearState from "../TrajectoryState/LinearState";
import OrbitalState from "../TrajectoryState/OrbitalState";
import Trajectory from ".";
import LinearTrajectory from "./LinearTrajectory";
import OrbitalTrajectory from "./OrbitalTrajectory";
import GravityCelestial from "../../Celestial/GravityCelestial";

// Types

type stateType<T> = T extends OrbitalTrajectory ? OrbitalState : LinearState;
type nextTrajectoryType<T> = (T extends OrbitalTrajectory ? CompositeTrajectory<LinearTrajectory> : never) | CompositeTrajectory<OrbitalTrajectory>;
type nextTrajectoryDirectionType<T> = T extends OrbitalTrajectory ? "out" | "in" : "in";

/**
 * CompositeTrajectory wraps a linear or orbital trajectory.
 * Can lead into other CompositeTrajectories by linking forward to them.
 * Is used by PhysicsCelestials.
 */
export default class CompositeTrajectory<T extends LinearTrajectory | OrbitalTrajectory> extends Trajectory {
	declare readonly start: stateType<T>;
	public readonly currentTrajectory: T
	private timeOfNextTrajectory: TemporalState | false | undefined;
	private nextTrajectoryCache: nextTrajectoryType<T> | false | undefined;
	private nextTrajectoryDirectionCache: nextTrajectoryDirectionType<T> | false | undefined;
	private nextOrbitingCache: GravityCelestial | false | undefined;

    // Contructors

	/**
	 * Creates a new CompositeTrajectory instance.
	 */
    public constructor(currentTrajectory: T, private readonly rootGravityCelestials: GravityCelestial[]) {
        super();
		this.start = currentTrajectory.start as stateType<T>;
		this.currentTrajectory = currentTrajectory;
    }

	// Position Calculations

	public getKinematic(time: TemporalState | number): KinematicTemporalState {
		const relativeTime: number = this.asRelativeTime(time);
		if (!this.hasNextTrajectory() || this.timeToNextTrajectory(relativeTime) > 0) {
        	return this.currentTrajectory.getKinematic(relativeTime);
		} else {
			return this.nextTrajectory().getKinematic(
				relativeTime - (this.timeOfNextTrajectory as TemporalState).relativeTime
			);
		}
	}

	public calculateStateFromTime(time: TemporalState | number): TrajectoryState {
		const relativeTime: number = this.asRelativeTime(time);
		if (!this.hasNextTrajectory() || this.timeToNextTrajectory(relativeTime) > 0) {
        	return this.currentTrajectory.calculateStateFromTime(relativeTime);
		} else {
			return this.nextTrajectory().calculateStateFromTime(
				relativeTime - (this.timeOfNextTrajectory as TemporalState).relativeTime
			);
		}
	}

	public calculateStateFromPoint(position: Vector3D): stateType<T> {
		return this.currentTrajectory.calculateStateFromPoint(position) as stateType<T>;
	}

	public calculateStateFromMagnitude(magnitude: number): stateType<T> {
		return this.currentTrajectory.calculateStateFromMagnitude(magnitude) as stateType<T>;
	}

    // Methods

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
			this.nextTrajectoryFromOrbital();
			return this.hasNextTrajectory();
		} else {
			// LinearTrajectory
			this.nextTrajectoryFromLinear();
			return this.hasNextTrajectory();
		}
    }

	private nextTrajectoryFromOrbital(): void {
		assert(this.currentTrajectory instanceof OrbitalTrajectory);
		// const selfPosition: KinematicState = this.startPosition.kinematicState;
		let closestSOIEntryTime: TemporalState | false = false;
		let closestCelestialSOI: GravityCelestial | undefined | false = false;
		let nextTrajectoryDirection: "in" | "out" | false = false;

		if ( // check if exiting out of current SOI
			!this.currentTrajectory.hasApoapsis()
			|| (
				this.currentTrajectory.hasApoapsis()
				&& this.currentTrajectory.getApoapsis().getKinematic().getPosition().magnitude() > this.currentTrajectory.orbiting.SOIRadius
			)
		) {
			// calculateStateFromMagnitude()-based finder
			const SOIExit = this.currentTrajectory.calculateStateFromMagnitude(this.currentTrajectory.orbiting.SOIRadius);
			closestSOIEntryTime = SOIExit.getKinematic().temporalState;

if (closestSOIEntryTime !== closestSOIEntryTime) closestSOIEntryTime = false
// this._testpart(
// 	"SOI exit",
// 	new BrickColor("Bright reddish lilac").Color,
// 	0.6,
// 	SOIExit.getKinematic().getAbsolutePosition(),
// 	game.Workspace
// )

// print(SOIExit)
// print(calcSOIExit)
// assert(SOIExit.trueAnomaly === calcSOIExit.trueAnomaly, "trueAnomaly mismatched by "+(calcSOIExit.trueAnomaly - SOIExit.trueAnomaly))
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
		if (this.currentTrajectory.orbiting.childGravityCelestials.size() > 0) {
			warn("CompositeTrajectory moid attempt")
			// calculate SOI entry for all root GravityCelestials
			for (const gravityCelestial of this.currentTrajectory.orbiting.childGravityCelestials) {
				assert(gravityCelestial.trajectory instanceof OrbitalTrajectory)

				// get earliest valid (time >= 0) SOI entry time
				// subtract 0.5 to ensure SOI is not exited immediately
				const intersection = this.currentTrajectory.orbitalIntersection(
					gravityCelestial.trajectory, gravityCelestial.SOIRadius - 0.5);
				const entry = intersection !== false ? intersection[0] : false;
print("start time:")
				if (entry !== false) {
					// set new closest (or keep current closest) SOI
					const SOIEntryTime = entry.time;
print(SOIEntryTime)
					if (closestSOIEntryTime === false || SOIEntryTime.lessThan(closestSOIEntryTime)) {
						closestSOIEntryTime = SOIEntryTime;
						closestCelestialSOI = gravityCelestial;
						nextTrajectoryDirection = "in";
					}
				}
else print("[none found]")
			}
		}

		if (closestSOIEntryTime !== false) { // trajectory exits the current SOI
			assert(closestCelestialSOI !== false);
			this.timeOfNextTrajectory = closestSOIEntryTime;
			this.nextTrajectoryDirectionCache = nextTrajectoryDirection as nextTrajectoryDirectionType<T> | false;
			this.nextOrbitingCache = closestCelestialSOI;
			if (this.nextTrajectoryDirectionCache === "out") {
				// Trajectory going into outer SOI
				const newKinematicState: KinematicTemporalState = this.currentTrajectory
					.calculateStateFromTime(closestSOIEntryTime).getKinematic().consolidateKinematic();

				if (!closestCelestialSOI) {
					// No outer SOI exists,
					// Trajectory exiting into linear trajectory
					this.nextTrajectoryCache = new CompositeTrajectory<LinearTrajectory>(
						new LinearTrajectory(
							newKinematicState
						), this.rootGravityCelestials
					) as nextTrajectoryType<T>;
				} else {
					// Outer SOI exists,
					// Trajectory exiting into orbital trajectory
					assert(closestCelestialSOI !== undefined)
					this.nextTrajectoryCache = new CompositeTrajectory<OrbitalTrajectory>(
						new OrbitalTrajectory(
							newKinematicState,
							closestCelestialSOI
						), this.rootGravityCelestials
					) as nextTrajectoryType<T>;
				}
			} else {
				// Trajectory going into inner SOI
				// and is guaranteed an orbital trajectory
				assert(closestCelestialSOI !== undefined);
				const futureOrbitingState = closestCelestialSOI
					.trajectory.getKinematic(closestSOIEntryTime);
				const futureThisState = this.currentTrajectory.getKinematic(this.timeOfNextTrajectory);
				const startState = new KinematicTemporalState(
					new KinematicState(
						futureThisState.getPosition().sub(futureOrbitingState.getPosition()),
						futureThisState.getVelocity().sub(futureOrbitingState.getVelocity()),
						futureOrbitingState.kinematicState
					),
					futureThisState.temporalState
				);
this._testpart(
	"SOI entry last trajectory (pre-instantiation)",
	new BrickColor("Neon orange").Color,
	Vector3D.one.mul(1),
	startState.consolidateOnce().getPosition().mul(1/6371.01e3),
	game.Workspace,
	Enum.PartType.Ball
)
// this._testpart(
// 	"real start of new trajectory",
// 	new BrickColor("Brick yellow").Color,
// 	0.4,
// 	newKinematicState.getPosition(),
// 	game.Workspace
// )
				this.nextTrajectoryCache = new CompositeTrajectory<OrbitalTrajectory>(
					new OrbitalTrajectory(
						startState,
						closestCelestialSOI
					), this.rootGravityCelestials
				);
			}
		} else { // trajectory stays within current SOI
			this.timeOfNextTrajectory = false;
			this.nextTrajectoryCache = false;
			this.nextTrajectoryDirectionCache = false;
			this.nextOrbitingCache = false;
		}
print("\tnext is "+(this.nextTrajectoryCache === false ? "[none]" : (this.nextTrajectoryCache as CompositeTrajectory<OrbitalTrajectory | LinearTrajectory>).currentTrajectory instanceof OrbitalTrajectory ? "orbital" : "linear"))
if (this.nextTrajectoryCache){
	print(`\tstart time: ${this.timeOfNextTrajectory instanceof TemporalState ? this.timeOfNextTrajectory.getAbsoluteTime() : error("5hruirft")}`)
	print(`\torbiting next: ${this.nextOrbitingCache !== false ? this.nextOrbitingCache?.name ?? "[none]" : "[none]"}`)
}
	}

	private nextTrajectoryFromLinear(): void {
		assert(this.currentTrajectory instanceof LinearTrajectory
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
				let result: LinearState | false = this.currentTrajectory
					.orbitalIntersection(celestial.trajectory, celestial.SOIRadius)[0] ?? false;
				if (!result || result.time.relativeTime < 0)
					result = false;

				// set new closest (or keep current closest) SOI
				if (result !== false
					&& (
						closestSOIEntry === false
						|| result.time.relativeTime < closestSOIEntry.time.relativeTime
					)) {
					closestSOIEntry = result;
					closestGravityCelestial = celestial;
				}
			}

			// trajectory enters an SOI
			if (closestSOIEntry !== false) {
				this.timeOfNextTrajectory = closestSOIEntry.time;
				this.nextTrajectoryDirectionCache = "in";
				this.nextOrbitingCache = closestGravityCelestial as GravityCelestial;
				const newKinematic: KinematicState = (closestSOIEntry.trajectory.start as LinearState)
				.kinematics.matchRelative(
					closestSOIEntry.kinematics
				);
				// A linear trajectory can only enter into an orbital trajectory,
				// never another linear trajectory
				this.nextTrajectoryCache = new CompositeTrajectory<OrbitalTrajectory>(
					new OrbitalTrajectory(
						newKinematic.position,
						newKinematic.velocity,
						closestSOIEntry.time,
						this.nextOrbitingCache
					), this.rootGravityCelestials
				);
			} else { // trajectory misses all root GravityCelestial SOIs
				this.timeOfNextTrajectory = false;
				this.nextTrajectoryCache = false;
				this.nextTrajectoryDirectionCache = false;
				this.nextOrbitingCache = false;
			}
		} else { // no root GravityCelestials exist (i.e. space is empty)
			this.timeOfNextTrajectory = false;
			this.nextTrajectoryCache = false;
			this.nextTrajectoryDirectionCache = false;
			this.nextOrbitingCache = false;
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

		if (this.nextOrbitingCache === undefined) {
			this.hasNextTrajectory();
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
		if (this.nextTrajectoryCache === false)
			error("CompositeTrajectory nextSOI() cannot be called with no nextTrajectory");
		if (this.nextOrbitingCache === false)
			error("CompositeTrajectory nextSOI() cannot be called if not entering a new SOI");

		if (this.nextOrbitingCache === undefined) {
			this.hasNextTrajectory();
			return this.nextSOI();
		} else {
			return this.nextOrbitingCache;
		}
	}

	/**
	 * Computes the location of closest approach of this and another Trajectory in spacetime.
	 * @param other The CompositeTrajectory of the other body.
	 * @returns The KinematicTemporalState representing the MOID position, pointing from self to other.
	 */
    override MOID(other: T): stateType<T>[] {
        if (this.currentTrajectory instanceof OrbitalTrajectory !== other instanceof OrbitalTrajectory)
			error("CompositeTrajectory MOID() argument differs from this.currentTrajectory");
		else if ((this.currentTrajectory as OrbitalTrajectory)?.orbiting !== (other as OrbitalTrajectory)?.orbiting)
			error("CompositeTrajectory MOID() other trajectory is not in the same SOI as this trajectory " + `(${this.currentTrajectory} !== ${other})`);

		return this.currentTrajectory.MOID(other as OrbitalTrajectory & LinearTrajectory) as stateType<T>[];
    }

	override orbitalIntersection(other: T, distance: number): stateType<T>[] {
        if (this.currentTrajectory instanceof OrbitalTrajectory !== other instanceof OrbitalTrajectory)
			error("CompositeTrajectory orbitalIntersection() argument differs from this.currentTrajectory");
		else if ((this.currentTrajectory as OrbitalTrajectory)?.orbiting !== (other as OrbitalTrajectory)?.orbiting)
			error("CompositeTrajectory orbitalIntersection() other trajectory is not in the same SOI as this trajectory " + `(${this.currentTrajectory} !== ${other})`);

		return this.currentTrajectory.orbitalIntersection(other as OrbitalTrajectory & LinearTrajectory, distance) as stateType<T>[];
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
			let currentSegment: CompositeTrajectory<LinearTrajectory | OrbitalTrajectory> = this;
			while (currentSegment.hasNextTrajectory()) {
				duration += currentSegment.timeToNextTrajectory();
				currentSegment = currentSegment.nextTrajectory();
			}
			if (currentSegment.currentTrajectory instanceof OrbitalTrajectory
				&& currentSegment.currentTrajectory.isClosed) {
				duration += currentSegment.currentTrajectory.getPeriod();
				lastIsLinear = false;
			} else {
				lastIsLinear = true;
			}

			return {duration: duration, lastIsLinear: lastIsLinear};
	}

	override calculatePoints(
		startTime: TemporalState | number,
		endTime: TemporalState | number,
		recursions: number
	): TrajectoryState[] {
		return this.calculatePointsComposite(
			startTime, endTime, recursions, undefined, "calculatePoints"
		);
	}

	override async calculatePointsAsync(
		startTime: TemporalState | number, endTime: TemporalState | number,
		recursions: number, batchSize: number = 100
	): Promise<TrajectoryState[]> {
		return this.calculatePointsComposite(
			startTime, endTime, recursions, batchSize, "calculatePointsAsync"
		);
	}

	private calculatePointsComposite<T extends "calculatePoints" | "calculatePointsAsync">(
		startTime: TemporalState | number,
		endTime: TemporalState | number,
		recursions: number,
		batchSize: number | undefined,
		variant: T
	): T extends "calculatePoints" ? TrajectoryState[] : Promise<TrajectoryState[]> {
		const startBound = this.asRelativeTime(startTime);
		const endBound = this.asRelativeTime(endTime);
		const startTemporal = this.start.time.withIncrementTime(startBound);
		const endTemporal = this.start.time.withIncrementTime(endBound);
		const timeRanges = this.timeRanges(startTemporal, endTemporal);
		const result: (T extends "calculatePoints" ? TrajectoryState[] : Promise<TrajectoryState[]>)[] = [];

		// Insert each set of trajectory points, each clamped to
		// the correct time range for their respective trajectory
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let segment: CompositeTrajectory<LinearTrajectory | OrbitalTrajectory> = this;
		for (let i = 0; i < timeRanges.size(); i++) {
			const timeRange = timeRanges[i];
			if (timeRange !== undefined) {
				result.push(
					segment.currentTrajectory[variant](
						timeRange[0], timeRange[1],
						recursions, batchSize
					) as unknown as T extends "calculatePoints" ? TrajectoryState[] : Promise<TrajectoryState[]>
				);
			}

			if (i !== timeRanges.size() - 1)
				segment = segment.nextTrajectory();
		}

		// Destructure the result into the return type,
		// according to the result's type
		if (variant === "calculatePoints") {
			const res: TrajectoryState[] = [];
			for (const pointSet of result as TrajectoryState[][]) {
				for (const point of pointSet) {
					res.push(point);
				}
			}
			return res as T extends "calculatePoints" ? TrajectoryState[] : Promise<TrajectoryState[]>;
		} else {
			const res: TrajectoryState[] = [];
			for (const promiseSet of result as Promise<TrajectoryState[]>[]) {
				for (const point of promiseSet.expect()) {
					res.push(point);
				}
			}
			return res as T extends "calculatePoints" ? TrajectoryState[] : Promise<TrajectoryState[]>;
		}
	}

	/** Time ranges of all trajectories, clamped to the provided arguments */
	public timeRanges(
		startTime?: TemporalState, endTime?: TemporalState
	): (TemporalState[] | undefined)[] {
		const timeRangesBase = this.timeRangesBase();
		const timeRanges: (TemporalState[] | undefined)[] = [];
		const startBound = startTime ?? timeRangesBase[0][0];
		const endBound = endTime ?? timeRangesBase[timeRangesBase.size() - 1][1];

		for (let i = 0; i < timeRangesBase.size(); i++) {
			// Show a segment only within the valid time range
			if (
				startBound.lessThan(timeRangesBase[i][1])
				&& timeRangesBase[i][0].lessThan(endBound)
			) {
				const newTimeRange: TemporalState[] = [];
				// Segment is partitioned by startTime
				if (timeRangesBase[i][0].lessThan(startBound)) {
					newTimeRange.push(startBound);
				} else {
					newTimeRange.push(timeRangesBase[i][0]);
				}
				// Segment is partitioned by endTime
				if (endBound.lessThan(timeRangesBase[i][1])) {
					newTimeRange.push(endBound);
				} else {
					newTimeRange.push(timeRangesBase[i][1]);
				}
				timeRanges[i] = newTimeRange;
			} else { // Segment completely out of time range
				timeRanges[i] = undefined;
			}
		}

		return timeRanges;
	}

	/** Broadest time ranges of all trajectories */
	public timeRangesBase(): TemporalState[][] {
		const timeRangesBase: TemporalState[][] = [];

		// Create the segments with broadest possible time ranges
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let segment: CompositeTrajectory<LinearTrajectory | OrbitalTrajectory> = this;

		// Segments which lead into other segments
		while (segment.hasNextTrajectory()) {
			const nextSegment = segment.nextTrajectory();
			const startTime = segment.start.time;
			const endTime = nextSegment.start.time;

			timeRangesBase.push([startTime, endTime]);
			segment = nextSegment;
		}

		// The final segment
		if (segment.currentTrajectory instanceof LinearTrajectory) {
			const startTime = segment.start.time;
			// draw up to a very high altitude
			const endTime = segment.calculateStateFromMagnitude(1e12).time;

			timeRangesBase.push([startTime, endTime]);
		} else {
			const startTime = segment.start.time;
			let endTime: TemporalState;
			if (segment.currentTrajectory.isClosed) { // draw one orbit
				endTime = segment.start.time
					.withIncrementTime(segment.currentTrajectory.getPeriod());
			} else { // draw up to a very high altitude
				endTime = segment.currentTrajectory
					.calculateStateFromMagnitude(1e12).time;
			}

			timeRangesBase.push([startTime, endTime]);
		}

		return timeRangesBase;
	}

	// Acceleration is added after trajectory change
    override atTime(delta: number, withAcceleration?: AccelerationState): CompositeTrajectory<LinearTrajectory | OrbitalTrajectory> {
		if (this.hasNextTrajectory() && this.timeToNextTrajectory(delta) <= 0) {
			// target time overflows into next trajectory
			// and lands on the other side of SOI boundary
			return new CompositeTrajectory(
				(this.nextTrajectory() as CompositeTrajectory<LinearTrajectory | OrbitalTrajectory>)
				.currentTrajectory.atTime(delta, withAcceleration), this.rootGravityCelestials
			);
		} else {
			// extrapolated trajectory lands on the same side of SOI boundary as before
			// or target time stays within current trajectory
			return new CompositeTrajectory(
				this.currentTrajectory.atTime(delta, withAcceleration), this.rootGravityCelestials
			);
		}
    }

	override deepClone(): CompositeTrajectory<T> {
		return new CompositeTrajectory<T>(this.currentTrajectory.deepClone() as T, this.rootGravityCelestials);
	}
}

// import { $assert, $error } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";
import * as Constants from "shared/Constants";
import BaseModule from "..";
import KinematicState from "../Relative/State/KinematicState";
import TemporalState from "../Relative/State/TemporalState";
import KinematicTemporalState from "../KinematicTemporalState";
import AccelerationState from "../Relative/State/AccelerationState";
import GravityCelestial from "../Relative/Celestial/GravityCelestial";

/**
 * Trajectory represents a trajectory in spacetime with kinematic and temporal components.
 */
export default abstract class Trajectory extends BaseModule {
	public readonly startPosition: KinematicTemporalState;
	protected timeOfNextTrajectory: TemporalState | false | undefined;
	protected nextTrajectoryCache: Trajectory | false | undefined;
	protected nextTrajectoryDirectionCache: "in" | "out" | false | undefined;
	protected nextSOICache: GravityCelestial | false | undefined;

	// Constructors

	/**
	 * Creates a new Trajectory instance.
	 */
	protected constructor(kinematicState: KinematicState, temporalState: TemporalState)

	/**
	 * Creates a new Trajectory instance from a KinematicTemporalState.
	 */
	protected constructor(kinematicTemporalState: KinematicTemporalState)

	protected constructor(arg1: KinematicState | KinematicTemporalState, arg2?: TemporalState) {
		let startPosition: KinematicTemporalState;

		if (arg1 instanceof KinematicState) { // Constructor 1
			assert(arg2 instanceof TemporalState)
			startPosition = new KinematicTemporalState(arg1, arg2);
		} else { // Constructor 2
			startPosition = arg1;
		}

		super();
		this.startPosition = startPosition;
	}

	// Methods

	/**
	 * Returns whether this Trajectory leads into a new Trajectory (in a new SOI).
	 * Caches results.
	 * @returns true if there is a next Trajectory
	 */
	public abstract hasNextTrajectory(): boolean

	/**
	 * Returns the next Trajectory.
	 * Otherwise, if there is no trajectory, throws an error.
	 * @returns The next Trajectory
	 */
	public nextTrajectory(): Trajectory {
		if (this.nextTrajectoryCache === false)
			error("Trajectory nextTrajectory() cannot be called on a Trajectory with no nextTrajectory");

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
	 * @returns A TemporalState relative to the start position
	 */
	public timeToNextTrajectory(relativeTime: number = 0): number {
		if (this.timeOfNextTrajectory === false)
			error("Trajectory timeToNextTrajectory() cannot be called on a Trajectory with no nextTrajectory");

		if (this.timeOfNextTrajectory === undefined) {
			this.hasNextTrajectory();
			return this.timeToNextTrajectory(relativeTime);
		} else {
			return this.timeOfNextTrajectory.relativeTime - relativeTime;
		}
	}

	/**
	 * Returns if this Trajectory goes into, or out of, an SOI.
	 * Otherwise, if there is no next trajectory, throws an error.
	 * @returns The next Trajectory
	 */
	public nextTrajectoryDirection(): "in" | "out" {
		if (this.nextTrajectoryDirectionCache === false)
			error("Trajectory nextTrajectoryDirection() cannot be called on a Trajectory with no nextTrajectory");

		if (this.nextTrajectoryDirectionCache === undefined) {
			this.hasNextTrajectory();
			return this.nextTrajectoryDirection();
		} else {
			return this.nextTrajectoryDirectionCache;
		}
	}

	/**
	 * Returns whether this Trajectory leads into a new SOI
	 * around a GravityCelestial.
	 * Caches results.
	 * @returns true if there is a next SOI
	 */
	public entersNewSOI(): boolean {
		if (this.nextTrajectoryCache === false)
			error("Trajectory entersNewSOI() cannot be called on a Trajectory with no nextTrajectory");

		if (this.nextSOICache === undefined) {
			this.hasNextTrajectory();
			return this.entersNewSOI();
		} else {
			return this.nextSOICache !== false;
		}
	}

	/**
	 * Returns the next GravityCelestial whose SOI this Celestial is entering.
	 * Otherwise, if there is no next trajectory, throws an error.
	 * @returns The next GravityCelestial
	 */
	public nextSOI(): GravityCelestial {
		if (this.nextTrajectoryCache === false)
			error("Trajectory nextSOI() cannot be called on a Trajectory with no nextTrajectory");
		if (this.nextSOICache === false)
			error("Trajectory nextSOI() cannot be called on a Trajectory not entering a new SOI");

		if (this.nextSOICache === undefined) {
			this.hasNextTrajectory();
			return this.nextSOI();
		} else {
			return this.nextSOICache;
		}
	}

	/**
	 * Computes the location of closest approach of this and another Trajectory in spacetime.
	 * @param trajectory The trajectory of the other body.
	 * @param searchTimeMin The minimum time to search.
	 * @param searchTimeMax The maximum time to search.
	 */
	public abstract MOID(other: Trajectory): KinematicTemporalState

	/**
	 * Calculates the point at which this Trajectory will reach relativeTime seconds from now.
	 * Note: relativeTime can be negative.
	 * @param relativeTime The time relative to this trajectory
	 * @returns The kinematic state at that time
	 */
	public abstract calculatePointFromTime(relativeTime: number): KinematicState

	/**
	 * Calculates the position at which this LinearTrajectory will reach relativeTime seconds from now.
	 * Note: relativeTime can be negative.
	 * @param relativeTime The time passed since the location of this Trajectory.
	 * @returns The kinematic temporal state at that time
	 */
	public calculatePositionFromTime(relativeTime: number): KinematicTemporalState {
		return new KinematicTemporalState(
			this.calculatePointFromTime(relativeTime),
			new TemporalState(relativeTime, this.startPosition.temporalState)
		);
	}

	/**
	 * Calculates the time until the craft reaches a specific point on this Trajectory.
	 * Times are relative to this Trajectory.
	 * Time may be negative if the current orbit is hyperbolic.
	 * https://www.desmos.com/3d/rfndgd4ppj
	 * @param position The position to be reached
	 * @returns The time to reach that position
	 */
	public abstract calculateTimeFromPoint(position: Vector3D): number

	/**
	 * Calculates the KinematicTemporalState of closest approach to position.
	 * Times are relative to this Trajectory.
	 * Calculated time may be negative if the current orbit is hyperbolic.
	 * https://www.desmos.com/3d/rfndgd4ppj
	 * @param position The position to be reached
	 * @returns The kinematic temporal state at closest approach
	 */
	public calculatePositionFromPoint(position: Vector3D): KinematicTemporalState {
		const timeFromPoint: number = this.calculateTimeFromPoint(position);

		return new KinematicTemporalState(
			this.calculatePointFromTime(timeFromPoint),
			this.startPosition.temporalState.withRelativeTime(timeFromPoint)
		);
	}

	/**
	 * Calculates the time the craft reaches a specific altitude/magnitude on this Trajectory.
	 * Times are relative to this Trajectory.
	 * Time can be either negative or positive if the trajectory is a hyperbola, or only positive if the orbit is closed.
	 * https://www.desmos.com/3d/rfndgd4ppj
	 * @param magnitude The altitude/magnitude to reach
	 * @returns The time to reach that magnitude
	 */
	public abstract calculateTimeFromMagnitude(magnitude: number): number

	/**
	 * Calculates a new KinematicState at a given altitude/magnitude on this Trajectory.
	 * https://www.desmos.com/3d/rfndgd4ppj
	 * @param magnitude The altitude/magnitude to reach
	 * @returns The kinematic state at that magnitude
	 */
	public calculatePointFromMagnitude(magnitude: number): KinematicState {
		return this.calculatePointFromTime(this.calculateTimeFromMagnitude(magnitude));
	}

	/**
	 * Calculates a new KinematicTemporalState at a given altitude/magnitude on this Trajectory.
	 * https://www.desmos.com/3d/rfndgd4ppj
	 * @param magnitude The altitude/magnitude to reach
	 * @returns The kinematic temporal state at that magnitude
	 */
	public calculatePositionFromMagnitude(magnitude: number): KinematicTemporalState {
		return this.calculatePositionFromTime(this.calculateTimeFromMagnitude(magnitude));
	}

	/**
	 * Clones and increments this Trajectory in time,
	 * by repeatedly calling step().
	 * Note: Checks for SOI changes.
	 * @param delta The change in time.
	 * @param recursions The number of times to step this Trajectory.
	 * @param withAcceleration Adds an acceleration to this Trajectory, modifying the trajectory
	 * @returns The incremented trajectory
	 */
	public increment(delta: number, recursions: number = 1, withAcceleration?: AccelerationState): Trajectory {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let newTrajectory: Trajectory = this;

		for (let recursion = 1; recursion <= recursions; recursion++)
			newTrajectory = newTrajectory.step(delta * recursion, withAcceleration);

		return newTrajectory;
	}

	/**
	 * Clones and increments this Trajectory in time, then returns the result.
	 * Note: Checks for SOI changes.
	 * @param delta The change in time. Is most accurate with small values.
	 * @param withAcceleration Adds an acceleration to this Trajectory, modifying the trajectory
	 * @returns The incremented trajectory
	 */
	public abstract step(delta: number, withAcceleration?: AccelerationState): Trajectory

	/**
	 * Clones and increments this Trajectory in time, then returns the result.
	 * Note: Does NOT check for SOI changes.
	 * @param delta The change in time
	 * @param withAcceleration Adds an acceleration to this Trajectory, modifying the trajectory
	 * @returns The incremented trajectory
	 */
	protected abstract atTime(delta: number, withAcceleration?: AccelerationState): Trajectory

	/**
	 * Calculates a trajectory as a series of points.
	 * @param delta The change in time
	 * @param recursions The number of points to calculate
	 * @returns Array of kinematic temporal states representing the trajectory points
	 */
	public calculatePoints(delta: number, recursions: number): KinematicTemporalState[] {
		const points: KinematicTemporalState[] = [];

		for (let i = 1; i <= recursions; i++)
			points.push(this.calculatePositionFromTime(delta * i));

		return points;
	}

	/**
	 * Creates and displays a trajectory / orbit line.
	 * @param delta The change in time
	 * @param recursions The number of points to calculate
	 * @param width The width of the trajectory line
	 * @returns Folder containing the trajectory visualization
	 */
	public displayTrajectory(delta: number, recursions: number, width: number): Folder {
		if (delta <= 0 || recursions < 1 || width < 0)
			error("Trajectory displayTrajectory() Invalid parameter(s)");

		const trajectory: KinematicTemporalState[] = this.calculatePoints(delta, recursions);

		// make all of the attachments
		const attachments: Attachment[] = [];

		for (let i = 0; i < trajectory.size(); i++) {
			const newPoint: KinematicTemporalState = trajectory[i];
			const newAttachment: Attachment = new Instance("Attachment");

			newAttachment.Name = `${i + 1}`;
			newAttachment.Position = newPoint.getAbsolutePosition().mul(Constants.SOLAR_SYSTEM_SCALE).toVector3();

			attachments.push(newAttachment);
		}

		// make all of the beams
		const beams: Beam[] = [];

		// const width: number = this.OrbitingBody ? (math.log10(this.OrbitingBody.SOIRadius/50e6))/10 : 0.3

		for (let i = 1; i < attachments.size(); i++) {
			const attachment0: Attachment = attachments[i - 1];
			const attachment1: Attachment = attachments[i];
			const newBeam: Beam = new Instance("Beam");

			newBeam.Attachment0 = attachment0;
			newBeam.Attachment1 = attachment1;
			newBeam.Width0 = width;
			newBeam.Width1 = width;
			newBeam.FaceCamera = true;
			newBeam.Color = new ColorSequence(Color3.fromRGB(97, 97, 97));
			newBeam.Transparency = new NumberSequence(0.8)
			newBeam.Name = `${i + 1}`;

			beams.push(newBeam);
		}

		// add everything to workspace in a nice file hierarchy

		// attachments
		const trajectoryFolder: Folder = new Instance("Folder");
		trajectoryFolder.Name = "TrajectoryLine";

		const attachmentFolder: Part = new Instance("Part");
		attachmentFolder.CanCollide = false;
		attachmentFolder.Transparency = 1;
		attachmentFolder.Size = new Vector3(0, 0, 0);
		attachmentFolder.Position = new Vector3(0, 0, 0);
		attachmentFolder.Name = "Attachments";

		for (let i = 0; i < attachments.size(); i++) {
			const attachment = attachments[i];
			attachment.Parent = attachmentFolder;
		}

		attachmentFolder.Parent = trajectoryFolder;

		// beams
		const beamFolder: Folder = new Instance("Folder");
		beamFolder.Name = "Beams";


		for (let i = 0; i < beams.size(); i++) {
			const beam = beams[i];
			beam.Parent = beamFolder;
		}

		beamFolder.Parent = trajectoryFolder;

		// Weld attachmentFolder to a GravityCelestial so the displayed line will move along with it
		// if (this.OrbitingBody) {
		// 	const weld: WeldConstraint = new Instance("WeldConstraint");
		// 	weld.Part0 = attachmentFolder;
		// 	weld.Part1 = this.OrbitingBody.RootPart;
		// 	weld.Parent = attachmentFolder;
		// }
		// trajectoryFolder.Parent = workspace.Orbits

		return trajectoryFolder;
	}
}

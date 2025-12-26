// import { $assert, $error } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";
// import Thread from "shared/Modules/Libraries/Thread";
import BaseModule from "..";
import KinematicState from "../Relative/State/KinematicState";
import TemporalState from "../Relative/State/TemporalState";
import KinematicTemporalState from "../Relative/State/KinematicTemporalState";
import AccelerationState from "../Relative/State/AccelerationState";
import CelestialState from "../CelestialState";
import type Celestial from "../Relative/Celestial";
import * as Constants from "shared/Constants";

/**
 * Trajectory represents a trajectory in spacetime with kinematic and temporal components.
 */
export default abstract class Trajectory extends BaseModule {
	public readonly celestial: Celestial
	public readonly initialPosition: CelestialState;

	// Constructors

	/**
	 * Creates a new Trajectory instance.
	 */
	protected constructor(initialPosition: CelestialState);

	/**
	 * Creates a new Trajectory instance.
	 */
	protected constructor(initialPosition: KinematicTemporalState, celestial: Celestial);

	protected constructor(arg1: KinematicTemporalState | CelestialState, arg2?: Celestial) {
		super();

		if (arg1 instanceof CelestialState) {
			this.celestial = arg1.celestial;
			this.initialPosition = arg1;
		} else {
			assert(arg2);
			this.celestial = arg2;
			this.initialPosition = new CelestialState(
				arg1,
				arg2
			);
		}
	}

	// Methods

	/**
	 * Computes the location of closest approach of this and another Trajectory in spacetime.
	 * @param trajectory The trajectory of the other body.
	 * @param searchTimeMin The minimum time to search.
	 * @param searchTimeMax The maximum time to search.
	 */
	public abstract MOID(other: Trajectory): CelestialState

	/**
	 * Calculates the point at which this Trajectory will reach relativeTime seconds from now.
	 * Note: relativeTime can be negative.
	 * @param relativeTime The time relative to this trajectory
	 * @returns The kinematic state at that time
	 */
	public abstract calculatePointFromTime(relativeTime: number): KinematicState

	/**
	 * Calculates the position at which this Trajectory will reach relativeTime seconds from now.
	 * Note: relativeTime can be negative.
	 * @param relativeTime The time passed since the location of this Trajectory.
	 * @returns The CelestialState at that time. The internal Kinematic and Temporal states
	 * are each relative to the initialPosition of this trajectory.
	 */
	public calculatePositionFromTime(relativeTime: number): CelestialState {
		return new CelestialState(
			new KinematicTemporalState(
				this.calculatePointFromTime(relativeTime),
				new TemporalState(relativeTime, this.initialPosition.kinematicPosition.temporalState)
			),
			this.celestial
		);
	}

	/**
	 * Calculates the absolute position (with calculated relative positions) at relativeTime.
	 * @param relativeTime The time passed since the location of this Trajectory.
	 * @returns The CelestialState at that time. The internal Kinematic and Temporal states
	 * are each relative to the initialPosition of this trajectory.
	 */
	public calculateAbsolutePositionFromTime(relativeTime: number): CelestialState {
		return this.calculatePositionFromTime(relativeTime);
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
	public calculatePositionFromPoint(position: Vector3D): CelestialState {
		const timeFromPoint: number = this.calculateTimeFromPoint(position);

		return new CelestialState(
			new KinematicTemporalState(
				this.calculatePointFromTime(timeFromPoint),
				this.initialPosition.kinematicPosition.temporalState.withRelativeTime(timeFromPoint)
			),
			this.celestial
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
	public calculatePositionFromMagnitude(magnitude: number): CelestialState {
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
			newTrajectory = newTrajectory.atTime(delta * recursion, withAcceleration);

		return newTrajectory;
	}

	/**
	 * Clones and increments this Trajectory in time, then returns the result.
	 * Note: Does NOT check for SOI changes.
	 * @param delta The change in time. Is most accurate with small values.
	 * @param withAcceleration Adds an acceleration to this Trajectory, modifying the trajectory
	 * @returns The incremented trajectory
	 */
	public abstract atTime(delta: number, withAcceleration?: AccelerationState): Trajectory

	/**
	 * Calculates a trajectory as a series of points.
	 * @param delta The change in time
	 * @param recursions The number of points to calculate
	 * @returns Array of CelestialStates representing the trajectory points
	 */
	public calculatePoints(delta: number, recursions: number): CelestialState[] {
		const points: CelestialState[] = [];

		// const threads: Thread[] = [];
		for (let i = 1; i <= recursions; i++) {
			// const newThread: Thread = Thread.create(() => this.calculatePositionFromTime(delta * i), player);
			// newThread.start().Event.Once((result) => points[i] = result);
			const arg = this.calculatePositionFromTime(delta * i);
			points.push(arg);
		}

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
// debug.profilebegin("calculateDisplayPoints");
// const calcPointsS = os.clock();
		const trajectory: CelestialState[] = this.calculatePoints(delta, recursions);
// const calcPointsE = os.clock();
// debug.profileend();
// print("BENCHMARK RESULTS calcPoints: " + (calcPointsE - calcPointsS))

		// make all of the attachments
		const attachments: Attachment[] = [];

		const nameLength = `${trajectory.size() - 1}`.size();
		for (let i = 0; i < trajectory.size(); i++) {
			const newPoint: KinematicTemporalState = trajectory[i].kinematicPosition;
			const newAttachment: Attachment = new Instance("Attachment");

			newAttachment.Name = `%${nameLength}d`.format(i + 1);
			newAttachment.Position = newPoint.getPosition().mul(Constants.SOLAR_SYSTEM_SCALE).toVector3();

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
			newBeam.Segments = 1;
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
		attachmentFolder.Anchored = true;
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

// debug trajectory start point
this._testpart(
	"STARTPART",
	new BrickColor("Bright red").Color,
	0.3,
	trajectory[0].kinematicPosition.getAbsolutePosition(),
	trajectoryFolder
)

		// beams
		const beamFolder: Folder = new Instance("Folder");
		beamFolder.Name = "Beams";

		for (let i = 0; i < beams.size(); i++) {
			const beam = beams[i];
			beam.Parent = beamFolder;
		}

		beamFolder.Parent = trajectoryFolder;
		return trajectoryFolder;
	}
}

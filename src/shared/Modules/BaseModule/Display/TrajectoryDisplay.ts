import Vector3D from "shared/Modules/Libraries/Vector3D";

import Chrono from "../Chrono";
import Trajectory from "../Relative/Trajectory";
import LinearTrajectory from "../Relative/Trajectory/LinearTrajectory";
import OrbitalTrajectory from "../Relative/Trajectory/OrbitalTrajectory";
import Display from ".";

type displayFolder = Folder & {
	Attachments: Part
	Beams: Folder
}

/**
 * Displays a Linear or Orbital Trajectory centered at the origin.
 */
export default class TrajectoryDisplay<T extends LinearTrajectory | OrbitalTrajectory> extends Display {
	private static displayFolderBase: displayFolder;
	private static beamBaseBase: Beam;

	// Initialize displayFolderBase
	static {
		this.displayFolderBase = new Instance("Folder") as displayFolder;
		this.displayFolderBase.Name = "TrajectoryDisplay";
		this.beamBaseBase = new Instance("Beam");
		this.beamBaseBase.Segments = 1;
		this.beamBaseBase.FaceCamera = true;
		this.beamBaseBase.Transparency = new NumberSequence(0.4);
		const attachments = new Instance("Part");
		attachments.Name = "Attachments";
		attachments.Anchored = true;
		attachments.CanCollide = false;
		attachments.Size = Vector3.zero;
		attachments.Transparency = 1;
		attachments.Parent = this.displayFolderBase;
		const beams = new Instance("Folder");
		beams.Name = "Beams";
		beams.Parent = this.displayFolderBase;
	}

	declare displayFolder: displayFolder;
	public readonly trajectory: Trajectory;

	// Settings
	public readonly baseStartTime: number;
	public readonly baseEndTime: number;
	public startTime!: number; // startTime and endTime are both
	public endTime!: number; // stored as a number for efficiency
	public time!: Chrono;
	public scale: number = 1;
	public offset: Vector3D = Vector3D.zero;
	public color: Color3 = Color3.fromRGB(97, 97, 97);
	public resolution: number = 0;
	public width: number = 1; // this.OrbitingBody ? (math.log10(this.OrbitingBody.SOIRadius/50e6))/10 : 0.3

	// Display data
	private toInitialize: boolean = true;
	private readonly points: Vector3[] = []; // Is Vector3 for efficiency
	private readonly times: number[] = []; // Is number for efficiency
	private readonly attachments: Attachment[] = [];
	private beams: Beam[] = [];
	private beamBase: Beam = TrajectoryDisplay.beamBaseBase.Clone();

	// Constructor

	/**
	 * 
	 * @param trajectory The trajectory to display
	 * @param baseStartTime The lower time range to draw
	 * @param baseEndTime 
	 */
	public constructor(trajectory: T, baseStartTime: Chrono, baseEndTime: Chrono) {
		super();

		this.displayFolder = TrajectoryDisplay.displayFolderBase.Clone();
		this.trajectory = trajectory;
		this.startTime = this.baseStartTime = baseStartTime.toSeconds(); // TODO: Deal with orbits that loop
		this.endTime = this.baseEndTime = baseEndTime.toSeconds(); // periodically; that may or may not loop forever
// debug trajectory start point
// this._testpart(
// 	"STARTPART",
// 	new BrickColor("Bright red").Color,
// 	0.3,
// 	trajectory[0].getKinematic().getAbsolutePosition(),
// 	trajectoryFolder
// )
	}

	// Draw

	/**
	 * Efficiently configures and draws the orbit line display.
	 * @param scale Multiplier for all distances
	 * @param offset Applied pre-scale
	 * @param width The width of the trajectory line
	 * @param newResolution The new amount of beams to render
	 */
	override draw(
		scale?: number, offset?: Vector3D, time?: Chrono,
		startTime?: Chrono, endTime?: Chrono,
		color?: Color3, width?: number, newResolution?: number
	): displayFolder {
		if (
			(scale !== undefined && scale <= 0)
			|| (width !== undefined && width <= 0)
			|| (newResolution !== undefined && newResolution < 1)
			|| (startTime && endTime && startTime.greaterThanOrEqual(endTime))
		)
			error("TrajectoryDisplay draw() invalid argument(s)");

		// Unset parameter if same as previous value
		if (scale !== undefined && scale === this.scale)
			scale = undefined;
		if (offset && offset.equals(this.offset))
			offset = undefined;
		if (time && time === this.time)
			time = undefined;
		if (startTime && startTime.toSeconds() === this.startTime)
			startTime = undefined;
		if (endTime && endTime.toSeconds() === this.endTime)
			endTime = undefined;
		if (color && color === this.color)
			color = undefined;
		if (width !== undefined && width === this.width)
			width = undefined;
		if (newResolution !== undefined && newResolution === this.resolution)
			newResolution = undefined;

		// Update setting if changed
		// TODO: Fix problems caused by ordering
		if (color)
			this.changeColor(color);
		if (width !== undefined)
			this.changeWidth(width);
		if (newResolution !== undefined)
			this.changeResolution(newResolution);
		if (scale !== undefined || offset || time)
			this.changePosition(scale, offset, time);
		if (startTime || endTime)
			this.changeTimeRange(startTime?.toSeconds(), endTime?.toSeconds());

		return this.displayFolder;
	}

	// Helper methods

	/**
	 * Changes the Workspace position of the beam
	 */
	private changePosition(scale?: number, offset?: Vector3D, time?: Chrono) {
		if (scale !== undefined) this.scale = scale;
		if (time) this.time = time;
		if (offset) this.offset = offset;

debug.profilebegin("Attachments repositioning (changePosition())")
		// Calculate position of central GravityBody (if it exists)
		const relativePosition = this.trajectory.queryRelative()
			?.calculateStateFromTime(this.time).getKinematic()
			.absolutePosition() ?? Vector3D.zero;

		// Offset the attachments
		this.displayFolder.Attachments.CFrame = new CFrame(
			this.offset.add(relativePosition).mul(this.scale).toVector3()
		);

		// Scale the attachments
		// TODO: May only change the beams affected by the current time range for efficiency,
		// which would involve absorbing changeTimeRange() functionality into this function
		if (scale !== undefined) {
			for (let i = 0; i < this.resolution + 1; i++) {
				const point: Vector3 = this.points[i];
				const attachment: Attachment = this.attachments[i];

				attachment.CFrame = new CFrame(point.mul(this.scale));
			}
		}
debug.profileend()
	}

	/**
	 * Controls visiblily of beams based on selected time range
	 */
	private changeTimeRange(startTime?: number, endTime?: number) {
		if (startTime !== undefined) this.startTime = startTime;
		if (endTime !== undefined) this.endTime = endTime;
print(`TrajectoryDisplay changeTimeRange()`
	+ `\n\tstart: ${Chrono.fromSeconds(this.startTime).toString()}`
	+ `\n\tend: ${Chrono.fromSeconds(this.endTime).toString()}`
)

debug.profilebegin("Beam visibility change (changeTimeRange())")
		for (let i = 0; i < this.resolution; i++) {
			const beam: Beam = this.beams[i];

			// Show a beam only if both positions are within the valid time range
			const notInRange = (this.times[i] < this.startTime)
				|| (this.endTime < this.times[i + 1]);
			// if (notInRange !== (beam.Parent === undefined)) {
			// 	if (notInRange) beam.Parent = undefined;
			if (notInRange !== !beam.Enabled)
				beam.Enabled = !notInRange;
		}
debug.profileend()
	}

// TODO [changeColor(), changeWidth()]: May only change the beams affected by the current time range for efficiency,
// which would involve absorbing the functionality into changePosition()

	/**
	 * Update beam color
	 */
	private changeColor(color: Color3) {
		this.beamBase.Color = new ColorSequence(this.color = color);
debug.profilebegin("changeColor()")
		for (const beam of this.beams)
			beam.Color = new ColorSequence(this.color);
debug.profileend()
	}

	/**
	 * Update beam width
	 */
	private changeWidth(width: number) {
		this.beamBase.Width0 = this.beamBase.Width1 = this.width = width;
debug.profilebegin("changeWidth()")
		for (const beam of this.beams)
			beam.Width0 = beam.Width1 = this.width;
debug.profileend()
	}

	/**
	 * Changes how many beams make up the display
	 */
	private changeResolution(newResolution: number) {
debug.profilebegin("changeResolution()")
		// Generate points
		for (const state of this.trajectory.calculatePoints(Chrono.fromSeconds(this.baseStartTime), Chrono.fromSeconds(this.baseEndTime), newResolution + 1)) {
			this.points.push(state.position.toVector3());
			this.times.push(state.time.toSeconds());
		}

		if (newResolution > this.resolution) {
			// Attachments
			// TODO: Either set a fixed name length or eliminate the naming system altogether;
			// current naming system is vulnerable to resolution modifications
			const attachmentNameLength = math.floor(math.log10(newResolution + 1));
			for (let i = this.resolution; i < newResolution + 1; i++) {
				const point: Vector3 = this.points[i];
				const newAttachment: Attachment = new Instance("Attachment");

				newAttachment.Name = `%${attachmentNameLength}d`.format(i + 1);
				newAttachment.CFrame = new CFrame(point.mul(this.scale));

				this.attachments.push(newAttachment);
				newAttachment.Parent = this.displayFolder.Attachments;
			}

			// Beams
			const beamNameLength = math.ceil(math.log10(newResolution)); // TODO: Naming system
			for (let i = this.resolution; i < newResolution; i++) {
				const beam: Beam = this.beamBase.Clone();

				beam.Name = `%${beamNameLength}d`.format(i + 1);
				beam.Attachment0 = this.attachments[i];
				beam.Attachment1 = this.attachments[i + 1];

				this.beams.push(beam);
				beam.Parent = this.displayFolder.Beams;
			}
		} else if (newResolution < this.resolution) {
			for (let i = this.resolution; i > newResolution + 1; i--) {
				this.attachments.remove(i + 1)!.Destroy();
				this.beams.remove(i)!.Destroy();
			}
		}

		this.resolution = newResolution;
debug.profileend()
	}
}

// OrbitalTrajectory dynamic draw
// // Constantly update position of displayed trajectory until destroyed
// const attachmentPart: Part = display.FindFirstChild("Attachments") as Part;
// const connection: RBXScriptConnection = game.GetService("RunService").PreRender.Connect(() => {
// 	attachmentPart.Position = this.orbiting.state.getKinematic().getPosition().mul(Globals.solarSystemScale).toVector3();
// });
// display.Destroying.Once(() => connection.Disconnect());
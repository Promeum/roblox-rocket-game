import Vector3D from "shared/Modules/Libraries/Vector3D";

import TemporalState from "../Relative/State/TemporalState";
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

	// Initialize displayFolderBase
	static {
		this.displayFolderBase = new Instance("Folder") as displayFolder;
		this.displayFolderBase.Name = "TrajectoryDisplay";
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
	public readonly resolution: number;

	// Settings
	private time: TemporalState;
	// startTime and endTime stored as number for efficiency
	private startTime: number;
	private endTime: number;
	private scale: number = 1;
	private offset: Vector3D = Vector3D.zero;
	private color: Color3 = Color3.fromRGB(97, 97, 97);
	private width: number = 1;
	// private width: number = this.OrbitingBody ? (math.log10(this.OrbitingBody.SOIRadius/50e6))/10 : 0.3

	// Display data
	/** Is Vector3 for efficiency */
	private readonly points: Vector3[] = [];
	/** Is number for efficiency */
	private readonly times: number[] = [];
	private readonly attachments: Attachment[] = [];
	private beams: Beam[] = [];

	// Constructor

	public constructor(
		trajectory: T, resolution: number, time: TemporalState,
		startTime: TemporalState, endTime: TemporalState,
		scale?: number, offset?: Vector3D,
		color?: Color3, width?: number
	) {
		if (resolution < 1) error("TrajectoryDisplay() invalid argument(s)");
		super();

		this.displayFolder = TrajectoryDisplay.displayFolderBase.Clone();
		this.trajectory = trajectory;
// debug.profilebegin("TrajectoryDisplay calculatePoints()"); const calcS = os.clock();
		for (const state of trajectory.calculatePoints(startTime, endTime, resolution + 1)) {
			this.points.push(state.getKinematic().getPosition().toVector3());
			this.times.push(state.time.getAbsoluteTime());
		}
// const calcE = os.clock(); debug.profileend();
// print(`BENCHMARK calculatePoints(${startTime}, ${endTime}, ${resolution}): ` + (calcE - calcS))
		this.resolution = resolution;
		this.time = time;
		this.startTime = startTime.getAbsoluteTime();
		this.endTime = endTime.getAbsoluteTime();

		// Make the attachments
		const attachmentNameLength = math.floor(math.log10(resolution + 1));
		for (let i = 0; i < resolution + 1; i++) {
			const point: Vector3 = this.points[i];
			const newAttachment: Attachment = new Instance("Attachment");

			newAttachment.Name = `%${attachmentNameLength}d`.format(i + 1);
			newAttachment.CFrame = new CFrame(point.mul(this.scale));

			this.attachments.push(newAttachment);
			newAttachment.Parent = this.displayFolder.Attachments;
		}

		// Make the beams
		const beamNameLength = math.ceil(math.log10(resolution));
		for (let i = 0; i < this.resolution; i++) {
			const beam: Beam = new Instance("Beam");

			beam.Name = `%${beamNameLength}d`.format(i + 1);
			beam.Attachment0 = this.attachments[i];
			beam.Attachment1 = this.attachments[i + 1];

			this.beams.push(beam);
		}

		this.updateSettings(
			scale, offset, undefined,
			undefined, undefined,
			color, width
		);
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
	 * Generates the orbit line display.
	 * @param scale Multiplier for all distances
	 * @param offset Applied pre-scale
	 * @param width The width of the trajectory line
	 */
	override draw(
		scale?: number, offset?: Vector3D, time?: TemporalState,
		startTime?: TemporalState, endTime?: TemporalState,
		color?: Color3, width?: number
	): displayFolder {
		this.updateSettings(
			scale, offset, time,
			startTime, endTime,
			color, width
		);

		debug.profilebegin("Attachments repositioning")
		// Set time-derived position
		const relativePosition = this.trajectory.getRelativeOrUndefined()
			?.calculateStateFromTime(this.time).getKinematic()
			.getAbsolutePosition() ?? Vector3D.zero;

		// Offset the attachments
		this.displayFolder.Attachments.CFrame = new CFrame(
			this.offset.add(relativePosition).mul(this.scale).toVector3()
		);

		// Scale the attachments
		for (let i = 0; i < this.resolution + 1; i++) {
			const point: Vector3 = this.points[i];
			const attachment: Attachment = this.attachments[i];

			attachment.CFrame = new CFrame(point.mul(this.scale));
		}
		debug.profileend()

		// Generate beams
		debug.profilebegin("Beams parenting/unparenting")
		for (let i = 0; i < this.resolution; i++) {
			const beam: Beam = this.beams[i];

			// Show a beam only if both positions are within the valid time range
			const notInRange = (this.times[i] < this.startTime)
				|| (this.endTime < this.times[i + 1]);
			if (notInRange !== (beam.Parent === undefined)) {
				if (notInRange) beam.Parent = undefined;
				else beam.Parent = this.displayFolder.Beams;
			}
		}
		debug.profileend()

		return this.displayFolder;
	}

	// Methods

	public updateSettings(
		scale?: number, offset?: Vector3D, time?: TemporalState,
		startTime?: TemporalState, endTime?: TemporalState,
		color?: Color3, width?: number
	): void {
		if ((scale !== undefined && scale <= 0) || (width !== undefined && width <= 0))
			error("TrajectoryDisplay updateSettings() invalid argument(s)");

		if (time) this.time = time;
		if (startTime) this.startTime = startTime.getAbsoluteTime();
		if (endTime) this.endTime = endTime.getAbsoluteTime();
		if (scale !== undefined) this.scale = scale;
		if (offset) this.offset = offset;
		if (color) this.color = color;
		if (width !== undefined) this.width = width;

		// update beamBase
		if (color || width !== undefined) {
			for (const beam of this.beams) {
				beam.Segments = 1;
				beam.FaceCamera = true;
				beam.Width0 = beam.Width1 = this.width;
				beam.Color = new ColorSequence(this.color);
				beam.Transparency = new NumberSequence(0.4);
			}
		}
	}
}

// OrbitalTrajectory dynamic draw
// // Constantly update position of displayed trajectory until destroyed
// const attachmentPart: Part = display.FindFirstChild("Attachments") as Part;
// const connection: RBXScriptConnection = game.GetService("RunService").PreRender.Connect(() => {
// 	attachmentPart.Position = this.orbiting.state.getKinematic().getPosition().mul(Globals.solarSystemScale).toVector3();
// });
// display.Destroying.Once(() => connection.Disconnect());
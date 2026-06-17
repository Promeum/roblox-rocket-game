import Vector3D from "shared/Modules/Libraries/Vector3D";

import Chrono from "../Chrono";
import LinearTrajectory from "../Relative/Trajectory/LinearTrajectory";
import OrbitalTrajectory from "../Relative/Trajectory/OrbitalTrajectory";
import CompositeTrajectory from "../Relative/Trajectory/CompositeTrajectory";
import Display from ".";
import TrajectoryDisplay from "./TrajectoryDisplay";

/**
 * Displays a CompositeTrajectory.
 */
export default class CompositeTrajectoryDisplay extends Display {
	declare displayFolder: Folder;
	public readonly trajectory: CompositeTrajectory<LinearTrajectory | OrbitalTrajectory>;
	public readonly segments: TrajectoryDisplay<LinearTrajectory | OrbitalTrajectory>[] = [];

	// Settings
	public readonly baseStartTime!: Chrono;
	public readonly baseEndTime!: Chrono;

	// Display data
	// private readonly timeRangesBase: Chrono[][] = [];
	private readonly timeRanges: Chrono[][];

	public constructor(
		trajectory: CompositeTrajectory<LinearTrajectory | OrbitalTrajectory>,
		baseStartTime?: Chrono, baseEndTime?: Chrono
	) {
		super();

		this.trajectory = trajectory;
		this.timeRanges = this.trajectory.timeRanges(baseStartTime, baseEndTime);
		// this.timeRanges = this.timeRangesBase.map(x => x.map(y => y));
		this.baseStartTime = /* baseStartTime ??  */this.timeRanges[0][0];
		this.baseEndTime = /* baseEndTime ??  */this.timeRanges[this.timeRanges.size() - 1][1];

		let segment = trajectory;

		for (let i = 0; i < this.timeRanges.size(); i++) {
			const range = this.timeRanges[i];
			this.segments.push(
				new TrajectoryDisplay(segment.current, range[0], range[1])
			);
			if (i !== this.timeRanges.size() - 1)
				segment = segment.next();
		}

		// // Create the segments with broadest possible time ranges
		// let segment = trajectory;
		// let nextSegment: CompositeTrajectory<LinearTrajectory | OrbitalTrajectory>;

		// // Segments which lead into other segments
		// while (
		// 	segment.hasNext() && (nextSegment = segment.next())
		// 	&& (!baseEndTime || nextSegment.start.time.lessThan(baseEndTime))
		// ) {
		// 	const startTime = Chrono.max(segment.start.time, baseStartTime);
		// 	const endTime = Chrono.min(nextSegment.start.time, baseEndTime);

		// 	this.timeRangesBase.push([startTime, endTime]);
		// 	this.segments.push(
		// 		new TrajectoryDisplay(segment.current, startTime, endTime)
		// 	);

		// 	segment = nextSegment;
		// }

		// // The final segment
		// if (segment.current instanceof LinearTrajectory) {
		// 	const startTime = segment.start.time;
		// 	// draw up to a very high altitude
		// 	const endTime = segment.calculateStateFromMagnitude(1e12).time;

		// 	this.timeRangesBase.push([startTime, endTime]);
		// 	this.segments.push(
		// 		new TrajectoryDisplay(segment.current, startTime, endTime)
		// 	);
		// } else {
		// 	const startTime = segment.start.time;
		// 	let endTime: Chrono;
		// 	if (segment.current.isClosed) // draw one orbit
		// 		endTime = segment.start.time.add(segment.current.getPeriod());
		// 	else // draw up to a very high altitude
		// 		endTime = segment.current.calculateStateFromMagnitude(1e12).time;

		// 	this.timeRangesBase.push([startTime, endTime]);
		// 	this.segments.push(
		// 		new TrajectoryDisplay(segment.current, startTime, endTime)
		// 	);
		// }

	}

	// Draw

	/**
	 * Generates the orbit line display.
	 * @param scale Multiplier for all distances
	 * @param offset Applied pre-scale
	 * @param width The width of the trajectory line
	 */
	override draw(
		scale?: number, offset?: Vector3D, time?: Chrono,
		startTime?: Chrono, endTime?: Chrono,
		color?: Color3, width?: number, newResolution?: number
	): Folder {
// print(`CTD draw()\n\tfrom ${startTime?.toString()}\n\tto ${endTime?.toString()}`)
		if (
			(scale !== undefined && scale <= 0)
			|| (width !== undefined && width <= 0)
			|| (newResolution !== undefined && newResolution < 1)
			|| (startTime && endTime && startTime.greaterThanOrEqual(endTime))
		)
			error("CompositeTrajectoryDisplay draw() invalid argument(s)");

		// Draw the segments
		for (let i = 0; i < this.segments.size(); i++) {
			const timeRange = this.timeRanges[i];
			const segment = this.segments[i];
			const segmentStart: Chrono = Chrono.max(timeRange[0], startTime);
			const segmentEnd: Chrono = Chrono.min(timeRange[1], endTime);
			const shouldDraw: boolean = segmentStart.lessThan(segmentEnd);

			if (shouldDraw) {
				const linear = segment.trajectory instanceof LinearTrajectory;
// print(`CTD draw()\n\tfrom ${segmentStart?.toString()}\n\tto ${segmentEnd?.toString()}`)
				segment.draw(
					scale, offset, time,
					segmentStart!, segmentEnd!,
					color, width, linear ? 1 : newResolution
				).Parent = this.displayFolder;
			} else {
				segment.displayFolder.Parent = undefined;
			}
		}

		return this.displayFolder;
	}
}

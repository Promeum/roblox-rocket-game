import Vector3D from "shared/Modules/Libraries/Vector3D";

import TemporalState from "../Relative/State/TemporalState";
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
	private startTime: TemporalState;
	private endTime: TemporalState;

	// Display data
	private readonly timeRangesBase: TemporalState[][] = [];
	private readonly timeRanges: (TemporalState[] | undefined)[];

	public constructor(
		trajectory: CompositeTrajectory<LinearTrajectory | OrbitalTrajectory>,
		resolution: number, time: TemporalState, startTime: TemporalState,
		endTime: TemporalState, scale?: number, offset?: Vector3D,
		color?: Color3, width?: number
	) {
		if (resolution < 1) error("CompositeTrajectoryDisplay() invalid argument(s)");
		super();

		this.trajectory = trajectory;
		this.startTime = startTime;
		this.endTime = endTime;

		// Create the segments with broadest possible time ranges
		let segment = trajectory;

		// Segments which lead into other segments
		while (segment.hasNextTrajectory()) {
			const nextSegment = segment.nextTrajectory();
			const startTime = segment.start.time;
			const endTime = nextSegment.start.time;

			this.timeRangesBase.push([startTime, endTime]);
			this.segments.push(
				new TrajectoryDisplay(
					segment.currentTrajectory,
					segment.currentTrajectory instanceof LinearTrajectory ? 1 : resolution,
					time, startTime, endTime
				)
			);
			segment = nextSegment;
		}

		// The final segment
		if (segment.currentTrajectory instanceof LinearTrajectory) {
			const startTime = segment.start.time;
			// draw up to a very high altitude
			const endTime = segment.calculateStateFromMagnitude(1e12).time;

			this.timeRangesBase.push([startTime, endTime]);
			this.segments.push(
				new TrajectoryDisplay(
					segment.currentTrajectory, 1,
					time, startTime, endTime)
			);
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

			this.timeRangesBase.push([startTime, endTime]);
			this.segments.push(
				new TrajectoryDisplay(
					segment.currentTrajectory, resolution,
					time, startTime, endTime)
			);
		}

		this.timeRanges = this.timeRangesBase.map(x => x.map(y => y));

		// Set settings and complete initialization
		this.updateSettings(
			scale, offset, time,
			startTime, endTime,
			color, width
		);
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
	): Folder {
		this.updateSettings(
			scale, undefined, undefined,
			startTime, endTime,
			color, width
		);

		// Draw the segments
		for (let i = 0; i < this.segments.size(); i++) {
			const timeRange = this.timeRanges[i];
			const segment = this.segments[i]
			if (timeRange !== undefined) {
				segment.draw(
					scale, offset, time,
					timeRange[0], timeRange[1],
					color, width
				).Parent = this.displayFolder;
			} else {
				segment.displayFolder.Parent = undefined;
			}
		}
		return this.displayFolder;
	}

	// Methods

	public updateSettings(
		scale?: number, offset?: Vector3D, time?: TemporalState,
		startTime?: TemporalState, endTime?: TemporalState,
		color?: Color3, width?: number
	): void {
		if ((scale !== undefined && scale <= 0) || (width !== undefined && width <= 0))
			error("CompositeTrajectoryDisplay updateSettings() invalid argument(s)");

		// Update time ranges
		if (startTime || endTime) {
			if (startTime) this.startTime = startTime;
			if (endTime) this.endTime = endTime;

			for (let i = 0; i < this.segments.size(); i++) {
				// Show a segment only within the valid time range
				if (
					this.startTime.lessThan(this.timeRangesBase[i][1])
					&& this.timeRangesBase[i][0].lessThan(this.endTime)
				) {
					const newTimeRange: TemporalState[] = [];
					// Segment is partitioned by startTime
					if (this.timeRangesBase[i][0].lessThan(this.startTime)) {
						newTimeRange.push(this.startTime);
					} else {
						newTimeRange.push(this.timeRangesBase[i][0]);
					}
					// Segment is partitioned by endTime
					if (this.endTime.lessThan(this.timeRangesBase[i][1])) {
						newTimeRange.push(this.endTime);
					} else {
						newTimeRange.push(this.timeRangesBase[i][1]);
					}
					this.timeRanges[i] = newTimeRange;
				} else { // Segment completely out of time range
					this.timeRanges[i] = [];
				}
			}
		}

		// update segments
		for (let i = 0; i < this.segments.size(); i++) {
			const segment = this.segments[i];
			segment.updateSettings(
				scale, offset, time,
				this.timeRanges[i]?.[0], this.timeRanges[i]?.[1],
				color, width
			);
		}
	}
}

/*
	Time range calculation functions for CompositeTrajectory.
*/

import Chrono from "shared/Modules/BaseModule/Chrono";
import LinearTrajectory from "../LinearTrajectory";
import OrbitalTrajectory from "../OrbitalTrajectory";

import type CompositeTrajectory from ".";

type compositeTrajectory = CompositeTrajectory<LinearTrajectory | OrbitalTrajectory>;

// /**
//  * Broadest time ranges of all trajectories
//  */
// export function timeRangesBase(trajectory: compositeTrajectory): Chrono[][] {
// 	const timeRangesBase: Chrono[][] = [];

// 	// Create the segments with broadest possible time ranges
// 	// eslint-disable-next-line @typescript-eslint/no-this-alias
// 	let segment: CompositeTrajectory<LinearTrajectory | OrbitalTrajectory> = trajectory;

// 	// Segments which lead into other segments
// 	while (segment.hasNext()) {
// 		const nextSegment = segment.next();
// 		const startTime = segment.start.time;
// 		const endTime = nextSegment.start.time;

// 		timeRangesBase.push([startTime, endTime]);
// 		segment = nextSegment;
// 	}

// 	// The final segment
// 	if (segment.current instanceof LinearTrajectory) {
// 		const startTime = segment.start.time;
// 		// draw up to a very high altitude
// 		const endTime = segment.calculateStateFromMagnitude(1e12).time;

// 		timeRangesBase.push([startTime, endTime]);
// 	} else {
// 		const startTime = segment.start.time;
// 		let endTime: Chrono;
// 		if (segment.current.isClosed) { // draw one orbit
// 			endTime = segment.start.time
// 				.add(segment.current.getPeriod());
// 		} else { // draw up to a very high altitude
// 			endTime = segment.current
// 				.calculateStateFromMagnitude(1e12).time;
// 		}

// 		timeRangesBase.push([startTime, endTime]);
// 	}

// 	return timeRangesBase;
// }

/**
 * Time ranges of all trajectories, clamped to the provided arguments
 * Generates only the segments needed to check time ranges
 */
export function timeRanges(
	trajectory: compositeTrajectory, startTime?: Chrono, endTime?: Chrono
): Chrono[][] {
	// Create the segments with broadest possible time ranges
	let segment = trajectory;
	let nextSegment: CompositeTrajectory<LinearTrajectory | OrbitalTrajectory>;
	const ranges: Chrono[][] = [];

	// Segments which lead into other segments
	while (
		segment.hasNext() && (nextSegment = segment.next())
		&& (!endTime || nextSegment.start.time.lessThan(endTime))
	) {
		// Clamp segment range to fit within startTime and endTime
		const segmentStart = Chrono.max(segment.start.time, startTime);
		const segmentEnd = Chrono.min(nextSegment.start.time, endTime);
		ranges.push([segmentStart, segmentEnd]);
		segment = nextSegment;
	}

	// The final segment
	if (segment.current instanceof LinearTrajectory || !segment.current.isClosed) {
		// draw up to a very high altitude
		const startTime = segment.start.time;
		const endTime = segment.calculateStateFromMagnitude(1e12).time;
		ranges.push([startTime, endTime]);
	} else {
		// draw one orbit
		const startTime = segment.start.time;
		const endTime = segment.start.time.add(segment.current.getPeriod());
		ranges.push([startTime, endTime]);
	}

	return ranges;
}

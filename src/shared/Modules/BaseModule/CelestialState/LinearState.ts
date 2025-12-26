import CelestialState from ".";
import KinematicTemporalState from "../Relative/State/KinematicTemporalState";
import type Celestial from "../Relative/Celestial";

/**
 * LinearState represents the state of a Celestial on a LinearTrajectory.
 */
export default class LinearState extends CelestialState {
	// Constructors
		
	/**
	 * Creates a new LinearState instance from a CelestialState.
	 */
	public constructor(initialPosition: CelestialState);

	/**
	 * Creates a new LinearState instance from a KinematicTemporalState.
	 */
	public constructor(initialPosition: KinematicTemporalState, celestial: Celestial);

	public constructor(arg1: KinematicTemporalState | CelestialState, arg2?: Celestial) {
		if (arg1 instanceof CelestialState) {
			super(arg1);
		 } else {
			assert(arg2)
			super(arg1, arg2);
		 }
	}

}
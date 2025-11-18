// import { $assert } from "rbxts-transform-debug";
import Celestial from ".";
import GravityCelestial from "./GravityCelestial";
import KinematicTemporalState from "../../KinematicTemporalState";
import LinearTrajectory from "../../Trajectory/LinearTrajectory";
import OrbitalTrajectory from "../../Trajectory/OrbitalTrajectory";

export default class PhysicsCelestial extends Celestial {

	// Constructors

	public constructor (initialPosition: KinematicTemporalState, orbiting?: GravityCelestial)
	public constructor (trajectory: LinearTrajectory)
	public constructor (trajectory: OrbitalTrajectory, orbiting: GravityCelestial)

	/**
	 * Creates a new PhysicsCelestial instance.
	 */
	public constructor(arg1: KinematicTemporalState | LinearTrajectory | OrbitalTrajectory, arg2?: GravityCelestial) {
		if (arg1 instanceof KinematicTemporalState) { // Constructor 1
			super(arg1, arg2);
		} else if (arg1 instanceof LinearTrajectory) { // Constructor 2
			super(arg1);
		} else { // Constructor 3
			assert(arg2 !== undefined);
			super(arg1, arg2);
		}
	}

	// Methods

}

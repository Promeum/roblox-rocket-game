// import { $error } from "rbxts-transform-debug";
import Relative from "..";
import KinematicTemporalState from "../../KinematicTemporalState";
import GravityCelestial from "./GravityCelestial";
import LinearTrajectory from "../../Trajectory/LinearTrajectory";
import OrbitalTrajectory from "../../Trajectory/OrbitalTrajectory";

// temp types

export default abstract class Celestial extends Relative {
	public readonly trajectory: LinearTrajectory | OrbitalTrajectory;

	// Constructors

	protected constructor(initialPosition: KinematicTemporalState, orbiting?: GravityCelestial)
	protected constructor(trajectory: LinearTrajectory)
	protected constructor(trajectory: OrbitalTrajectory, orbiting: GravityCelestial)

	/**
	 * Creates a new Celestial instance.
	 */
	protected constructor(arg1: KinematicTemporalState | LinearTrajectory | OrbitalTrajectory, arg2?: GravityCelestial) {
		let trajectory: LinearTrajectory | OrbitalTrajectory

		if (arg1 instanceof KinematicTemporalState) { // Constructor 1
			if (arg2 !== undefined)
				trajectory = new OrbitalTrajectory(arg1, arg2);
			else
				trajectory = new LinearTrajectory(arg1);
		} else { // Constructor 2
			trajectory = arg1;
		}

		if ((trajectory instanceof LinearTrajectory) !== (arg2 === undefined))
			error("Celestial new() Parameters inconsistent")

		super(arg2);
		this.trajectory = trajectory;
	}

}

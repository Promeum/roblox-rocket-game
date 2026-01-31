// import { $assert } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";

import * as Constants from "../../../Constants";

import TemporalState from "../Relative/State/TemporalState";
import LinearTrajectory from "../Relative/Trajectory/LinearTrajectory";
import OrbitalTrajectory from "../Relative/Trajectory/OrbitalTrajectory";
import GravityState from "../Relative/CelestialState/GravityState";
import Celestial from ".";
import Datamap from "../Datamap";

export default class GravityCelestial extends Celestial {
	declare readonly trajectory: OrbitalTrajectory | LinearTrajectory;
	public readonly orbiting?: GravityCelestial;
	public readonly childGravityCelestials: GravityCelestial[] = [];

	// Physics characteristics
	public readonly mass: number;
	public readonly mu: number;
	public readonly SOIRadius: number;

	// Display/Rendering characteristics
	public readonly radius: number;
	public readonly color: Color3;
	public readonly heightmap: Datamap;

	// Constructors

	/**
	 * Creates a new GravityCelestial instance.
	 */
	public constructor(
		name: string,
		initialPosition: Vector3D, initialVelocity: Vector3D,
		initialTemporal: TemporalState, mass: number,
		radius: number, color: Color3, heightmap: Datamap,
		orbiting?: GravityCelestial
	) {
		super(name, initialPosition, initialVelocity, initialTemporal, orbiting);

		this.mass = mass;
		this.mu = Constants.GRAVITATIONAL_CONSTANT * this.mass;
		this.orbiting = orbiting;
		this.radius = radius;
		this.color = color;
		this.heightmap = heightmap;

		if (orbiting !== undefined) {
			this.SOIRadius = (this.trajectory as OrbitalTrajectory).semiMajorAxis * (this.mass / orbiting.mass) ** (2 / 5);
			orbiting.childGravityCelestials.push(this);
		} else {
			this.SOIRadius = this.mass ** (7 / 15); // 📅
		}
	}

	// Methods

	override calculateState(temporalState: TemporalState): GravityState {
		return new GravityState(
			this,
			this.trajectory.calculateStateFromTime(temporalState)
		)
	}

	override deepClone(): GravityCelestial {
		error("Not implemented")
	}
}

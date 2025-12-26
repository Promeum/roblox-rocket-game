// import { $assert } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";
import TemporalState from "../State/TemporalState";
import OrbitalState from "../../CelestialState/OrbitalState";
import LinearState from "../../CelestialState/LinearState";
import Celestial from ".";
import PhysicsCelestial from "./PhysicsCelestial";
import LinearTrajectory from "../../Trajectory/LinearTrajectory";
import OrbitalTrajectory from "../../Trajectory/OrbitalTrajectory";
import * as Constants from "../../../../Constants";
import * as Globals from "../../../../Globals";

export default class GravityCelestial extends Celestial {
	declare public readonly trajectory: OrbitalTrajectory | LinearTrajectory;
	declare public state: OrbitalState | LinearState;
	declare public readonly orbiting: GravityCelestial;
	public readonly childGravityCelestials: GravityCelestial[] = [];
	public readonly childPhysicsCelestials: PhysicsCelestial[] = [];

	public readonly mass: number;
	public readonly mu: number;
	public readonly SOIRadius: number;

	// Constructors

	/**
	 * Creates a new GravityCelestial instance.
	 */
	public constructor(initialPosition: Vector3D, initialVelocity: Vector3D, initialTemporal: TemporalState | undefined, mass: number, orbiting?: GravityCelestial) {
		super(initialPosition, initialVelocity, initialTemporal, orbiting);

		this.mass = mass;
		this.mu = Constants.GRAVITATIONAL_CONSTANT * this.mass;

		if (orbiting !== undefined) {
			this.trajectory = new OrbitalTrajectory(this.state as OrbitalState);
			this.SOIRadius = (this.trajectory as OrbitalTrajectory).getSemiMajorAxis() * (this.mass / this.orbiting.mass) ** (2 / 5);
			orbiting.childGravityCelestials.push(this);
		} else {
			this.trajectory = new LinearTrajectory(this.state as LinearState);
			this.SOIRadius = this.mass ** (2 / 5); // 📅
			Globals.rootGravityCelestials.push(this);
		}
	}

	// Methods

	override updateState(temporalState?: TemporalState): OrbitalState | LinearState {
		if (this.orbiting === undefined) {
			this.state = new LinearState(super.updateState(temporalState));
			return this.state;
		} else {
			this.state = new OrbitalState(super.updateState(temporalState), this.orbiting);
			return this.state;
		}
	}

}

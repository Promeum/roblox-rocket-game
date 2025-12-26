// import { $assert } from "rbxts-transform-debug";
import Celestial from ".";
import GravityCelestial from "./GravityCelestial";
import LinearState from "../../CelestialState/LinearState";
import OrbitalState from "../../CelestialState/OrbitalState";
import LinearTrajectory from "../../Trajectory/LinearTrajectory";
import OrbitalTrajectory from "../../Trajectory/OrbitalTrajectory";
import TemporalState from "../State/TemporalState";
import Vector3D from "shared/Modules/Libraries/Vector3D";
import * as Globals from "shared/Globals";
import CompositeTrajectory from "../../Trajectory/CompositeTrajectory";

export default class PhysicsCelestial extends Celestial {
	declare public readonly trajectory: CompositeTrajectory<LinearTrajectory> | CompositeTrajectory<OrbitalTrajectory>;
	declare public state: OrbitalState | LinearState;
	declare public orbiting?: GravityCelestial;

	// Constructors

	public constructor(initialPosition: Vector3D, initialVelocity: Vector3D, initialTemporal: TemporalState | undefined, orbiting?: GravityCelestial) {
		super(initialPosition, initialVelocity, initialTemporal, orbiting);

		if (orbiting !== undefined) {
			this.trajectory = new CompositeTrajectory<OrbitalTrajectory>(new OrbitalTrajectory(this.state as OrbitalState));
			orbiting.childPhysicsCelestials.push(this);
		} else {
			this.trajectory = new CompositeTrajectory<LinearTrajectory>(new LinearTrajectory(this.state as LinearState));
			Globals.rootPhysicsCelestials.push(this);
		}
	}

	// Methods
	
	override updateState(temporalState?: TemporalState): OrbitalState | LinearState {
		super.updateState(temporalState);
		this.orbiting = this.state instanceof OrbitalState ? this.state.orbiting : undefined;

		return this.state;
	}

}

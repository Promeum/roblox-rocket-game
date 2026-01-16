// import { $assert } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";

import TemporalState from "../Relative/State/TemporalState";
import LinearState from "../Relative/TrajectoryState/LinearState";
import OrbitalState from "../Relative/TrajectoryState/OrbitalState";
import LinearTrajectory from "../Relative/Trajectory/LinearTrajectory";
import OrbitalTrajectory from "../Relative/Trajectory/OrbitalTrajectory";
import CompositeTrajectory from "../Relative/Trajectory/CompositeTrajectory";
import Celestial from ".";
import GravityCelestial from "./GravityCelestial";
import PhysicsState from "../Relative/CelestialState/PhysicsState";

export default class PhysicsCelestial extends Celestial {
	declare public readonly trajectory: CompositeTrajectory<LinearTrajectory> | CompositeTrajectory<OrbitalTrajectory>;

	// Constructors

	public constructor(
		name: string,
		initialPosition: Vector3D,
		initialVelocity: Vector3D,
		initialTemporal: TemporalState, rootGravityCelestials:GravityCelestial[],
		orbiting?: GravityCelestial
	) {
		super(name, initialPosition, initialVelocity, initialTemporal, orbiting);

		if (this.trajectory instanceof OrbitalTrajectory) {
			this.trajectory = new CompositeTrajectory<OrbitalTrajectory>(this.trajectory,rootGravityCelestials);
		} else {
			assert(this.trajectory instanceof LinearTrajectory)
			this.trajectory = new CompositeTrajectory<LinearTrajectory>(this.trajectory,rootGravityCelestials);
		}
	}

	// Methods

	override calculateState(temporalState: TemporalState): PhysicsState {
		const trajectoryState = this.trajectory.calculateStateFromTime(temporalState);

		return new PhysicsState(
			this,
			trajectoryState as LinearState | OrbitalState,
			(trajectoryState as OrbitalState).trajectory.orbiting
		);
	}

	override deepClone(): PhysicsCelestial {
		return this;
	}
}

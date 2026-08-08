// import { $assert } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";

import Chrono from "../Chrono";
import LinearState from "../Relative/TrajectoryState/LinearState";
import OrbitalState from "../Relative/TrajectoryState/OrbitalState";
import PhysicsState from "../Relative/CelestialState/PhysicsState";
import LinearTrajectory from "../Relative/Trajectory/LinearTrajectory";
import OrbitalTrajectory from "../Relative/Trajectory/OrbitalTrajectory";
import CompositeTrajectory from "../Relative/Trajectory/CompositeTrajectory";
import GravityCelestial from "./GravityCelestial";
import Craft from "../Craft";
import Celestial from ".";

type trajectoryType = CompositeTrajectory<LinearTrajectory> | CompositeTrajectory<OrbitalTrajectory>;
type physicsModeType = "rails" | "physics";

/** Interface between orbital physics, the universe instance, and `Craft`/`Asteroid` */
export default class PhysicsCelestial extends Celestial {
	declare trajectory: trajectoryType;
	declare state: PhysicsState;

	readonly flyingObject: Craft /* | Asteroid */;
	physicsMode: physicsModeType = "rails";

	// Constructors

	constructor(
		name: string,
		initialPosition: Vector3D,
		initialVelocity: Vector3D,
		initialChrono: Chrono, rootGravityCelestials: GravityCelestial[],
		flyingObject: Craft /* | Asteroid */,
		orbiting?: GravityCelestial
	) {
		super(name, initialPosition, initialVelocity, initialChrono, orbiting);

		this.trajectory = new CompositeTrajectory(
			this.trajectory as unknown as OrbitalTrajectory | LinearTrajectory,rootGravityCelestials
		) as trajectoryType;
		this.flyingObject = flyingObject;
		flyingObject.celestial = this;
	}

	// Methods

	setPhysicsMode(physicsMode: "rails" | "physics"): void {
		if (this.physicsMode !== physicsMode) {
			this.physicsMode = physicsMode;
			this.flyingObject.setPhysicsMode(physicsMode);
		}
	}

	override calculateState(chrono: Chrono): PhysicsState {
		const trajectoryState = this.trajectory.calculateStateFromTime(chrono);

		return new PhysicsState(
			this,
			trajectoryState as LinearState | OrbitalState,
			(trajectoryState as OrbitalState).trajectory.orbiting
		);
	}

	preSimulation(delta: number): void {
		this.flyingObject.preSimulation(this.state.velocity, delta);
	}

	postSimulation(): void {
		if (this.physicsMode === "physics") {
			// Updates the trajectory with data from roblox physics
			const robloxVelocity = this.flyingObject.postSimulation();
			const difference = robloxVelocity.sub(this.state.velocity);
			this.trajectory = this.trajectory.changeVelocity(
				this.state.time,
				difference
			) as trajectoryType;
		}
	}

	override setState(chrono: Chrono): PhysicsState {
		return super.setState(chrono) as PhysicsState;
	}

	override serialize(): string {
		error("Not implemented")
	}
}

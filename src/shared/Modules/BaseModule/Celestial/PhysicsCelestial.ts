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

	/**
	 * Transitions between modes by initializing
	 * the underlying Roblox kinematics.
	 * 
	 * May move to `Craft` in future after implementing
	 * multi-`CraftPart` craft physics.
	 */
	setPhysicsMode(physicsMode: "rails" | "physics"): void {
		this.physicsMode = physicsMode;
		if (physicsMode === "physics") {
			for (const craftPart of this.flyingObject.allParts()) {
				craftPart.rigidBodies.forEach(rb => {
					// Assume orbiting is 0 velocity, will change in future
					rb.part.AssemblyLinearVelocity = this.state.velocity.toVector3();
				});
			}
		} else {
			for (const craftPart of this.flyingObject.allParts()) {
				craftPart.rigidBodies.forEach(rb => {
					rb.part.AssemblyLinearVelocity = Vector3.zero;
					rb.part.AssemblyAngularVelocity = Vector3.zero;
				});
			}
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

	/**
	 * Assumed that `physicsMode = "physics"` and `postSimulation()`
	 * has been called within the current `preSimulation` step.
	 */
	preSimulation(delta: number): void {
		// assert(this.physicsMode === "physics")
		this.flyingObject.preSimulation(this.state.velocity, delta);
	}

	postSimulation(): void {
		// Updates the trajectory with data from roblox physics
		const robloxVelocity = this.flyingObject.postSimulation();
		const difference = robloxVelocity.sub(this.state.velocity);
		this.trajectory = this.trajectory.changeVelocity(
			this.state.time,
			difference
		) as trajectoryType;
	}

	override setState(chrono: Chrono): PhysicsState {
		return super.setState(chrono) as PhysicsState;
	}

	override serialize(): string {
		error("Not implemented")
	}
}

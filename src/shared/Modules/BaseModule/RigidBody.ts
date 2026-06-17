import Vector3D from "shared/Modules/Libraries/Vector3D";

import BaseModule from ".";

import type CraftPart from "./CraftPart";

export default class RigidBody extends BaseModule {
	public craftPart!: CraftPart;
    /** Contains `canCollide=true` parts */
    public readonly collisionModel: Model;
    /** Part within `collisionModel` for kinematics handling */
    public readonly part: BasePart;

    // Constructors

    public constructor(collisionModel: Model) {
        super();

        this.collisionModel = collisionModel;
        this.part = collisionModel.PrimaryPart!;
    }

    // Methods

    /**
     * Apply gravitational forces to the internal `Part`.
	 * @param impulse Velocity to be added to current
     */
    public preSimulation(impulse: Vector3D): void {
		const newVelocity = impulse.add(this.part.AssemblyLinearVelocity).toVector3();
		this.part.AssemblyLinearVelocity = newVelocity;
    }

	/**
	 * 
	 * @returns The RigidBody's linear velocity.
	 */
	public postSimulation(): Vector3D {
		return Vector3D.fromVector3(this.part.AssemblyLinearVelocity);
	}

    override deepClone(): RigidBody {
        return this;
    }
}

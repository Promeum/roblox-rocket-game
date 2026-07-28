import Vector3D from "shared/Modules/Libraries/Vector3D";
import BaseModule from ".";

export default class RigidBody extends BaseModule {
    /** Contains `canCollide=true` parts */
    readonly collisionModel: Model;
    /** Part within `collisionModel` for kinematics handling */
    readonly part: BasePart;

    // Constructors

    constructor(collisionModel: Model) {
        super();

        this.collisionModel = collisionModel;
        this.part = collisionModel.PrimaryPart ?? error(`collisionModel has no PrimaryPart (is ${collisionModel.PrimaryPart})`);
    }

    // Methods

    /**
     * Apply gravitational forces to the internal `Part`.
	 * @param impulse Velocity to be added to current
     */
    preSimulation(impulse: Vector3D): void {
		const newVelocity = impulse.add(this.part.AssemblyLinearVelocity).toVector3();
		this.part.AssemblyLinearVelocity = newVelocity;
    }

	/**
	 * 
	 * @returns The RigidBody's linear velocity.
	 */
	postSimulation(): Vector3D {
		return Vector3D.fromVector3(this.part.AssemblyLinearVelocity);
	}
}

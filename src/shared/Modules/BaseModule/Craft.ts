import Vector3D from "shared/Modules/Libraries/Vector3D";

import BaseModule from ".";
import PhysicsCelestial from "./Celestial/PhysicsCelestial";
import CraftPart from "./CraftPart";

export default class Craft extends BaseModule {
	public celestial!: PhysicsCelestial;
	public primaryPart: CraftPart;

	/** Used in impulse calculations */
	private lastVelocity = Vector3D.zero;

	// Constructors

	public constructor(
		primaryPart: CraftPart
	) {
		super();

		this.primaryPart = primaryPart;
		primaryPart.craft = this;
	}

	// Methods

	/**
	 * Propogates to all CraftParts.
	 * @param velocity Calculated trajectory velocity
	 * @param delta Duration of this physics timestep in seconds
	 */
	public preSimulation(velocity: Vector3D): void {
		this.primaryPart.preSimulation(velocity.sub(this.lastVelocity));
	}

	/**
	 * Average velocity of all `CraftPart`'s
	 */
	public postSimulation(): Vector3D {
		const allParts = this.allParts();
		let total: Vector3D = Vector3D.zero;
		for (const part of allParts)
			total = total.add(part.postSimulation());
		return this.lastVelocity = total.div(allParts.size());
	}

	/** Breadth-first search */
	private allParts(): CraftPart[] {
		return [this.primaryPart, ...this.primaryPart.allChildren()];
	}

	override deepClone(): Craft {
		return this;
	}
}

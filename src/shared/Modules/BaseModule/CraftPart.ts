import Vector3D from "shared/Modules/Libraries/Vector3D";

import BaseModule from ".";
import RigidBody from "./RigidBody";

import type Craft from "./Craft";

export default class CraftPart extends BaseModule {
	public craft!: Craft;
	public parentPart?: CraftPart;
	public readonly childParts: CraftPart[];
	public readonly rigidBody: RigidBody;

	// Constructors

	public constructor(
		parentPart: CraftPart | undefined,
		childParts: CraftPart[],
		rigidBody: RigidBody,
	) {
		super();

		this.parentPart = parentPart;
		this.rigidBody = rigidBody;
		rigidBody.craftPart = this;
		this.childParts = childParts;
	}

	// Methods

	/**
	 * Unparents this part. Useful for breaking apart Crafts.
	 * @param part The CraftPart to remove.
	 * @returns The removed CraftPart.
	 */
	public unparent(): CraftPart {
		if (this.parentPart === undefined)
			error("CraftPart unparent() Part has no parent");

		return this.parentPart.childParts.remove(
			this.parentPart.childParts.findIndex(p => this.equals(p))
		)!;
	}

	/**
	 * Propogates to all CraftParts.
	 * @param impulse Velocity to be added to current
	 */
	public preSimulation(impulse: Vector3D): void {
		this.rigidBody.preSimulation(impulse);
		for (const childPart of this.childParts)
			childPart.preSimulation(impulse);
	}

	/**
	 * @returns The velocity of this CraftPart only.
	 */
	public postSimulation(): Vector3D {
	  return this.rigidBody.postSimulation();
	}

	/** Breadth-first search */
	public allChildren(): CraftPart[] {
		let result: CraftPart[] = this.childParts;
		for (let index = 0; index < result.size(); index++) {
			const part = result[index];
			result = [...result, ...part.childParts];
		}
		return result;
	}

	override deepClone(): CraftPart {
		return this;
	}
}

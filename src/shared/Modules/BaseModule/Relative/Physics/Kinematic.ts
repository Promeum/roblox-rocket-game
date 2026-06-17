// import { $assert } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";

import Physics from ".";
import Acceleration from "./Acceleration";

export default class Kinematic extends Physics {
	public readonly position: Vector3D;
	public readonly velocity: Vector3D;

	// Constructors

	/**
	 * Creates a new KinematicState instance.
	 * @param position 
	 * @param velocity 
	 * @param relativeTo 
	 */
	public constructor(position: Vector3D, velocity: Vector3D, relativeTo?: Kinematic)

	/**
	 * Clones a KinematicState instance and replaces its relativeTo.
	 * @param kinematicState 
	 * @param relativeTo 
	 */
	public constructor(kinematicState: Kinematic, relativeTo?: Kinematic)

	public constructor(arg1: Vector3D | Kinematic, arg2?: Vector3D | Kinematic, arg3?: Kinematic) {
		let position: Vector3D;
		let velocity: Vector3D;
		let relativeTo: Kinematic | undefined

		if (arg1 instanceof Vector3D) { // Constructor 1
			assert(arg2 instanceof Vector3D);
			position = arg1;
			velocity = arg2;
			relativeTo = arg3;
		} else { // Constructor 2
			assert((arg2 === undefined || arg2 instanceof Kinematic) && arg3 === undefined);
			position = arg1.position;
			velocity = arg1.velocity;
			relativeTo = arg2;
		}

		// assert((position.X === position.X) && (position.Y === position.Y) && (position.Z === position.Z), `KinematicState constructor() position is NaN (${position})`);
		// assert((velocity.X === velocity.X) && (velocity.Y === velocity.Y) && (velocity.Z === velocity.Z), `KinematicState constructor() velocity is NaN (${velocity})`);
		super(relativeTo);
		this.position = position;
		this.velocity = velocity;
	}

	// Arithmetic

	public add(other: Kinematic): Kinematic {
		// assert(this.sameRelativeTree(other), "KinematicState.add() operands do not share the same relativeTree");
		if (this.sameRelativeTree(other)) warn("KinematicState.add() operands do not share the same relativeTree");
		return new Kinematic(
			this.position.add(other.position),
			this.velocity.add(other.velocity),
			this.queryRelative(),
		);
	}

	public sub(other: Kinematic): Kinematic {
		assert(this.sameRelativeTree(other), "KinematicState.sub() operands do not share the same relativeTree");
		return new Kinematic(
			this.position.sub(other.position),
			this.velocity.sub(other.velocity),
			this.queryRelative(),
		);
	}

	// Comparisons

	public equals(other?: Kinematic): other is Kinematic {
		if (this !== undefined && other !== undefined) {
			if (this.position.equals(other.position) && this.velocity.equals(other.velocity))
				if (this.hasRelative() && other.hasRelative())
					return this.getRelative().equals(other.getRelative());
				else
					return this.hasRelative() === other.hasRelative();
			else
				return false;
		} else {
			return this === undefined && other === undefined;
		}
	}

	// Methods

	public absolutePosition(): Vector3D {
		if (this.hasRelative()) {
			return this.position.add(this.getRelative().absolutePosition());
		} else {
			return this.position;
		}
	}

	public absoluteVelocity(): Vector3D {
		if (this.hasRelative()) {
			return this.velocity.add(this.getRelative().absoluteVelocity());
		} else {
			return this.velocity;
		}
	}

	/**
	 * Advances this KinematicState in time, and recursively does the
	 * same (without acceleration) to its entire relative tree.
	 * @param delta The time to advance.
	 * @param acceleration Optionally applies acceleration over delta.
	 * @returns A new AccelerationState, with all of its relatives also changed.
	 */
	public step(delta: number, acceleration?: Acceleration): Kinematic {
		const newVelocity: Vector3D = this.velocity;
		const newPosition: Vector3D = this.position;

		if (acceleration !== undefined)
			newVelocity.add(acceleration.vector(delta));
		newPosition.add(newVelocity.mul(delta));

		return new Kinematic(
			newPosition,
			newVelocity,
			this.getRelative().step(delta)
		);
	}

	public absolute(): Kinematic {
		return new Kinematic(this.absolutePosition(), this.absoluteVelocity());
	}

	public consolidate(): Kinematic {
		assert(this.hasRelative(), "consolidateOnce() cannot be called on a KinematicState with no relativeTo");
		const relative = this.getRelative();
		return new Kinematic(
			this.position.add(relative.position),
			this.velocity.add(relative.velocity),
			relative.queryRelative(),
		);
	}

	public synchronize(other: Kinematic): [Kinematic, Kinematic] {
		const selfTree = this.getRelativeTree();
		let selfTrimmedPosition = Vector3D.zero;
		let selfTrimmedVelocity = Vector3D.zero;

		for (let i = 0; i < this.convergenceIndex(other) - 1; i++) {
			selfTrimmedPosition = selfTrimmedPosition.add(selfTree[i].position);
			selfTrimmedVelocity = selfTrimmedVelocity.add(selfTree[i].velocity);
		}

		const otherTree = other.getRelativeTree();
		let otherTrimmedPosition = Vector3D.zero;
		let otherTrimmedVelocity = Vector3D.zero;

		for (let i = 0; i < other.convergenceIndex(this) - 1; i++) {
			otherTrimmedPosition = otherTrimmedPosition.add(otherTree[i].position);
			otherTrimmedVelocity = otherTrimmedVelocity.add(otherTree[i].velocity);
		}

		const convergenceItem = this.convergenceItem(other) ?? new Kinematic(Vector3D.zero, Vector3D.zero);

		const selfResult = new Kinematic(
			convergenceItem.position.add(selfTrimmedPosition),
			convergenceItem.velocity.add(selfTrimmedVelocity),
		);
		const otherResult = new Kinematic(
			convergenceItem.position.add(otherTrimmedPosition),
			convergenceItem.velocity.add(otherTrimmedVelocity),
		);

		assert(
			selfResult.queryRelative() === otherResult.queryRelative() &&
				this.absolutePosition().equals(selfResult.absolutePosition()) &&
				this.absoluteVelocity().equals(selfResult.absoluteVelocity()) &&
				other.absolutePosition().equals(otherResult.absolutePosition()) &&
				other.absoluteVelocity().equals(otherResult.absoluteVelocity()),
			"something wrong in the calcs!",
		);

		return [selfResult, otherResult];
	}

	public matchRelative(other: Kinematic): Kinematic {
		const otherTree = other.getRelativeTree();
		let otherTrimmedPosition = Vector3D.zero;
		let otherTrimmedVelocity = Vector3D.zero;

		for (let i = 0; i < other.convergenceIndex(this) - 1; i++) {
			otherTrimmedPosition = otherTrimmedPosition.add(otherTree[i].position);
			otherTrimmedVelocity = otherTrimmedVelocity.add(otherTree[i].velocity);
		}

		const convergenceItem = this.convergenceItem(other) ?? new Kinematic(Vector3D.zero, Vector3D.zero);
		const selfRelativeTree = this.getRelativeTree();

		let resultPositionLeftover = convergenceItem.position.add(otherTrimmedPosition);
		let resultVelocityLeftover = convergenceItem.velocity.add(otherTrimmedVelocity);

		for (let i = this.convergenceIndex(other) - 1; i >= 1; i--) {
			resultPositionLeftover = resultPositionLeftover.sub(selfRelativeTree[i].position);
			resultVelocityLeftover = resultVelocityLeftover.sub(selfRelativeTree[i].velocity);
		}

		const result = new Kinematic(resultPositionLeftover, resultVelocityLeftover, this.queryRelative());

		assert(
			this.queryRelative() === result.queryRelative() &&
				other.absolutePosition().equals(result.absolutePosition()) &&
				other.absoluteVelocity().equals(result.absoluteVelocity()),
			"something wrong in the calcs!",
		);

		return result;
	}

	// Wrap super methods with current type

	override convergenceIndex(other: Kinematic): number {
		return super.convergenceIndex(other);
	}

	override getRelative(): Kinematic {
		return super.getRelative() as Kinematic;
	}

	override queryRelative() : Kinematic | undefined {
		return super.queryRelative() as Kinematic | undefined;
	}

	override getRelativeTree(): Kinematic[] {
		return super.getRelativeTree() as Kinematic[];
	}

	override convergenceItem(other: Kinematic): Kinematic | undefined {
		return super.convergenceItem(other) as Kinematic | undefined;
	}

	override deepClone(): Kinematic {
		return this;
	}
}

// import { $assert } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";

import State from ".";
import AccelerationState from "./AccelerationState";

export default class KinematicState extends State {
	public readonly position: Vector3D;
	public readonly velocity: Vector3D;

	// Constructors

	/**
	 * Creates a new KinematicState instance.
	 * @param position 
	 * @param velocity 
	 * @param relativeTo 
	 */
	public constructor(position: Vector3D, velocity: Vector3D, relativeTo?: KinematicState)

	/**
	 * Clones a KinematicState instance and replaces its relativeTo.
	 * @param kinematicState 
	 * @param relativeTo 
	 */
	public constructor(kinematicState: KinematicState, relativeTo?: KinematicState)

	public constructor(arg1: Vector3D | KinematicState, arg2?: Vector3D | KinematicState, arg3?: KinematicState) {
		let position: Vector3D;
		let velocity: Vector3D;
		let relativeTo: KinematicState | undefined

		if (arg1 instanceof Vector3D) { // Constructor 1
			assert(arg2 instanceof Vector3D);
			position = arg1;
			velocity = arg2;
			relativeTo = arg3;
		} else { // Constructor 2
			assert((arg2 === undefined || arg2 instanceof KinematicState) && arg3 === undefined);
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

	public add(other: KinematicState): KinematicState {
		assert(this.sameRelativeTree(other), "KinematicState.add() operands do not share the same relativeTree");
		return new KinematicState(
			this.position.add(other.position),
			this.velocity.add(other.velocity),
			this.getRelativeOrUndefined(),
		);
	}

	public sub(other: KinematicState): KinematicState {
		assert(this.sameRelativeTree(other), "KinematicState.sub() operands do not share the same relativeTree");
		return new KinematicState(
			this.position.sub(other.position),
			this.velocity.sub(other.velocity),
			this.getRelativeOrUndefined(),
		);
	}

	// Comparisons

	public equals(other?: KinematicState): other is KinematicState {
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

	public getAbsolutePosition(): Vector3D {
		if (this.hasRelative()) {
			return this.position.add(this.getRelative().getAbsolutePosition());
		} else {
			return this.position;
		}
	}

	public getAbsoluteVelocity(): Vector3D {
		if (this.hasRelative()) {
			return this.velocity.add(this.getRelative().getAbsoluteVelocity());
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
	public step(delta: number, acceleration?: AccelerationState): KinematicState {
		const newVelocity: Vector3D = this.velocity;
		const newPosition: Vector3D = this.position;

		if (acceleration !== undefined)
			newVelocity.add(acceleration.getAccelerationVector(delta));
		newPosition.add(newVelocity.mul(delta));

		return new KinematicState(
			newPosition,
			newVelocity,
			this.getRelative().step(delta)
		);
	}

	public getAbsolute(): KinematicState {
		return new KinematicState(this.getAbsolutePosition(), this.getAbsoluteVelocity());
	}

	public consolidateOnce(): KinematicState {
		assert(this.hasRelative(), "consolidateOnce() cannot be called on a KinematicState with no relativeTo");
		const relativeTo = this.getRelative();
		return new KinematicState(
			this.position.add(relativeTo.position),
			this.velocity.add(relativeTo.velocity),
			relativeTo.getRelativeOrUndefined(),
		);
	}

	public synchronize(other: KinematicState): [KinematicState, KinematicState] {
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

		const convergenceItem = this.convergenceItem(other) ?? new KinematicState(Vector3D.zero, Vector3D.zero);

		const selfResult = new KinematicState(
			convergenceItem.position.add(selfTrimmedPosition),
			convergenceItem.velocity.add(selfTrimmedVelocity),
		);
		const otherResult = new KinematicState(
			convergenceItem.position.add(otherTrimmedPosition),
			convergenceItem.velocity.add(otherTrimmedVelocity),
		);

		assert(
			selfResult.getRelativeOrUndefined() === otherResult.getRelativeOrUndefined() &&
				this.getAbsolutePosition().equals(selfResult.getAbsolutePosition()) &&
				this.getAbsoluteVelocity().equals(selfResult.getAbsoluteVelocity()) &&
				other.getAbsolutePosition().equals(otherResult.getAbsolutePosition()) &&
				other.getAbsoluteVelocity().equals(otherResult.getAbsoluteVelocity()),
			"something wrong in the calcs!",
		);

		return [selfResult, otherResult];
	}

	public matchRelative(other: KinematicState): KinematicState {
		const otherTree = other.getRelativeTree();
		let otherTrimmedPosition = Vector3D.zero;
		let otherTrimmedVelocity = Vector3D.zero;

		for (let i = 0; i < other.convergenceIndex(this) - 1; i++) {
			otherTrimmedPosition = otherTrimmedPosition.add(otherTree[i].position);
			otherTrimmedVelocity = otherTrimmedVelocity.add(otherTree[i].velocity);
		}

		const convergenceItem = this.convergenceItem(other) ?? new KinematicState(Vector3D.zero, Vector3D.zero);
		const selfRelativeTree = this.getRelativeTree();

		let resultPositionLeftover = convergenceItem.position.add(otherTrimmedPosition);
		let resultVelocityLeftover = convergenceItem.velocity.add(otherTrimmedVelocity);

		for (let i = this.convergenceIndex(other) - 1; i >= 1; i--) {
			resultPositionLeftover = resultPositionLeftover.sub(selfRelativeTree[i].position);
			resultVelocityLeftover = resultVelocityLeftover.sub(selfRelativeTree[i].velocity);
		}

		const result = new KinematicState(resultPositionLeftover, resultVelocityLeftover, this.getRelativeOrUndefined());

		assert(
			this.getRelativeOrUndefined() === result.getRelativeOrUndefined() &&
				other.getAbsolutePosition().equals(result.getAbsolutePosition()) &&
				other.getAbsoluteVelocity().equals(result.getAbsoluteVelocity()),
			"something wrong in the calcs!",
		);

		return result;
	}

	// Wrap super methods with current type

	override convergenceIndex(other: KinematicState): number {
		return super.convergenceIndex(other);
	}

	override getRelative(): KinematicState {
		return super.getRelative() as KinematicState;
	}

	override getRelativeOrUndefined() : KinematicState | undefined {
		return super.getRelativeOrUndefined() as KinematicState | undefined;
	}

	override getRelativeTree(): KinematicState[] {
		return super.getRelativeTree() as KinematicState[];
	}

	override convergenceItem(other: KinematicState): KinematicState | undefined {
		return super.convergenceItem(other) as KinematicState | undefined;
	}

	override deepClone(): KinematicState {
		return this;
	}
}

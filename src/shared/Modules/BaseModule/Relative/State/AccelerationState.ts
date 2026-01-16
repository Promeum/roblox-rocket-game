// import { $assert } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";

import State from ".";

export default class AccelerationState extends State {
	public readonly acceleration: Vector3D;
	public readonly delta: number;

    // Constructors

	/**
	 * Creates a new AccelerationState instance.
	 * @param acceleration The velocity change.
	 * @param delta The time over which the velocity change is applied. Defaults to 1.
	 * @param relativeTo 
	 */
	public constructor(acceleration: Vector3D, delta?: number, relativeTo?: AccelerationState)

	/**
	 * Returns a modified version of accelerationState, with an altered delta.
	 * @param accelerationState The AccelerationState to alter.
	 * @param delta The delta used to alter accelerationState. Defaults to 1.
	 */
	public constructor(accelerationState: AccelerationState, delta?: number)

	public constructor(arg1: Vector3D | AccelerationState, arg2: number = 1, arg3?: AccelerationState) {
		let accelerationVector: Vector3D;
		let delta: number;
		let relativeTo: AccelerationState | undefined;

		if (arg1 instanceof Vector3D) { // Constructor 1
			accelerationVector = arg1;
			delta = arg2;
			relativeTo = arg3;
		} else { // Constructor 2
			const newAccelerationVector = arg1.getAccelerationVector(arg2);
			accelerationVector = newAccelerationVector;
			delta = arg2
			relativeTo = arg1.getRelativeOrUndefined();
		}

	    super(relativeTo);
		this.acceleration = accelerationVector;
		this.delta = delta;
	}

    // Arithmetic

	/**
	 * Adds two AccelerationStates.
	 * @param other The AccelerationState to add with the current instance.
	 * @returns A new AccelerationState with the delta of the current instance.
	 */
	public add(other: AccelerationState): AccelerationState {
		assert(this.sameRelativeTree(other), "AccelerationState add() operands do not have the same relativeTree");

		if (this.delta !== other.delta) {
			return new AccelerationState(
				this.getAccelerationVector(this.delta).add(other.getAccelerationVector(this.delta))
			);
		} else {
			return new AccelerationState(
				this.acceleration.add(other.acceleration),
				this.delta,
				this.getRelativeOrUndefined()
			);
		}
	}

	/**
	 * Subtracts two AccelerationStates.
	 * @param other The AccelerationState to subtract to the current instance.
	 * @returns A new AccelerationState with the delta of the current instance.
	 */
	public sub(other: AccelerationState): AccelerationState {
		assert(this.sameRelativeTree(other), "AccelerationState sub() operands do not have the same relativeTree");

		if (this.delta !== other.delta) {
			return new AccelerationState(
				this.getAccelerationVector(this.delta).sub(other.getAccelerationVector(this.delta)),
			);
		} else {
			return new AccelerationState(this.acceleration.sub(other.acceleration));
		}
	}

    // Comparisons

	override equals(other?: AccelerationState): other is AccelerationState {
		return super.equals(other)
			&& this.acceleration.equals(other.acceleration)
			&& this.delta === other.delta;
	}

	public lessThan(other: AccelerationState): boolean {
		return this.getAbsoluteAcceleration().magnitude() < other.getAbsoluteAcceleration().magnitude();
	}

	public lessOrEqual(other: AccelerationState): boolean {
		return this.getAbsoluteAcceleration().magnitude() <= other.getAbsoluteAcceleration().magnitude();
	}

	// Methods

	/**
	 * Changes the delta and change in velocity
	 * while maintaining the overall acceleration force.
	 * @param delta 
	 * @returns A new AccelerationState.
	 */
	public getAccelerationVector(delta?: number): Vector3D {
		if (delta === undefined) {
			return this.acceleration;
		} else {
			return this.acceleration.mul(delta / this.delta);
		}
	}

	public getAbsoluteAcceleration(delta?: number): Vector3D {
		if (this.hasRelative()) {
			return this.getAccelerationVector(delta).add(this.getRelative().getAbsoluteAcceleration(delta));
		} else {
			return this.getAccelerationVector(delta);
		}
	}

    override getAbsolute(): AccelerationState {
        return new AccelerationState(this.getAbsoluteAcceleration(1));
    }

	override consolidateOnce(delta?: number): AccelerationState {
		assert(this.hasRelative(), "consolidateOnce() cannot be called on a AccelerationState with no RelativeTo");
		const relativeTo = this.getRelative();

		return new AccelerationState(
			this.getAccelerationVector(delta).add(relativeTo.getAccelerationVector(delta)),
			delta,
			relativeTo.getRelativeOrUndefined(),
		);
	}

	override synchronize(other: AccelerationState): [AccelerationState, AccelerationState] {
		const convergenceItem = this.convergenceItem(other) ?? new AccelerationState(new Vector3D(0, 0, 0));

		const selfTree = this.getRelativeTree();
		let selfTrimmedAcceleration = new Vector3D(0, 0, 0);

		for (let i = 0; i < this.convergenceIndex(other) - 1; i++) {
			selfTrimmedAcceleration = selfTrimmedAcceleration.add(
				selfTree[i].getAccelerationVector(convergenceItem.delta),
			);
		}

		const otherTree = other.getRelativeTree();
		let otherTrimmedAcceleration = new Vector3D(0, 0, 0);

		for (let i = 0; i < other.convergenceIndex(this) - 1; i++) {
			otherTrimmedAcceleration = otherTrimmedAcceleration.add(
				otherTree[i].getAccelerationVector(convergenceItem.delta),
			);
		}

		const selfResult = new AccelerationState(
			convergenceItem.acceleration.add(selfTrimmedAcceleration),
			convergenceItem.delta,
		);
		const otherResult = new AccelerationState(
			convergenceItem.acceleration.add(otherTrimmedAcceleration),
			convergenceItem.delta,
		);

		assert(
			selfResult.getRelativeOrUndefined() === otherResult.getRelativeOrUndefined() &&
				this.getAbsoluteAcceleration().equals(selfResult.getAbsoluteAcceleration()) &&
				other.getAbsoluteAcceleration().equals(otherResult.getAbsoluteAcceleration()),
			"something wrong in the calcs!",
		);

		return [selfResult, otherResult];
	}

	override matchRelative(other: AccelerationState): AccelerationState {
		const convergenceIndex = other.convergenceIndex(this);

		let otherIterator = other;
		let trimmedAcceleration = new Vector3D(0, 0, 0);

		for (let i = 0; i < convergenceIndex - 1; i++) {
			trimmedAcceleration = trimmedAcceleration.add(otherIterator.getAccelerationVector(this.delta));
			otherIterator = otherIterator.getRelative();
		}

		const selfRelativeTree = this.getRelativeTree();
		let resultAccelerationLeftover = trimmedAcceleration;

		for (let i = this.convergenceIndex(other) - 2; i >= 1; i--) {
			resultAccelerationLeftover = resultAccelerationLeftover.sub(
				selfRelativeTree[i].getAccelerationVector(this.delta),
			);
		}

		const result = new AccelerationState(resultAccelerationLeftover, this.delta, this.getRelativeOrUndefined());

		assert(
			this.getRelativeOrUndefined() === result.getRelativeOrUndefined() &&
				other.getAbsoluteAcceleration(this.delta).equals(result.getAbsoluteAcceleration(this.delta)),
			"something wrong in the calcs!",
		);

		return result;
	}

	// Wrap super methods with current type

    override convergenceIndex(other: AccelerationState): number {
        return super.convergenceIndex(other);
    }

	override getRelative(): AccelerationState {
        return super.getRelative() as AccelerationState;
    }

	override getRelativeOrUndefined() : AccelerationState | undefined {
        return super.getRelativeOrUndefined() as AccelerationState | undefined;
    }

    override getRelativeTree(): AccelerationState[] {
        return super.getRelativeTree() as unknown as AccelerationState[];
    }

	override convergenceItem(other: AccelerationState): AccelerationState | undefined {
        return super.convergenceItem(other) as AccelerationState | undefined;
    }

	override deepClone(): AccelerationState {
		return this;
	}
}

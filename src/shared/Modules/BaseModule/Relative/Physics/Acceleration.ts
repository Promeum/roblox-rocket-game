// import { $assert } from "rbxts-transform-debug";
import Vector3D from "shared/Modules/Libraries/Vector3D";

import Physics from ".";

export default class Acceleration extends Physics {
	public readonly acceleration: Vector3D;
	public readonly delta: number;

    // Constructors

	/**
	 * Creates a new AccelerationState instance.
	 * @param acceleration The velocity change.
	 * @param delta The time over which the velocity change is applied. Defaults to 1.
	 * @param relativeTo 
	 */
	public constructor(acceleration: Vector3D, delta?: number, relativeTo?: Acceleration)

	/**
	 * Returns a modified version of accelerationState, with an altered delta.
	 * @param accelerationState The AccelerationState to alter.
	 * @param delta The delta used to alter accelerationState. Defaults to 1.
	 */
	public constructor(accelerationState: Acceleration, delta?: number)

	public constructor(arg1: Vector3D | Acceleration, arg2: number = 1, arg3?: Acceleration) {
		let accelerationVector: Vector3D;
		let delta: number;
		let relativeTo: Acceleration | undefined;

		if (arg1 instanceof Vector3D) { // Constructor 1
			accelerationVector = arg1;
			delta = arg2;
			relativeTo = arg3;
		} else { // Constructor 2
			const newAccelerationVector = arg1.vector(arg2);
			accelerationVector = newAccelerationVector;
			delta = arg2
			relativeTo = arg1.queryRelative();
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
	public add(other: Acceleration): Acceleration {
		assert(this.sameRelativeTree(other), "AccelerationState add() operands do not have the same relativeTree");

		if (this.delta !== other.delta) {
			return new Acceleration(
				this.vector(this.delta).add(other.vector(this.delta))
			);
		} else {
			return new Acceleration(
				this.acceleration.add(other.acceleration),
				this.delta,
				this.queryRelative()
			);
		}
	}

	/**
	 * Subtracts two AccelerationStates.
	 * @param other The AccelerationState to subtract to the current instance.
	 * @returns A new AccelerationState with the delta of the current instance.
	 */
	public sub(other: Acceleration): Acceleration {
		assert(this.sameRelativeTree(other), "AccelerationState sub() operands do not have the same relativeTree");

		if (this.delta !== other.delta) {
			return new Acceleration(
				this.vector(this.delta).sub(other.vector(this.delta)),
			);
		} else {
			return new Acceleration(this.acceleration.sub(other.acceleration));
		}
	}

    // Comparisons

	override equals(other?: Acceleration): other is Acceleration {
		return super.equals(other)
			&& this.acceleration.equals(other.acceleration)
			&& this.delta === other.delta;
	}

	public lessThan(other: Acceleration): boolean {
		return this.absoluteVector().magnitude() < other.absoluteVector().magnitude();
	}

	public lessOrEqual(other: Acceleration): boolean {
		return this.absoluteVector().magnitude() <= other.absoluteVector().magnitude();
	}

	// Methods

	/**
	 * Changes the delta and change in velocity
	 * while maintaining the overall acceleration force.
	 * @param delta 
	 * @returns A new AccelerationState.
	 */
	public vector(delta?: number): Vector3D {
		if (delta === undefined) {
			return this.acceleration;
		} else {
			return this.acceleration.mul(delta / this.delta);
		}
	}

	public absoluteVector(delta?: number): Vector3D {
		if (this.hasRelative()) {
			return this.vector(delta).add(this.getRelative().absoluteVector(delta));
		} else {
			return this.vector(delta);
		}
	}

    override absolute(delta: number = 1): Acceleration {
        return new Acceleration(this.absoluteVector(delta));
    }

	override consolidate(delta?: number): Acceleration {
		assert(this.hasRelative(), "consolidateOnce() cannot be called on a AccelerationState with no RelativeTo");
		const relativeTo = this.getRelative();

		return new Acceleration(
			this.vector(delta).add(relativeTo.vector(delta)),
			delta,
			relativeTo.queryRelative(),
		);
	}

	override synchronize(other: Acceleration): [Acceleration, Acceleration] {
		const convergenceItem = this.convergenceItem(other) ?? new Acceleration(new Vector3D(0, 0, 0));

		const selfTree = this.getRelativeTree();
		let selfTrimmedAcceleration = new Vector3D(0, 0, 0);

		for (let i = 0; i < this.convergenceIndex(other) - 1; i++) {
			selfTrimmedAcceleration = selfTrimmedAcceleration.add(
				selfTree[i].vector(convergenceItem.delta),
			);
		}

		const otherTree = other.getRelativeTree();
		let otherTrimmedAcceleration = new Vector3D(0, 0, 0);

		for (let i = 0; i < other.convergenceIndex(this) - 1; i++) {
			otherTrimmedAcceleration = otherTrimmedAcceleration.add(
				otherTree[i].vector(convergenceItem.delta),
			);
		}

		const selfResult = new Acceleration(
			convergenceItem.acceleration.add(selfTrimmedAcceleration),
			convergenceItem.delta,
		);
		const otherResult = new Acceleration(
			convergenceItem.acceleration.add(otherTrimmedAcceleration),
			convergenceItem.delta,
		);

		assert(
			selfResult.queryRelative() === otherResult.queryRelative() &&
				this.absoluteVector().equals(selfResult.absoluteVector()) &&
				other.absoluteVector().equals(otherResult.absoluteVector()),
			"something wrong in the calcs!",
		);

		return [selfResult, otherResult];
	}

	override matchRelative(other: Acceleration): Acceleration {
		const convergenceIndex = other.convergenceIndex(this);

		let otherIterator = other;
		let trimmings = new Vector3D(0, 0, 0);

		for (let i = 0; i < convergenceIndex - 1; i++) {
			trimmings = trimmings.add(otherIterator.vector(this.delta));
			otherIterator = otherIterator.getRelative();
		}

		const selfRelativeTree = this.getRelativeTree();

		for (let i = this.convergenceIndex(other) - 2; i >= 1; i--)
			trimmings = trimmings.sub(selfRelativeTree[i].vector(this.delta));

		const result = new Acceleration(trimmings, this.delta, this.queryRelative());

		assert(
			this.queryRelative() === result.queryRelative() &&
				other.absoluteVector(this.delta).equals(result.absoluteVector(this.delta)),
			"something wrong in the calcs!",
		);

		return result;
	}

	// Wrap super methods with current type

    override convergenceIndex(other: Acceleration): number {
        return super.convergenceIndex(other);
    }

	override getRelative(): Acceleration {
        return super.getRelative() as Acceleration;
    }

	override queryRelative() : Acceleration | undefined {
        return super.queryRelative() as Acceleration | undefined;
    }

    override getRelativeTree(): Acceleration[] {
        return super.getRelativeTree() as Acceleration[];
    }

	override convergenceItem(other: Acceleration): Acceleration | undefined {
        return super.convergenceItem(other) as Acceleration | undefined;
    }
}

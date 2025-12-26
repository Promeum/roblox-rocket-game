// import { $assert } from "rbxts-transform-debug";
import State from ".";


/**
 * TemporalState represents a hierarchical temporal relationship between relative time nodes.
 * Each TemporalState stores a time offset (`relativeTime`) and optionally a parent TemporalState (`relativeTo`).
 */
export default class TemporalState extends State {
	public readonly relativeTime: number;

	// Constructors

	/**
	 * Creates a new TemporalState instance.
	 */
	public constructor(relativeTime: number, relativeTo?: TemporalState) {
        super(relativeTo);
		this.relativeTime = relativeTime;
	}

	/**
	 * Creates a new TemporalState instance by setting the relativeTime of a TemporalState.
	 */
	public withRelativeTime(relativeTime: number): TemporalState {
		return new TemporalState(relativeTime, this.getRelativeOrUndefined());
	}

	/**
	 * Creates a new TemporalState instance by incrementing the relativeTime of a TemporalState.
	 */
	public withIncrementTime(delta: number): TemporalState {
		return this.withRelativeTime(this.relativeTime + delta);
	}

	/**
	 * Creates a new TemporalState instance with the same relativeTo tree as the one specified.
	 */
	public withAbsoluteTime(absoluteTime: number): TemporalState {
		return this.matchRelative(new TemporalState(absoluteTime));
	}

	// Arithmetic

	public add(other: TemporalState): TemporalState {
		assert(this.sameRelativeTree(other), "TemporalState.add() operands do not have the same relativeTree");
		return this.withIncrementTime(other.relativeTime);
	}

	public sub(other: TemporalState): TemporalState {
		assert(this.sameRelativeTree(other), "TemporalState.sub() operands do not have the same relativeTree");
		return this.withIncrementTime(-other.relativeTime);
	}

	// Comparisons

	public equals(other?: TemporalState): boolean {
		if (this !== undefined && other !== undefined) {
			if (this.relativeTime === other.relativeTime)
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

	public lessThan(other: TemporalState): boolean {
		return this.getAbsoluteTime() < other.getAbsoluteTime();
	}

	public lessThanOrEqual(other: TemporalState): boolean {
		return this.getAbsoluteTime() <= other.getAbsoluteTime();
	}

	// Methods

	public getAbsolute(): TemporalState {
		return new TemporalState(this.getAbsoluteTime());
	}

	public getAbsoluteTime(): number {
		if (this.hasRelative()) {
			return this.relativeTime + this.getRelative().getAbsoluteTime();
		} else {
			return this.relativeTime;
		}
	}

	/**
	 * Returns a new TemporalState relative to the current relativeTo's relativeTo.
	 *
	 * self:   a-b-c-d-self
	 * result: a-b-c-result
	 *
	 * @return The resultant TemporalState.
	 */
	public consolidateOnce(): TemporalState {
		assert(this.hasRelative(), "consolidateOnce() cannot be called on a TemporalState with no RelativeTo");
		const relativeTo = this.getRelative();
		return relativeTo.withIncrementTime(this.relativeTime);
	}

	/**
	 * Synchronizes this TemporalState with another such that they have the same RelativeTo.
	 *
	 * self:   a-b-c-d-self
	 * other:  a-b-e-other
	 * result: a-b-selfResult, a-b-otherResult
	 *
	 * @param other The other TemporalState to synchronize with.
	 * @return The synchronized TemporalStates as a tuple of self and other, in that order.
	 */
	public synchronize(other: TemporalState): [TemporalState, TemporalState] {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let synchronizedSelf: TemporalState = this;
		let synchronizedOther = other;

		let relativeToSelf = synchronizedSelf.getRelativeOrUndefined();
		let relativeToOther = synchronizedOther.getRelativeOrUndefined();

		while (relativeToSelf !== relativeToOther) {
			if (relativeToSelf === undefined || relativeToOther === undefined) {
				return [
					synchronizedSelf.getAbsolute(),
					synchronizedOther.getAbsolute(),
				];
			}

			const absoluteDifference = relativeToOther.getAbsoluteTime() - relativeToSelf.getAbsoluteTime();

			if (absoluteDifference > 0) {
				synchronizedOther = synchronizedOther.consolidateOnce();
			} else if (absoluteDifference < 0) {
				synchronizedSelf = synchronizedSelf.consolidateOnce();
			} else {
				synchronizedOther = synchronizedOther.consolidateOnce();
				synchronizedSelf = synchronizedSelf.consolidateOnce();
			}

			relativeToSelf = synchronizedSelf.getRelativeOrUndefined();
			relativeToOther = synchronizedOther.getRelativeOrUndefined();
		}

		return [synchronizedSelf, synchronizedOther];
	}

	/**
	 * Matches the RelativeTo tree of other with this TemporalState.
	 *
	 * self:   a-b-c-d-self
	 * other:  a-b-e-other
	 * result: a-b-c-d-otherResult
	 *
	 * @param other The other TemporalState to match with.
	 * @return The synchronized other TemporalState. Note: Resultant relativeTime may be negative.
	 */
	public matchRelative(other: TemporalState): TemporalState {
		const convergenceIndex = other.convergenceIndex(this);

		// consolidate other to match with self's RelativeTo tree, and track trimmed relativeTime
		let otherIterator: TemporalState = other;
		let trimmedTime = 0;

		for (let i = 0; i < convergenceIndex; i++) {
			trimmedTime += otherIterator.relativeTime;
			otherIterator = otherIterator.getRelativeOrUndefined() as TemporalState;
		}

		// subtract the time exclusively between other and self, and add the excess to the newly matched result
		const selfRelativeTree = this.getRelativeTree();
		let resultTimeLeftover = trimmedTime;

		for (let i = this.convergenceIndex(other) - 1; i >= 1; i--) {
			resultTimeLeftover -= selfRelativeTree[i].relativeTime;
		}

		const result = this.withRelativeTime(resultTimeLeftover);

		assert(
			this.getRelativeOrUndefined() === result.getRelativeOrUndefined() &&
				other.getAbsoluteTime() === result.getAbsoluteTime(),
			"Logic Error in matchRelative",
		);

		return result;
	}

	// Wrap super methods with current type

    public convergenceIndex(other: TemporalState): number {
        return super.convergenceIndex(other);
    }

	public getRelative(): TemporalState {
        return super.getRelative() as TemporalState;
    }

	public getRelativeOrUndefined() : TemporalState | undefined {
        return super.getRelativeOrUndefined() as TemporalState | undefined;
    }

    public getRelativeTree(): TemporalState[] {
        return super.getRelativeTree() as TemporalState[];
    }

	public convergenceItem(other: TemporalState): TemporalState | undefined {
        return super.convergenceItem(other) as TemporalState | undefined;
    }

}

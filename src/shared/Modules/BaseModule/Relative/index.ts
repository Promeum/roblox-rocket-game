// import { $error } from "rbxts-transform-debug";
import BaseModule from "..";

/**
 * Base type for linked-back items.
 * Immutable. Abstract.
 */
export default abstract class Relative extends BaseModule {
	private relativeTo: Relative | undefined;

	/**
	 * Creates a new Relative instance.
	 */
	protected constructor(relativeTo?: Relative) {
		super();
		this.relativeTo = relativeTo;
	}

	// Methods

	protected setRelative(relativeTo?: Relative): void {
		if (this === relativeTo) error("Relative must not be relative to itself");
		this.relativeTo = relativeTo;
	}

	public hasRelative(): boolean {
		return this.relativeTo !== undefined;
	}
	
	public getRelative(): Relative {
		if (this === this.relativeTo) error("Relative is relative to itself");
		if (this.relativeTo)
			return this.relativeTo;
		else
			error(`Relative getRelative() Cannot call getRelative() on a Relative with no relativeTo`);
	}

	public getRelativeOrUndefined(): Relative | undefined {
		if (this === this.relativeTo) error("Relative is relative to itself");
		return this.relativeTo;
	}

	/**
	 * Creates an array of references to all of
	 * the current object's relatives, starting from
	 * the current object at index 0.
	 * @returns An array of Relatives.
	 */
	public getRelativeTree(): Relative[] {
		const resultTree: Relative[] = [];

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let relative: Relative | undefined = this;
		while (relative !== undefined) {
			resultTree.push(relative);
			relative = relative.getRelativeOrUndefined();
		}

		return resultTree;
	}

	public sameRelativeTree(other: Relative): boolean {
		if (this.hasRelative() === other.hasRelative()) {
			if (this.hasRelative())
				return this.getRelative().equals(other.getRelative());
			else
				return true;
		} else {
			return false;
		}
	}

	/**
	 * Finds the index at which this and other converge
	 * within the relative tree of this.
	 * @param other The Relative to compare with.
	 * @returns A number.
	 */
	public convergenceIndex(other: Relative): number {
		const thisRelativeTree: Relative[] = this.getRelativeTree();
		const convergenceRelative: Relative | undefined = this.convergenceItem(other);

		let i: number;
		for (i = 0; i < thisRelativeTree.size(); i++) {
			const relative = thisRelativeTree[i];
			if (relative.equals(convergenceRelative))
				return i;
		}

		return i;
	}

	public convergenceItem(other: Relative): Relative | undefined {
		const thisRelativeTree: Relative[] = this.getRelativeTree();
		// Check the tree of other against the tree of self
		let otherRelative: Relative | undefined = other;
		while (otherRelative !== undefined) {
			if (thisRelativeTree.find((relative: Relative) => otherRelative!.equals(relative)))
				return otherRelative;
			otherRelative = otherRelative.getRelativeOrUndefined();
		}

		return undefined;
	}

	public length(): number {
		return this.getRelativeTree().size()
	}

	public equals(other?: Relative): other is Relative {
		return super.equals(other) && this.sameRelativeTree(other);
	}

	public abstract deepClone(): Relative
}

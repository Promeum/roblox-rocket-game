// import { $error } from "rbxts-transform-debug";
import BaseModule from "..";

/**
 * Base type for singly-linked list items.
 * Immutable. Abstract.
 */
export default abstract class Relative extends BaseModule implements Iterable<Relative> {
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
		this.relativeTo = relativeTo;
	}

	public hasRelative(): boolean {
		return this.relativeTo !== undefined;
	}
	
	public getRelative(): Relative {
		if (this.relativeTo)
			return this.relativeTo;
		else
			error(`Relative getRelative() Cannot call getRelative() on a Relative with no relativeTo`);
	}

	public getRelativeOrUndefined(): Relative | undefined {
		return this.relativeTo;
	}

	public getRelativeTree(): Relative[] {
		const resultTree: Relative[] = [];

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let relative: Relative = this;
		while (relative.hasRelative()) {
			resultTree.push(relative);
			relative = relative.getRelative();
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
		// const otherIterator: Iterable<Relative> = other[Symbol.iterator]();
		const thisRelativeTree: Relative[] = this.getRelativeTree();

		// Check the tree of other against the tree of self

		let otherRelative: Relative = other;
		while (other.hasRelative()) {
			if (thisRelativeTree.find(() => otherRelative.equals()))
				return otherRelative;
			otherRelative = other.getRelative();
		}

		return undefined;
	}

	public length(): number {
		return this.getRelativeTree().size()
	}

	*[Symbol.iterator](): IterableIterator<Relative> {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let currentRelative: Relative | undefined = this;

		while (currentRelative !== undefined) {
			yield currentRelative;
			currentRelative = currentRelative.getRelativeOrUndefined();
		}
	}

	public equals(other?: Relative): boolean {
		return this.relativeTo === other?.relativeTo;
	}

	public deepClone(): Relative {
		return super.deepClone() as Relative;
	}
	
}

import BaseModule from "..";
import Universe from "../Universe";

export default abstract class View extends BaseModule {
	public readonly viewFolder: Folder = new Instance("Folder");

	protected constructor(public readonly universe: Universe) {
		super();
		this.viewFolder.Name = "View";
	}

	public abstract draw(): void

	override equals(other?: View): other is View {
		return this === other;
	}

	override deepClone(): View {
		return this;
	}
}

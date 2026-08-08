import Vector3D from "shared/Modules/Libraries/Vector3D";
import BaseModule from "..";
import UniverseInstance from "../UniverseInstance";
import Chrono from "../Chrono";

export default abstract class View extends BaseModule {
	readonly viewFolder: Folder = new Instance("Folder");

	protected constructor(readonly universe: UniverseInstance) {
		super();
		this.viewFolder.Name = "View";
	}

	abstract draw(scale?: number, offset?: Vector3D, time?: Chrono): void

	destroy(): void {
		this.viewFolder.Destroy();
	}
}

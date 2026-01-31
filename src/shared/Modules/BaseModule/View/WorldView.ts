import Vector3D from "shared/Modules/Libraries/Vector3D";

import GravityCelestial from "../Celestial/GravityCelestial";
import Universe from "../Universe";
import View from ".";
import TerrainDisplay from "../Display/TerrainDisplay";

type viewFolder = Folder & {
	TerrainDisplay: Folder
}

export default class WorldView extends View {
	private static readonly viewFolderBase: viewFolder = new Instance("Folder") as viewFolder;

	// Initialize viewFolderBase
	static {
		this.viewFolderBase.Name = "WorldView";
	}

	declare readonly viewFolder: viewFolder;

	// Settings
	private scale: number;
	private offset: Vector3D;

	// Display data
	private readonly terrainDisplay: TerrainDisplay;

	// Constructor

	public constructor(
		universe: Universe, gravityCelestial: GravityCelestial,
		scale: number = 1 / 500_000_000, offset: Vector3D = Vector3D.zero
	) {
		super(universe);

		this.scale = scale;
		this.offset = offset;

		this.viewFolder = WorldView.viewFolderBase.Clone();
		this.viewFolder.Name = gravityCelestial.name + " " + this.viewFolder.Name;

		this.terrainDisplay = new TerrainDisplay(
			gravityCelestial, scale,
			this.offset, this.offset.negate()
		);
		this.terrainDisplay.displayFolder.Parent = this.viewFolder;
	}

	// Draw
	override draw(
		scale?: number, offset?: Vector3D
	): void {
		this.updateSettings(scale, offset);

		this.terrainDisplay.draw(scale, offset);
	}

	// Methods

	public updateSettings(
		scale?: number, offset?: Vector3D
	): void {
		if (scale !== undefined && scale <= 0)
			error("WorldView updateSettings() invalid argument(s)");

		if (scale !== undefined) this.scale = scale;
		if (offset) this.offset = offset;

		this.terrainDisplay.updateSettings(scale, offset);
	}

	// Utility methods

	override deepClone(): WorldView {
		error("WorldView deepClone() Method disabled")
	}
}

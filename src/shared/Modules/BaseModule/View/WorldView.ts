import Vector3D from "shared/Modules/Libraries/Vector3D";

import Chrono from "../Chrono";
import GravityCelestial from "../Celestial/GravityCelestial";
import Universe from "../Universe";
import View from ".";
import CompositeTrajectoryDisplay from "../Display/CompositeTrajectoryDisplay";
import TerrainDisplay from "../Display/TerrainDisplay";

type viewFolder = Folder & {
	TerrainDisplay: Folder,
	CompositeTrajectories: Folder
}

export default class WorldView extends View {
	private static readonly viewFolderBase: viewFolder = new Instance("Folder") as viewFolder;

	// Initialize viewFolderBase
	static {
		this.viewFolderBase.Name = "WorldView";
		const compositeTrajectoriesFolder: Folder = new Instance("Folder");
		compositeTrajectoriesFolder.Name = "CompositeTrajectories"
		compositeTrajectoriesFolder.Parent = this.viewFolderBase;
	}

	declare readonly viewFolder: viewFolder;

	// Settings
	private scale: number;
	private offset: Vector3D;

	// Display data
	private readonly terrainDisplay: TerrainDisplay;
	private readonly compositeTrajectoryDisplays: CompositeTrajectoryDisplay[] = [];

	// Constructor

	public constructor(
		universe: Universe, gravityCelestial: GravityCelestial,
		scale: number = 1 / 500_000_000, offset: Vector3D = Vector3D.zero
	) {
		// temp hardcoded variables
		const time = universe.time;
		const trajectoryWidth = 0.5;
		const orbitResolution = 380;

		super(universe);

		this.scale = scale;
		this.offset = offset;
		this.viewFolder = WorldView.viewFolderBase.Clone();
		this.viewFolder.Name = gravityCelestial.name + " " + this.viewFolder.Name;

		// Setup TerrainDisplay
		this.terrainDisplay = new TerrainDisplay(
			gravityCelestial, scale, this.offset, this.offset.negate()
		);
		this.terrainDisplay.displayFolder.Parent = this.viewFolder;
		
		// Setup PhysicsCelestials and their CompositeTrajectories
		for (const celestial of this.universe.allPhysicsCelestials) {
			// CompositeTrajectoryDisplay
			const compositeDisplay = new CompositeTrajectoryDisplay(celestial.trajectory);
			compositeDisplay.draw(
				this.scale, this.offset, time, undefined, undefined,
				new BrickColor("Really red").Color, trajectoryWidth,
				orbitResolution
			);
			compositeDisplay.displayFolder.Parent = this.viewFolder.CompositeTrajectories;
			this.compositeTrajectoryDisplays.push(compositeDisplay);
		}
	}

	// Draw
	override draw(
		scale?: number, offset?: Vector3D, time?: Chrono
	): void {
		this.updateSettings(scale, offset);

		this.terrainDisplay.draw(scale, offset);

		for (const compositeTrajectoryDisplay of this.compositeTrajectoryDisplays) {
			compositeTrajectoryDisplay.draw(scale, offset, time);
		}
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

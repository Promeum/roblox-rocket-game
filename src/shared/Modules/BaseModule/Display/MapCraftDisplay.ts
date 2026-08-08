import Vector3D from "shared/Modules/Libraries/Vector3D";
import Chrono from "../Chrono";
import Display from ".";
import PhysicsCelestial from "../Celestial/PhysicsCelestial";

type displayFolder = Folder & {
	Craft: Part
}

// TODO: Convert to interactive 2D icon, refactor a base MapIconDisplay
export default class MapCraftDisplay extends Display {
	private static readonly craftBasepart: Part = new Instance("Part");

	// Initialize base parts
	static {
		this.craftBasepart.Shape = Enum.PartType.Wedge;
		this.craftBasepart.Anchored = true;
		this.craftBasepart.Material = Enum.Material.Neon;
	}

	declare displayFolder: displayFolder;
	readonly celestial: PhysicsCelestial;
	readonly color: Color3;

	// Settings
	time!: Chrono;
	scale: number = 1;
	offset: Vector3D = Vector3D.zero;

	// Constructor

	constructor(celestial: PhysicsCelestial, color: Color3, partScale: number) {
		super();

		this.displayFolder.Name = celestial.name + " MapCraftDisplay";
		this.celestial = celestial;
		this.color = color;

		const craftPart: Part = MapCraftDisplay.craftBasepart.Clone();
		craftPart.Name = "Craft";
		craftPart.Size = Vector3.one.mul(partScale);
		craftPart.Color = color;
		craftPart.Parent = this.displayFolder;
		craftPart.CFrame = celestial.flyingObject.primaryPart.rigidBodies[0].part.CFrame;
	}

	// Draw

	/**
	 * Generates the display.
	 * @param scale Multiplier for all distances
	 * @param offset Applied pre-scale
	 */
	override draw(
		scale?: number, offset?: Vector3D, time?: Chrono
	): displayFolder {
		if (scale !== undefined)
			this.scale = scale;
		if (time !== undefined && time.equals(this.time))
			time = undefined;
		if (offset !== undefined && offset.equals(this.offset))
			offset = undefined;

		if (offset || time)
			this.changePosition(offset, time);

		return this.displayFolder;
	}

	// Helper methods

	/**
	 * Update positions of part and SOI
	 */
	private changePosition(offset?: Vector3D, time?: Chrono) {
		if (time !== undefined) this.time = time;
		if (offset !== undefined) this.offset = offset;
		this.displayFolder.Craft.Position = this.celestial.trajectory
			.calculateStateFromTime(this.time).getKinematic()
			.absolutePosition().add(this.offset).mul(this.scale).toVector3();
	}
}

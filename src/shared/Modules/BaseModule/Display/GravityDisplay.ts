import Vector3D from "shared/Modules/Libraries/Vector3D";

import Chrono from "../Chrono";
import GravityCelestial from "../Celestial/GravityCelestial";
import Display from ".";

type displayFolder = Folder & {
	Celestial: Part,
	SOI: Part
}

export default class GravityDisplay extends Display {
	private static readonly baseCelestialPart: Part = new Instance("Part");
	private static readonly baseSOIPart: Part = new Instance("Part");

	// Initialize base parts
	static {
		this.baseCelestialPart.Shape = Enum.PartType.Ball;
		this.baseCelestialPart.Anchored = true;
		this.baseCelestialPart.Material = Enum.Material.Neon;

		this.baseSOIPart.Shape = Enum.PartType.Ball;
		this.baseSOIPart.Anchored = true;
		this.baseSOIPart.CanCollide = false;
		this.baseSOIPart.BrickColor = new BrickColor("Steel blue");
		this.baseSOIPart.Transparency = 0.8;
		this.baseSOIPart.Material = Enum.Material.ForceField;
	}

	declare displayFolder: displayFolder;
	public readonly celestial: GravityCelestial;
	public readonly color: Color3;

	// Settings
	public time!: Chrono;
	public scale: number = 1;
	public offset: Vector3D = Vector3D.zero;

	// Constructor

	public constructor(celestial: GravityCelestial, color: Color3) {
		super();

		this.displayFolder.Name = celestial.name + " GravityDisplay";
		this.celestial = celestial;
		this.color = color;

		// Create the part for the Celestial
		const celestialPart: Part = GravityDisplay.baseCelestialPart.Clone();
		celestialPart.Name = "Celestial";
		celestialPart.Color = color;
		celestialPart.Parent = this.displayFolder;

		// Create the part for the SOI
		const SOIPart: Part = GravityDisplay.baseSOIPart.Clone();
		SOIPart.Name = "SOI";
		SOIPart.Parent = this.displayFolder;
	}

	// Draw

	/**
	 * Generates the display.
	 * @param scale Multiplier for all distances
	 * @param offset Applied pre-scale
	 */
	public draw(
		scale?: number, offset?: Vector3D, time?: Chrono
	): displayFolder {
		if (scale !== undefined && scale === this.scale)
			scale = undefined;
		if (time !== undefined && time.equals(this.time))
			time = undefined;
		if (offset !== undefined && offset.equals(this.offset))
			offset = undefined;

		if (scale !== undefined)
			this.changeScale(scale);
		if (offset || time)
			this.changePosition(offset, time);

		return this.displayFolder;
	}

	// Helper methods

	/**
	 * Update scale of part and SOI
	 */
	private changeScale(scale: number) {
		this.scale = scale;
		this.displayFolder.Celestial.Size = Vector3.one
			.mul(this.celestial.radius * 2 * this.scale);
		this.displayFolder.SOI.Size = Vector3.one
			.mul(this.celestial.SOIRadius * 2 * this.scale);
		// 2048 is max part size; make invisible if invalid size
		if (this.displayFolder.SOI.Size.Magnitude >= 2048)
			this.displayFolder.SOI.Transparency = 1;
		else
			this.displayFolder.SOI.Transparency = 0;
	}

	/**
	 * Update positions of part and SOI
	 */
	private changePosition(offset?: Vector3D, time?: Chrono) {
		if (time !== undefined) this.time = time;
		if (offset !== undefined) this.offset = offset;
		this.displayFolder.Celestial.Position = this.celestial.trajectory
			.calculateStateFromTime(this.time).getKinematic()
			.absolutePosition().add(this.offset).mul(this.scale).toVector3();
		this.displayFolder.SOI.Position = this.displayFolder.Celestial.Position;
	}
}

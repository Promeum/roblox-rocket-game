import Vector3D from "shared/Modules/Libraries/Vector3D";

import TemporalState from "../Relative/State/TemporalState";
import GravityCelestial from "../Celestial/GravityCelestial";
import Display from ".";

type displayFolder = Folder & {
	CelestialPart: Part,
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
	private time: TemporalState;
	private scale: number = 1;
	private offset: Vector3D = Vector3D.zero;

	// Constructor

	public constructor(
		celestial: GravityCelestial, color: Color3,
		time: TemporalState, scale?: number, offset?: Vector3D
	) {
		super();

		this.displayFolder.Name = celestial.name + " GravityDisplay";
		this.celestial = celestial;
		this.color = color;
		this.time = time;
		this.updateSettings(undefined, scale, offset);

		// Create the Celestial
		const celestialPart: Part = GravityDisplay.baseCelestialPart.Clone();
		celestialPart.Name = "CelestialPart";
		celestialPart.Color = color;
		celestialPart.Size = Vector3.one.mul(celestial.radius * 2 * this.scale);
		celestialPart.Position = celestial.trajectory.calculateStateFromTime(time)
			.getKinematic().getAbsolutePosition().add(this.offset).mul(this.scale).toVector3();

		celestialPart.Parent = this.displayFolder;

		// Create the SOI
		const SOIPart: Part = GravityDisplay.baseSOIPart.Clone();
		SOIPart.Name = "SOI";
		SOIPart.Size = Vector3D.one
			.mul(celestial.SOIRadius * 2 * this.scale).toVector3();
		SOIPart.Position = celestialPart.Position;

		SOIPart.Parent = this.displayFolder;
	}

	// Draw

	/**
	 * Generates the display.
	 * @param scale Multiplier for all distances
	 * @param offset Applied pre-scale
	 */
	public draw(
		scale?: number, offset?: Vector3D, time?: TemporalState
	): displayFolder {
		this.updateSettings(time, scale, offset);

		// update part scale
		this.displayFolder.CelestialPart.Size = Vector3.one.mul(this.celestial.radius * 2 * this.scale);
		this.displayFolder.SOI.Size = Vector3.one.mul(this.celestial.SOIRadius * 2 * this.scale);
		if (this.displayFolder.SOI.Size.Magnitude >= 2048)
			this.displayFolder.SOI.Transparency = 1;
		else
			this.displayFolder.SOI.Transparency = 0;

		// update part positions
		this.displayFolder.CelestialPart.Position = this.celestial.trajectory
			.calculateStateFromTime(this.time).getKinematic().getAbsolutePosition()
			.add(this.offset).mul(this.scale).toVector3();
		this.displayFolder.SOI.Position = this.displayFolder.CelestialPart.Position;

		return this.displayFolder;
	}

	// Methods

	public updateSettings(
		time?: TemporalState, scale?: number, offset?: Vector3D
	): void {
		if (scale !== undefined && scale <= 0)
			error("GravityDisplay updateSettings() invalid argument(s)");

		if (time) this.time = time;
		if (scale !== undefined) this.scale = scale;
		if (offset) this.offset = offset;
	}
}

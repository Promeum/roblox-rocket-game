import Vector3D from "shared/Modules/Libraries/Vector3D";

import Datamap from "../../Datamap";
import GravityCelestial from "../../Celestial/GravityCelestial";
import Display from "..";
import Orientation from "../../Orientation";

import { // eslint-disable-next-line @typescript-eslint/no-unused-vars
	Tetra, TetraTri, TetraPolyCenter, // eslint-disable-next-line @typescript-eslint/no-unused-vars
	TetraPolyBottom, TetraPolyTop, PartPosSize
} from "./Tetra";

type displayFolder = Folder & {TerrainFolder: Model}

export default class TerrainDisplay extends Display {
	static readonly displayFolderBase: displayFolder = new Instance("Folder") as displayFolder;

	// Initialize displayFolderBase
	static {
		this.displayFolderBase.Name = "TerrainDisplay";
		const model = new Instance("Model");
		model.Name = "TerrainFolder";
		// const primaryPart = new Instance("Part");
		// primaryPart.Name = "PrimaryPart";
		// primaryPart.Anchored = true;
		// primaryPart.Parent = model;
		// model.PrimaryPart = primaryPart;
		model.Parent = this.displayFolderBase;
	}

	declare readonly displayFolder: displayFolder;
	private readonly terrainFolder: Model;

	// Settings
	private scale: number;// = 1 / 500_000_000; // 1 / 5_000_000;
	private scaleChanged: boolean = true;
	private offset: Vector3D;
	public renderPosition: Vector3D;
	private startLongLat: [number, number];
	private startCoords: [number, number];
	public waterLevel = 12//128; // temp hardcoded variable

	// Display data
	private readonly gravityCelestial: GravityCelestial;
	public readonly heightmap: Datamap;
	private readonly heightMultiplier: number; // Will delete in future when get better heightmaps
	private poly1: TetraPolyCenter; // front
	// private poly2: TetraPolyCenter; // bottom
	// private poly3: TetraPolyCenter; // left
	// private poly4: TetraPolyCenter; // right
	private ppss: PartPosSize[] = [];

	// Constructor

	public constructor(
		gravityCelestial: GravityCelestial,
		scale: number = 1 / 500_000_000, offset: Vector3D = Vector3D.zero,
		renderPosition: Vector3D = new Vector3D(gravityCelestial.radius,0,0)
	) {
		super();

		this.displayFolder = TerrainDisplay.displayFolderBase.Clone();
		this.terrainFolder = this.displayFolder.TerrainFolder;
		this.gravityCelestial = gravityCelestial;
		this.heightmap = this.gravityCelestial.heightmap;
		this.scale = scale;
		this.offset = offset;

		this.renderPosition = renderPosition;
		this.startLongLat = this.pointToLongLat(this.renderPosition);
		this.startCoords = this.longLatToCoords(...this.startLongLat);

		this.heightMultiplier = 1/3 * 98.8
			* (math.exp(1) ** -(this.gravityCelestial.radius / 10e5))
			* this.gravityCelestial.radius;

		// calculate initial tetrahedron points
		const radius = this.gravityCelestial.radius;
		// const startOffset = CFrame.Angles(0, this.startLongLat[0], this.startLongLat[1]);

		// let back = new Vector3D(-1, 0, 0).mul(radius);
		let top = new Vector3D(1 / 3, 2 * math.sqrt(2) / 3, 0).mul(radius);
		let left = new Vector3D(1 / 3, -math.sqrt(2) / 3, -math.sqrt(6) / 3).mul(radius);
		let right = new Vector3D(1 / 3, -math.sqrt(2) / 3, math.sqrt(6) / 3).mul(radius);

		// back = Orientation.axisRotation(
		// 	Orientation.axisRotation(back, Vector3D.yAxis, this.startLongLat[0]),
		// 	Orientation.axisRotation(Vector3D.zAxis, Vector3D.yAxis, this.startLongLat[0]),
		// 	this.startLongLat[1]
		// );
		top = Orientation.axisRotation(
			Orientation.axisRotation(top, Vector3D.yAxis, this.startLongLat[0]),
			Orientation.axisRotation(Vector3D.zAxis, Vector3D.yAxis, this.startLongLat[0]),
			this.startLongLat[1]
		);
		left = Orientation.axisRotation(
			Orientation.axisRotation(left, Vector3D.yAxis, this.startLongLat[0]),
			Orientation.axisRotation(Vector3D.zAxis, Vector3D.yAxis, this.startLongLat[0]),
			this.startLongLat[1]
		);
		right = Orientation.axisRotation(
			Orientation.axisRotation(right, Vector3D.yAxis, this.startLongLat[0]),
			Orientation.axisRotation(Vector3D.zAxis, Vector3D.yAxis, this.startLongLat[0]),
			this.startLongLat[1]
		);

		// instantiate tetras
		this.poly1 = new TetraPolyCenter(this, [top, left, right], 0); // 18, 2);
		// this.poly2 = new TetraPolyBottom(this, [back, right, left], 2, 5); // 2, 3);
		// this.poly3 = new TetraPolyBottom(this, [back, left, top], 2, 5); // 2, 3);
		// this.poly4 = new TetraPolyBottom(this, [back, top, right], 2, 5); // 2, 3);

		for (const tetra of [this.poly1/*, this.poly2, this.poly3, this.poly4*/]) {
			tetra.tetraFolder.Parent = this.terrainFolder;
			for (const pps of tetra.getPartsPositionsSizes()) {
				// pps[0].WeldConstraint.Part1 = this.terrainFolder.PrimaryPart;
				this.ppss.push(pps);
			}
		}
	}

	// Draw

	/**
	 * @param offset Relative to global space
	 * @param renderDistance Maximum distance to render terrain
	 * @param renderPosition Relative to center of this GravityCelestial
	 */
	override draw(
		scale?: number, offset?: Vector3D,
		renderPosition?: Vector3D
	): Folder {
		this.updateSettings(scale, offset, renderPosition);

// Without BulkMoveTo()
// 		if (this.scaleChanged) {
// 			this.terrainFolder.ScaleTo(this.scale); // Scale positions
// debug.profilebegin("Manual resizing")
// 			for (const pps of this.ppss) {
// 				// Scale sizes (since they may have been maxxed out at 2048)
// 				pps[0].Size = pps[2].mul(this.scale);//.toVector3();
// 			}
// debug.profileend()
// 		}
// 		this.scaleChanged = false;

// 		this.terrainFolder.PivotTo(new CFrame(this.offset.mul(this.scale).toVector3()));

		const bulkMoveData: [WedgePart[], CFrame[]] = [[], []];
// debug.profilebegin("Manual resizing")
		for (const pps of this.ppss) {
			bulkMoveData[0].push(pps[0]);
			bulkMoveData[1].push(CFrame.fromMatrix(
				pps[1].add(this.offset).mul(this.scale).toVector3(), ...pps[3]
			));
			// Scale sizes (since they may have been maxxed out at 2048)
			if (this.scaleChanged) {
				pps[0].Size = pps[2].mul(this.scale);
			}
		}
// debug.profileend()
		this.scaleChanged = false;

		game.Workspace.BulkMoveTo(
			bulkMoveData[0], bulkMoveData[1],
			Enum.BulkMoveMode.FireCFrameChanged
		);

		return this.displayFolder;
	}

	// Methods

	/**
	 * @param relativePosition Position relative to the GravityCelestial
	 * @returns Longitude and latitude, respectively.
	 */
	public pointToLongLat(relativePosition: Vector3D | Vector3): [number, number] {
		const longitude = math.atan2(-relativePosition.Z, relativePosition.X);
		const latitude = math.atan2(
			relativePosition.Y,
			math.sqrt(relativePosition.X ** 2 + relativePosition.Z ** 2)
		);

		return [longitude, latitude];
	}

	public pointToCoords(relativePosition: Vector3D | Vector3): [number, number] {
		return this.longLatToCoords(...this.pointToLongLat(relativePosition));
	}

	public coordsToLongLat(x: number, y: number): [number, number] {
		// Values in radians
		const longitude = (x / this.heightmap.dimensionSizes[0] - 0.5) * 2 * math.pi;
		const latitude = (0.5 - y / this.heightmap.dimensionSizes[1]) * math.pi;

		return [longitude, latitude];
	}

	public longLatToCoords(longitude: number, latitude: number): [number, number] {
		const x = (longitude / (2 * math.pi) + 0.5) * this.heightmap.dimensionSizes[0];
		const y = (latitude / math.pi - 0.5) * this.heightmap.dimensionSizes[1];

		return [x, y];
	}

	/**
	 * Projects a point from x & y + altitude
	 * @param altitude Units in GravityCelestial radii
	 */
	private projectCoords(x: number, y: number, altitude: number): Vector3D {
		const [longitude, latitude] = this.coordsToLongLat(x, y);
		return this.projectLongLat(longitude, latitude, altitude);
	}

	/**
	 * Projects a point from longitude & latitude + altitude
	 * @param altitude Units in GravityCelestial radii
	 */
	public projectLongLat(longitude: number, latitude: number, altitude: number): Vector3D {
		const latRotation = new Vector3D(
			this.gravityCelestial.radius * math.cos(latitude),
			this.gravityCelestial.radius * math.sin(latitude),
			0
		);
		const longRotation = new Vector3D(
			latRotation.X * math.cos(longitude),
			latRotation.Y,
			latRotation.X * -math.sin(longitude)
		);
		return longRotation.mul(altitude / this.gravityCelestial.radius + 1);
	}

	/** Projects a point with altitude taken from heightmap */
	public projectHeightmapCoords(x: number, y: number): Vector3D {
		const relativeHeight = this.heightmap.bicubicInterp(x, y);
		const projectedPoint = this.projectCoords(
			x, y, (relativeHeight / 255) * this.heightMultiplier
		);
		return projectedPoint;
	}

	/**
	 * Projects a point with altitude taken from heightmap.
	 * Altitude determined by `heightMultiplier`.
	*/
	public projectHeightmapLongLat(longitude: number, latitude: number): Vector3D {
		const rawHeight = this.heightmap.bicubicInterp(
			...this.longLatToCoords(longitude, latitude)
		);
		const projectedPoint = this.projectLongLat(
			longitude, latitude, (rawHeight / 255) * this.heightMultiplier
		);
		return projectedPoint;
	}

	public updateSettings(
		scale?: number, offset?: Vector3D,
		renderPosition?: Vector3D
	): void {
		if (scale !== undefined && scale <= 0)
			error("TerrainDisplay updateSettings() invalid argument(s)");

		if (scale !== undefined) {
			this.scale = scale;
			this.scaleChanged = true;
		}

		if (offset) this.offset = offset;
		if (renderPosition) {
			this.renderPosition = renderPosition;
			this.startLongLat = this.pointToLongLat(this.renderPosition);
			this.startCoords = this.longLatToCoords(...this.startLongLat); // (500, 250)
		}
	}
}

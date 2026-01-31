import Vector3D from "shared/Modules/Libraries/Vector3D";

import Datamap from "../Datamap";
import GravityCelestial from "../Celestial/GravityCelestial";
import Display from ".";
import Orientation from "../Orientation";

export default class TerrainDisplay extends Display {
	static readonly displayFolderBase = new Instance("Folder");
	static readonly wedgeBase: WedgePart = new Instance("WedgePart");

	// Initialize displayFolderBase
	static {
		this.displayFolderBase.Name = "TerrainDisplay";
		this.wedgeBase.Name = "TerrainDisplay Wedge";
		this.wedgeBase.Anchored = true;
		this.wedgeBase.CastShadow = false;
		// this.wedgeBase.Material = Enum.Material.Ground;
		this.wedgeBase.Material = Enum.Material.SmoothPlastic;
	}

	declare readonly displayFolder;

	// Settings
	private scale: number;// = 1 / 500_000_000; // 1 / 5_000_000;
	private offset: Vector3D;
	private renderPosition: Vector3D;
	private startLongLat: [number, number];
	private startCoords: [number, number];
	public waterLevel = 12//128; // temp hardcoded variable

	// Display data
	private readonly gravityCelestial: GravityCelestial;
	public readonly heightmap: Datamap;
	private readonly heightMultiplier: number; // Will delete in future when get better heightmaps
	private poly1: TetraPolyCenter; // front
	private poly2: TetraPolyCenter; // bottom
	private poly3: TetraPolyCenter; // left
	private poly4: TetraPolyCenter; // right

	// Constructor

	public constructor(
		gravityCelestial: GravityCelestial,
		scale: number = 1 / 500_000_000, offset: Vector3D = Vector3D.zero,
		renderPosition: Vector3D = new Vector3D(gravityCelestial.radius,0,0)
	) {
		super();

		this.displayFolder = TerrainDisplay.displayFolderBase.Clone();
		this.gravityCelestial = gravityCelestial;
		this.heightmap = this.gravityCelestial.heightmap;
		this.scale = scale;
		this.offset = offset;

		this.renderPosition = renderPosition;
		this.startLongLat = this.pointToLongLat(this.renderPosition);
		this.startCoords = this.longLatToCoords(...this.startLongLat);
print(this.startLongLat)

		this.heightMultiplier = 1/3 * 10
			* (math.exp(1) ** -(this.gravityCelestial.radius / 10e5))
			* this.gravityCelestial.radius;

		// calculate initial tetrahedron points
		const radius = this.gravityCelestial.radius;
		// const startOffset = CFrame.Angles(0, this.startLongLat[0], this.startLongLat[1]);

		let back = new Vector3D(-1, 0, 0).mul(radius);
		let top = new Vector3D(1 / 3, 2 * math.sqrt(2) / 3, 0).mul(radius);
		let left = new Vector3D(1 / 3, -math.sqrt(2) / 3, -math.sqrt(6) / 3).mul(radius);
		let right = new Vector3D(1 / 3, -math.sqrt(2) / 3, math.sqrt(6) / 3).mul(radius);

		back = Orientation.axisRotation(
			Orientation.axisRotation(back, Vector3D.yAxis, this.startLongLat[0]),
			Orientation.axisRotation(Vector3D.zAxis, Vector3D.yAxis, this.startLongLat[0]),
			this.startLongLat[1]
		);
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
		this.poly1 = new TetraPolyCenter(this, [top, left, right], 18, 6);
		this.poly2 = new TetraPolyBottom(this, [back, right, left], 2, 3);
		this.poly3 = new TetraPolyBottom(this, [back, left, top], 2, 3);
		this.poly4 = new TetraPolyBottom(this, [back, top, right], 2, 3);

		for (const tetra of [this.poly1, this.poly2, this.poly3, this.poly4]) {
			tetra.tetraFolder.Parent = this.displayFolder;
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

		this.poly1.draw(this.scale, this.offset);
		this.poly2.draw(this.scale, this.offset);
		this.poly3.draw(this.scale, this.offset);
		this.poly4.draw(this.scale, this.offset);

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
		const relativeHeight = this.heightmap.bilinearInterp(x, y);
		const projectedPoint = this.projectCoords(
			x, y, (relativeHeight / 255) * this.heightMultiplier
		);
		return projectedPoint;
	}

	/** Projects a point with altitude taken from heightmap */
	public projectHeightmapLongLat(longitude: number, latitude: number): Vector3D {
		const rawHeight = this.heightmap.bilinearInterp(
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

		if (scale !== undefined) this.scale = scale;
		if (offset) this.offset = offset;
		if (renderPosition) {
			this.renderPosition = renderPosition;
			this.startLongLat = this.pointToLongLat(this.renderPosition);
			this.startCoords = this.longLatToCoords(...this.startLongLat); // (500, 250)
		}
	}

	override deepClone(): TerrainDisplay {
		error("TerrainDisplay deepClone() Method disabled")
	}
}

// Utility methods

function colorFromAltitude(rawAltitude: number, waterLevel: number): Color3 {
	if (rawAltitude <= waterLevel)
		return Color3.fromRGB(0, 0, 255);
	else
		return Color3.fromHSV(.33, .75,
			(rawAltitude - waterLevel) / (255 - waterLevel));
}

/**
 * Original Luau algorithm from
 * https://github.com/EgoMoose/Articles/blob/master/3d%20triangles/3D%20triangles.md
 */
function generatePolygon(
	wedge1: WedgePart, wedge2: WedgePart,
	a: Vector3, b: Vector3, c: Vector3
): [WedgePart, WedgePart] {
	let [ab, ac, bc] = [b.sub(a), c.sub(a), c.sub(b)];
	const [abd, acd, bcd] = [ab.Dot(ab), ac.Dot(ac), bc.Dot(bc)];

	if (abd > acd && abd > bcd) {
		[c, a] = [a, c];
	} else if (acd > bcd && acd > abd) {
		[a, b] = [b, a];
	}

	[ab, ac, bc] = [b.sub(a), c.sub(a), c.sub(b)];

	const right = ac.Cross(ab).Unit;
	const up = bc.Cross(right).Unit;
	const back = bc.Unit;

	const height = math.abs(ab.Dot(up))

	wedge1.Size = new Vector3(0, height, math.abs(ab.Dot(back)));
	wedge1.CFrame = CFrame.fromMatrix((a.add(b)).div(2), right, up, back);

	wedge2.Size = new Vector3(0, height, math.abs(ac.Dot(back)));
	wedge2.CFrame = CFrame.fromMatrix(
		(a.add(c)).div(2), Vector3.zero.sub(right),
		up, Vector3.zero.sub(back));

	return [wedge1, wedge2];
}

function midpoint(p1: Vector3D | Vector3, p2: Vector3D | Vector3): Vector3D {
	return new Vector3D((p1.X + p2.X) / 2, (p1.Y + p2.Y) / 2, (p1.Z + p2.Z) / 2);
}

// Tetrahedron draw classes

abstract class Tetra {
	declare public readonly tetraFolder: Folder;
	public display: TerrainDisplay

	constructor(display: TerrainDisplay) {
		this.display = display;
	}

	abstract draw(scale: number, offset: Vector3D): Folder
}

class TetraTri extends Tetra {
	private static readonly folderBase = new Instance("Folder");
	static {this.folderBase.Name = "TetraTri"}

	public readonly tetraFolder = TetraTri.folderBase.Clone();
	public readonly projected: [Vector3D, Vector3D, Vector3D];
	private terrainPolygon: [WedgePart, WedgePart];

	constructor(
		display: TerrainDisplay,
		points: [Vector3D, Vector3D, Vector3D]
	) {
		super(display);

		// find color at triangle centerpoint
		const centerPoint = midpoint(midpoint(points[0], points[1]), points[2]);
		const center = this.display.pointToLongLat(centerPoint);
		const color = colorFromAltitude(
			this.display.heightmap.bilinearInterp(
				...this.display.longLatToCoords(...center)
			),
			this.display.waterLevel
		);

		// project points to sphere
		this.projected = points.map(
			p => this.display.projectHeightmapLongLat(
				...this.display.pointToLongLat(p)
			)
		) as [Vector3D, Vector3D, Vector3D];

		// pregenerate terrain polygon
		this.terrainPolygon = [
			TerrainDisplay.wedgeBase.Clone(),
			TerrainDisplay.wedgeBase.Clone()
		];

		this.terrainPolygon[0].Color = this.terrainPolygon[1].Color = color;
		this.terrainPolygon[0].Parent = this.terrainPolygon[1].Parent = this.tetraFolder;
	}

	draw(scale: number, offset: Vector3D): Folder {
		// generate terrain polygon
		this.terrainPolygon = generatePolygon(
			this.terrainPolygon[0], this.terrainPolygon[1],
			this.projected[0].add(offset).mul(scale).toVector3(),
			this.projected[1].add(offset).mul(scale).toVector3(),
			this.projected[2].add(offset).mul(scale).toVector3(),
		);

		return this.tetraFolder;
	}
}

abstract class TetraPoly extends Tetra {
	declare protected tetra1: Tetra; // center
	declare protected tetra2: Tetra; // top
	declare protected tetra3: Tetra; // left
	declare protected tetra4: Tetra; // right
}

class TetraPolyCenter extends TetraPoly {
	protected static readonly folderBase = new Instance("Folder");
	static {this.folderBase.Name = "TetraPolyCenter"}

	public readonly tetraFolder: Folder = TetraPolyCenter.folderBase.Clone();

	constructor(
		display: TerrainDisplay,
		points: [Vector3D, Vector3D, Vector3D],
		depth: number, subdivisions: number = 0
	) {
		super(display);

		// choose points of inner triangles
		const center: [Vector3D, Vector3D, Vector3D] = [
			midpoint(points[1], points[2]),
			midpoint(points[0], points[2]),
			midpoint(points[0], points[1])
		];
		// orient bottom towards center
		const top: [Vector3D, Vector3D, Vector3D] = [
			points[0], center[2], center[1]
		];
		const left: [Vector3D, Vector3D, Vector3D] = [
			points[1], center[0], center[2]
		];
		const right: [Vector3D, Vector3D, Vector3D] = [
			points[2], center[1], center[0]
		];
// if(depth===3||subdivisions===3)task.wait(0)
		// calculate inner tetra
		if (subdivisions > 0) {
			const nextSubdivision = subdivisions - 1;
			this.tetra1 = new TetraPolyCenter(display, center, depth, nextSubdivision);
			this.tetra2 = new TetraPolyBottom(display, top, 0, nextSubdivision);
			this.tetra4 = new TetraPolyBottom(display, right, 0, nextSubdivision);
			this.tetra3 = new TetraPolyBottom(display, left, 0, nextSubdivision);
		} else if (depth > 0) {
			const nextDepth = depth - 1;
			this.tetra1 = new TetraPolyCenter(display, center, nextDepth);
			this.tetra2 = new TetraTri(display, top);
			this.tetra4 = new TetraTri(display, right);
			this.tetra3 = new TetraTri(display, left);
		} else {
			this.tetra1 = new TetraTri(display, center);
			this.tetra2 = new TetraTri(display, top);
			this.tetra4 = new TetraTri(display, right);
			this.tetra3 = new TetraTri(display, left);
		}

		for (const tetra of [this.tetra1, this.tetra2, this.tetra3, this.tetra4]) {
			tetra.tetraFolder.Parent = this.tetraFolder;
		}
	}

	draw(scale: number, offset: Vector3D): Folder {
		this.tetra1.draw(scale, offset);
		this.tetra2.draw(scale, offset);
		this.tetra4.draw(scale, offset);
		this.tetra3.draw(scale, offset);

		return this.tetraFolder;
	}
}

class TetraPolyUprightHelper {
	public readonly center: [Vector3D, Vector3D, Vector3D];
	public readonly top: [Vector3D, Vector3D, Vector3D];
	public readonly left: [Vector3D, Vector3D, Vector3D];
	public readonly right: [Vector3D, Vector3D, Vector3D];

	/**
	 * @param points [top, left, right]
	 */
	constructor(points: [Vector3D, Vector3D, Vector3D]) {
		// choose points of inner triangles
		this.center = [
			midpoint(points[1], points[2]),
			midpoint(points[0], points[2]),
			midpoint(points[0], points[1])
		];
		// orient upright
		this.top = [points[0], this.center[2], this.center[1]];
		this.left = [this.center[2], points[1], this.center[0]];
		this.right = [this.center[1], this.center[0], points[2]];
	}
}

class TetraPolyTop extends TetraPoly {
	protected static readonly folderBase = new Instance("Folder");
	static {this.folderBase.Name = "TetraPolyTop"}

	public readonly tetraFolder: Folder = TetraPolyTop.folderBase.Clone();

	constructor(
		display: TerrainDisplay,
		points: [Vector3D, Vector3D, Vector3D],
		depth: number, subdivisions: number = 0
	) {
		super(display);
// if(depth===3||subdivisions===3)task.wait(0)
		// choose points of inner triangles
		const triangle = new TetraPolyUprightHelper(points);

		// calculate inner tetra
		if (subdivisions > 0) {
			const nextSubdivision = subdivisions - 1;
			this.tetra2 = new TetraPolyTop(display, triangle.top, depth, nextSubdivision);
			this.tetra4 = new TetraPolyTop(display, triangle.right, 0, nextSubdivision);
			this.tetra1 = new TetraPolyBottom(display, triangle.center, 0, nextSubdivision);
			this.tetra3 = new TetraPolyTop(display, triangle.left, 0, nextSubdivision);
		} else if (depth > 0) {
			const nextDepth = depth - 1;
			this.tetra2 = new TetraPolyTop(display, triangle.top, nextDepth);
			this.tetra4 = new TetraTri(display, triangle.right);
			this.tetra1 = new TetraTri(display, triangle.center);
			this.tetra3 = new TetraTri(display, triangle.left);
		} else {
			this.tetra2 = new TetraTri(display, triangle.top);
			this.tetra4 = new TetraTri(display, triangle.right);
			this.tetra1 = new TetraTri(display, triangle.center);
			this.tetra3 = new TetraTri(display, triangle.left);
		}

		for (const tetra of [this.tetra1, this.tetra2, this.tetra3, this.tetra4]) {
			tetra.tetraFolder.Parent = this.tetraFolder;
		}
	}

	draw(scale: number, offset: Vector3D): Folder {
		this.tetra2.draw(scale, offset);
		this.tetra4.draw(scale, offset);
		this.tetra1.draw(scale, offset);
		this.tetra3.draw(scale, offset);

		return this.tetraFolder;
	}
}

class TetraPolyBottom extends TetraPoly {
	protected static readonly folderBase = new Instance("Folder");
	static {this.folderBase.Name = "TetraPolyBottom"}

	public readonly tetraFolder: Folder = TetraPolyBottom.folderBase.Clone();

	constructor(
		display: TerrainDisplay,
		points: [Vector3D, Vector3D, Vector3D],
		depth: number, subdivisions: number = 0
	) {
		super(display);

		// choose points of inner triangles
		const triangle = new TetraPolyUprightHelper(points);

		// calculate inner tetra
		if (subdivisions > 0) {
			const nextSubdivision = subdivisions - 1;
			this.tetra3 = new TetraPolyBottom(display, triangle.left, depth, nextSubdivision);
			this.tetra1 = new TetraPolyTop(display, triangle.center, depth, nextSubdivision);
			this.tetra4 = new TetraPolyBottom(display, triangle.right, depth, nextSubdivision);
			this.tetra2 = new TetraPolyBottom(display, triangle.top, 0, nextSubdivision);
		} else if (depth > 0) {
			const nextDepth = depth - 1;
			this.tetra3 = new TetraPolyBottom(display, triangle.left, nextDepth);
			this.tetra1 = new TetraPolyTop(display, triangle.center, nextDepth);
			this.tetra4 = new TetraPolyBottom(display, triangle.right, nextDepth);
			this.tetra2 = new TetraTri(display, triangle.top);
		} else {
			this.tetra3 = new TetraTri(display, triangle.left);
			this.tetra1 = new TetraTri(display, triangle.center);
			this.tetra4 = new TetraTri(display, triangle.right);
			this.tetra2 = new TetraTri(display, triangle.top);
		}

		for (const tetra of [this.tetra1, this.tetra2, this.tetra3, this.tetra4]) {
			tetra.tetraFolder.Parent = this.tetraFolder;
		}
	}

	draw(scale: number, offset: Vector3D): Folder {
		this.tetra3.draw(scale, offset);
		this.tetra1.draw(scale, offset);
		this.tetra4.draw(scale, offset);
		this.tetra2.draw(scale, offset);

		return this.tetraFolder;
	}
}

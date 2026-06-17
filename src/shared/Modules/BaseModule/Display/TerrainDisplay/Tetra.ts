/*
	Helper classes for TerrainDisplay.
*/

import Vector3D from "shared/Modules/Libraries/Vector3D";

import type TerrainDisplay from ".";

// Utility constants

const wedgeBase: WedgePart = new Instance("WedgePart");
wedgeBase.Name = "TerrainDisplay Wedge";
wedgeBase.Anchored = true;
// wedgeBase.CastShadow = false;
// wedgeBase.CanTouch = wedgeBase.CanQuery = wedgeBase.CanCollide = false;
// wedgeBase.Material = Enum.Material.Ground;
wedgeBase.Material = Enum.Material.SmoothPlastic;

// Utility functions

/**
 * Midpoint of 2 vectors
 */
function midpoint(p1: Vector3D | Vector3, p2: Vector3D | Vector3): Vector3D {
	return new Vector3D((p1.X + p2.X) / 2, (p1.Y + p2.Y) / 2, (p1.Z + p2.Z) / 2);
}

/**
 * Centerpoint of 3 vectors
 */
function centerpoint(p1: Vector3D | Vector3, p2: Vector3D | Vector3, p3: Vector3D | Vector3): Vector3D {
	return new Vector3D(
		(p1.X + p2.X + p3.X) / 3,
		(p1.Y + p2.Y + p3.Y) / 3,
		(p1.Z + p2.Z + p3.Z) / 3
	);
}

/**
 * Corrects the altitude of `center`, returning a new `Vector3D`.
 */
function projectedPoint(display: TerrainDisplay, center: Vector3D): Vector3D {
	return display.projectHeightmapLongLat(...display.pointToLongLat(center));
}

/**
 * Calculates Tetra subdivision level based on distance from camera.
 * @param renderPosition Location of the camera
 * @param center Centerpoint of a `Tetra`
 * @returns Subdivision level
 */
function renderDepth(renderPosition: Vector3D, center: Vector3D): number {
	const distance = renderPosition.sub(center).magnitude();
	if (distance < 40_000) {
		// return math.min(
		// 	// see desmos graph
		// 	math.floor(23.4 / (distance / 10000 + 1.45) + 2.8),
		// 	15
		// );
		return math.clamp(
			math.floor(23.4 / (distance / 10000 + 1.45) + 2.8),
			13, 15
		);
	} else {
		return 0;
	}

	// if (distance < 20_000) {
	// 	return 14;
	// } else if (distance < 100_000) {
	// 	return 8;
	// } else if (distance < 1_000_000) {
	// 	return 6;
	// } else {
	// 	return 4;
	// }

	// if (distance < 5_000) {
	// 	return 16;
	// } else if (distance < 20_000) {
	// 	return 11;
	// } else if (distance < 100_000) {
	// 	return 9;
	// } else if (distance < 1_000_000) {
	// 	return 4;
	// } else {
	// 	return 2;
	// }
}

function colorFromAltitude(rawAltitude: number, waterLevel: number): Color3 {
	return Color3.fromRGB(math.random(0,255),math.random(0,255),math.random(0,255))
	// if (rawAltitude <= waterLevel)
	// 	return Color3.fromRGB(0, 0, 255);
	// else
	// 	return Color3.fromHSV(.33, .75,
	// 		(rawAltitude - waterLevel) / (255 - waterLevel));
}

/**
 * Original Luau algorithm from
 * https://github.com/EgoMoose/Articles/blob/master/3d%20triangles/3D%20triangles.md
 */
function generatePolygon(
	wedge1: WedgePart, wedge2: WedgePart,
	a: Vector3D, b: Vector3D, c: Vector3D
): [PartPosSize, PartPosSize] {
	let [ab, ac, bc] = [b.sub(a), c.sub(a), c.sub(b)];
	const [abd, acd, bcd] = [ab.dot(ab), ac.dot(ac), bc.dot(bc)];

	if (abd > acd && abd > bcd) {
		[c, a] = [a, c];
	} else if (acd > bcd && acd > abd) {
		[a, b] = [b, a];
	}

	[ab, ac, bc] = [b.sub(a), c.sub(a), c.sub(b)];

	const right = ac.cross(ab).unit();
	const up = bc.cross(right).unit();
	const back = bc.unit();

	const height = math.abs(ab.dot(up))

	const size1 = new Vector3D(0, height, math.abs(ab.dot(back)));
	const pos1 = (a.add(b)).div(2);
	wedge1.CFrame = CFrame.fromMatrix(
		pos1.toVector3(),
		right.toVector3(),
		up.toVector3(),
		back.toVector3()
	);

	const size2 = new Vector3D(0, height, math.abs(ac.dot(back)));
	const pos2 = (a.add(c)).div(2);
	wedge2.CFrame = CFrame.fromMatrix(
		pos2.toVector3(),
		right.negate().toVector3(),
		up.toVector3(),
		back.negate().toVector3()
	);

	return [
		[wedge1 as PartPosSize[0], pos1, size1.toVector3(), [right.toVector3(), up.toVector3(), back.toVector3()]],
		[wedge2 as PartPosSize[0], pos2, size2.toVector3(), [right.negate().toVector3(), up.toVector3(), back.negate().toVector3()]]
	];
}

// Utility types

export type PartPosSize = [WedgePart & {WeldConstraint: WeldConstraint}, Vector3D, Vector3, [Vector3, Vector3, Vector3]];

// Main classes

export abstract class Tetra {
	declare public readonly tetraFolder: Folder;
	public display: TerrainDisplay;
	public depth: number;

	constructor(display: TerrainDisplay, depth: number) {
		this.display = display;
		this.depth = depth;
	}

	abstract getPartsPositionsSizes(): PartPosSize[]
}

export class TetraTri extends Tetra {
	private static readonly folderBase = new Instance("Folder");
	static {this.folderBase.Name = "TetraTri"}

	public readonly tetraFolder = TetraTri.folderBase.Clone();
	public readonly projected: [Vector3D, Vector3D, Vector3D];
	private pps: PartPosSize[] | undefined;
	private terrainPolygon: [WedgePart, WedgePart];

	constructor(
		display: TerrainDisplay,
		points: [Vector3D, Vector3D, Vector3D],
		depth: number
	) {
		super(display, depth);

		// find color at triangle centerpoint
		const centerPoint = midpoint(midpoint(points[0], points[1]), points[2]);
		const center = this.display.pointToLongLat(centerPoint);
		const color = colorFromAltitude(
			this.display.heightmap.bicubicInterp(
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
			wedgeBase.Clone(),
			wedgeBase.Clone()
		];

		if (renderDepth(display.renderPosition, projectedPoint(display, centerPoint)) !== 0) {
			// generate terrain polygon
			this.pps = generatePolygon(
				this.terrainPolygon[0], this.terrainPolygon[1], ...this.projected
			);

			this.terrainPolygon[0].Color = this.terrainPolygon[1].Color = color;
			this.terrainPolygon[0].Parent = this.terrainPolygon[1].Parent = this.tetraFolder;
		}
	}

	getPartsPositionsSizes(): PartPosSize[] {
		return this.pps ?? [];
	}
}

abstract class TetraPoly extends Tetra {
	declare protected tetra1: Tetra; // center
	declare protected tetra2: Tetra; // top
	declare protected tetra3: Tetra; // left
	declare protected tetra4: Tetra; // right

	// constructor(display: TerrainDisplay) {
	// 	super(display);
	// }

	getPartsPositionsSizes(): PartPosSize[] {
		const result = [];
		for (const tetra of [this.tetra1, this.tetra2, this.tetra3, this.tetra4])
			for (const pps of tetra.getPartsPositionsSizes())
				result.push(pps);
		return result;
	}

	generateTetra(
		tetra: "center" | "top" | "bottom" | "tri",
		secondary: boolean,
		points: [Vector3D, Vector3D, Vector3D]
	): Tetra {
		const targetDepth = renderDepth(
			this.display.renderPosition,
			projectedPoint(this.display, centerpoint(...points))
		);

		if (targetDepth + 1 > this.depth) {
			return this.instantiateTetra(tetra, points);
		} else if (targetDepth > this.depth) {
			return this.instantiateTetra(secondary ? "tri" : tetra, points);
		} else {
			return this.instantiateTetra("tri", points);
		}
	}

	private instantiateTetra(
		tetra: "center" | "top" | "bottom" | "tri",
		points: [Vector3D, Vector3D, Vector3D]
	): Tetra {
		switch (tetra) {
			case "center": return new TetraPolyCenter(this.display, points, this.depth + 1);
			case "top": return new TetraPolyTop(this.display, points, this.depth + 1);
			case "bottom": return new TetraPolyBottom(this.display, points, this.depth + 1);
			case "tri": return new TetraTri(this.display, points, this.depth + 1);
		}
	}
}

export class TetraPolyCenter extends TetraPoly {
	protected static readonly folderBase = new Instance("Folder");
	static {this.folderBase.Name = "TetraPolyCenter"}

	public readonly tetraFolder = TetraPolyCenter.folderBase.Clone();

	constructor(
		display: TerrainDisplay,
		points: [Vector3D, Vector3D, Vector3D],
		depth: number
	) {
		super(display, depth);

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

		// calculate inner tetra
		this.tetra1 = this.generateTetra("center", false, center);
		this.tetra2 = this.generateTetra("bottom", true, top);
		this.tetra4 = this.generateTetra("bottom", true, right);
		this.tetra3 = this.generateTetra("bottom", true, left);

		for (const tetra of [this.tetra1, this.tetra2, this.tetra3, this.tetra4]) {
			tetra.tetraFolder.Parent = this.tetraFolder;
		}
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

export class TetraPolyTop extends TetraPoly {
	protected static readonly folderBase = new Instance("Folder");
	static {this.folderBase.Name = "TetraPolyTop"}

	public readonly tetraFolder = TetraPolyTop.folderBase.Clone();

	constructor(
		display: TerrainDisplay,
		points: [Vector3D, Vector3D, Vector3D],
		depth: number
	) {
		super(display, depth);
// if(depth===3||subdivisions===3)task.wait(0)
		// choose points of inner triangles
		const triangle = new TetraPolyUprightHelper(points);

		// calculate inner tetra
		this.tetra2 = this.generateTetra("top", false, triangle.top);
		this.tetra4 = this.generateTetra("top", true, triangle.right);
		this.tetra1 = this.generateTetra("bottom", true, triangle.center);
		this.tetra3 = this.generateTetra("top", true, triangle.left);

		for (const tetra of [this.tetra1, this.tetra2, this.tetra3, this.tetra4]) {
			tetra.tetraFolder.Parent = this.tetraFolder;
		}
	}
}

export class TetraPolyBottom extends TetraPoly {
	protected static readonly folderBase = new Instance("Folder");
	static {this.folderBase.Name = "TetraPolyBottom"}

	public readonly tetraFolder = TetraPolyBottom.folderBase.Clone();

	constructor(
		display: TerrainDisplay,
		points: [Vector3D, Vector3D, Vector3D],
		depth: number
	) {
		super(display, depth);

		// choose points of inner triangles
		const triangle = new TetraPolyUprightHelper(points);

		// calculate inner tetra
		this.tetra3 = this.generateTetra("bottom", false, triangle.left);
		this.tetra1 = this.generateTetra("top", false, triangle.center);
		this.tetra4 = this.generateTetra("bottom", false, triangle.right);
		this.tetra2 = this.generateTetra("bottom", true, triangle.top);

		for (const tetra of [this.tetra1, this.tetra2, this.tetra3, this.tetra4]) {
			tetra.tetraFolder.Parent = this.tetraFolder;
		}
	}
}

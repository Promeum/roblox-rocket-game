// import Vector3D from "shared/Modules/Libraries/Vector3D";

// import Datamap from "../Datamap";
// import GravityCelestial from "../Celestial/GravityCelestial";
// import Display from ".";

// type displayFolder = Folder & {
// 	Parts: Folder
// }

// type terrainPolygon = [Folder, WedgePart, WedgePart];

// export default class TerrainDisplay extends Display {
// 	private static readonly displayFolderBase: displayFolder = new Instance("Folder") as displayFolder;
// 	private static readonly wedgeBase: WedgePart = new Instance("WedgePart");

// 	// Initialize displayFolderBase
// 	static {
// 		this.displayFolderBase.Name = "TerrainDisplay";
// 		const partsFolder: Folder = new Instance("Folder");
// 		partsFolder.Name = "Parts";
// 		partsFolder.Parent = this.displayFolderBase;
// 		this.wedgeBase.Name = "TerrainDisplay Wedge";
// 		this.wedgeBase.Anchored = true;
// 		// this.wedgeBase.Material = Enum.Material.SmoothPlastic
// 		this.wedgeBase.Material = Enum.Material.Ground;
// 	}

// 	declare readonly displayFolder: displayFolder;

// 	// Settings
// 	private scale: number;// = 1 / 500_000_000; // 1 / 5_000_000;
// 	private offset: CFrame;
// 	private renderPosition: Vector3D;
// 	private startLongLat: [number, number];
// 	private startCoords: [number, number];
// 	private renderDistance: number;
// 	private renderDensity: number;

// 	// Display data
// 	private readonly gravityCelestial: GravityCelestial;
// 	private readonly heightmap: Datamap;
// 	private readonly heightMultiplier: number; // Will delete in future when get better heightmaps
// 	private readonly points: Vector3[][] = [];
// 	private readonly terrainPolygons: terrainPolygon[] = [];

// 	// Constructor

// 	public constructor(
// 		gravityCelestial: GravityCelestial,
// 		scale: number = 1 / 500_000_000, offset: CFrame = CFrame.identity,
// 		renderPosition: Vector3D = new Vector3D(-gravityCelestial.radius,0,0),
// 		renderDistance: number = 5_000_000, // in meters
// 		renderDensity: number = 2
// 	) {
// 		super();

// 		this.displayFolder = TerrainDisplay.displayFolderBase.Clone();
// 		this.gravityCelestial = gravityCelestial;
// 		this.heightmap = this.gravityCelestial.heightmap;
// 		this.scale = scale;
// 		this.offset = offset;
// 		this.renderPosition = renderPosition;
// 		this.startLongLat = this.pointToLongLat(this.renderPosition);
// 		this.startCoords = this.longLatToCoords(...this.startLongLat);
// 		this.renderDistance = renderDistance;
// 		this.renderDensity = renderDensity;

// 		this.heightMultiplier = 1/3 * 100
// 			* (math.exp(1) ** -(this.gravityCelestial.radius / 10e5))
// 			* this.gravityCelestial.radius;
// 	}

// 	// Draw
// 	/**
// 	 * @param offset Relative to global space
// 	 * @param renderDistance Maximum distance to render terrain
// 	 * @param renderPosition Relative to center of this GravityCelestial
// 	 */
// 	override draw(
// 		scale?: number, offset?: CFrame,
// 		renderPosition?: Vector3D,
// 		renderDistance?: number,
// 		renderDensity?: number,
// 	): displayFolder {
// 		this.updateSettings(scale, offset, renderPosition, renderDistance, renderDensity);

// 		print("TerrainDisplay draw()")
// 		const startTime = os.clock();

// 		const scaledRenderPosition = this.renderPosition.mul(this.scale);

// 		// generate spiral clockwise starting facing north,
// 		// and ensure the globe doesn't get overdrawn by
// 		// scaling the spiral into a rectangle
// 		const directions: [number, number][] = [
// 			[0, this.renderDensity / 2], [this.renderDensity, 0],
// 			[0, -this.renderDensity / 2], [-this.renderDensity, 0]
// 		];

// 		// simple polygon render algorithm
// 		let x = this.startCoords[0], y = this.startCoords[1];
// 		let direction = 0;
// 		let length = 0;
// 		let directionLength = 1;
// 		let lengthenOnNext = false;

// 		let polygonIndex = 0;

// 		// const rawAltitude = this.heightmap.bilinearInterp(x, y);
// 		// const radiusAltitude = (rawAltitude / 255) * this.heightMultiplier;

// 		let pointA!: Vector3;
// 		let pointB!: Vector3;
// 		let pointC!: Vector3;
// 		let coordsA!: [number, number];
// 		let coordsB!: [number, number];
// 		let coordsC!: [number, number];

// 		// Loop until render distance reached
// 		do {
// 			// prepare for next point
// 			if (length === directionLength) {
// task.wait(0);if(y>this.startCoords[1]+this.heightmap.dimensionSizes[1]/2)break;
// 				length = 0;
// 				direction = (direction + 1) % 4;
// 				if (lengthenOnNext) directionLength++;
// 				lengthenOnNext = !lengthenOnNext;
// 			}

// 			const forwardDir = directions[direction];
// 			const forward = [x + forwardDir[0], y + forwardDir[1]];

// 			// new point
// 			coordsB = coordsA;
// 			pointB = pointA;
// 			coordsA = [x, y];
// 			const rawAltitude = this.heightmap.nearestNeighborInterp(...coordsA);
// 			const radiusAltitude = (rawAltitude / 255) * this.heightMultiplier;
// 			pointA = this.projectCoords(
// 				coordsA[0], coordsA[1], radiusAltitude
// 			).mul(this.scale).toVector3();
// 			// pointA = this.projectLongLat(
// 			// 	(coordsA[0] / this.heightmap.dimensionSizes[0] - 0.5) * 2 * math.pi,
// 			// 	(0.5 - coordsA[1] / this.heightmap.dimensionSizes[1]) * math.pi,
// 			// 	radiusAltitude
// 			// ).mul(this.scale).toVector3();

// 			// add point to grid
// 			if (!this.points[y]) this.points[y] = [];
// 			this.points[y][x] = pointA;

// 			// polygon points
// 			if (directionLength >= 2) {
// 				// the right look vector
// 				let rightCoords: [number, number] = directions[(direction + 1) % 4];
// 				rightCoords = [x + rightCoords[0], y + rightCoords[1]]
// 				// the coordinate to the right
// 				const right = this.points[rightCoords[1]][rightCoords[0]];
// 				// the forward right look vector
// 				const forwardRightCoords: [number, number] = [forwardDir[0] + rightCoords[0], forwardDir[1] + rightCoords[1]];
// 				// the coordinate to the forward right
// 				const forwardRight = this.points[forwardRightCoords[1]]?.[forwardRightCoords[0]];
// // let rawAltitudeCentroid;
// 				// choose pointC
// 				if (pointB === right) { // choose forwardRight over right b/c direction just changed
// 					coordsC = forwardRightCoords; // green triangle
// 					pointC = forwardRight;
// // rawAltitudeCentroid = this.heightmap.bilinearInterp(
// // 	(coordsA[0] + coordsB[0] + coordsC[0]) / 3,
// // 	(coordsA[1] + coordsB[1] + coordsC[1]) / 3
// // );
// 				} else if (forwardRight) { // needs 2 triangles to fill space
// 					coordsC = rightCoords; // purple rhombus
// 					pointC = right;
// // rawAltitudeCentroid = this.heightmap.bilinearInterp(
// // 	(coordsA[0] + coordsB[0] + coordsC[0]) / 3,
// // 	(coordsA[1] + coordsB[1] + coordsC[1]) / 3
// // );
// 					// make extra triangle
// 					this.terrainPolygons[polygonIndex] = this.generatePolygon(
// 						this.terrainPolygons[polygonIndex] ?? [],
// 						this.colorFromAltitude(rawAltitude),
// // this.colorFromAltitude(this.heightmap.bilinearInterp(
// // 	((coordsA[0] + rightCoords[0]) / 2 + forwardRightCoords[0]) / 2,
// // 	((coordsA[1] + rightCoords[1]) / 2 + forwardRightCoords[1]) / 2
// // )),
// 						pointA, right, forwardRight
// 					);
// 					polygonIndex++;
// 				} else { // fill in corner
// 					coordsC = rightCoords; // blue triangle
// 					pointC = right;
// // rawAltitudeCentroid = this.heightmap.bilinearInterp(
// // 	(coordsA[0] + coordsB[0] + coordsC[0]) / 3,
// // 	(coordsA[1] + coordsB[1] + coordsC[1]) / 3
// // );
// 				}

// 				// make triangle
// 				let newPolygon = this.terrainPolygons[polygonIndex];
// 				newPolygon = this.generatePolygon(
// 					newPolygon ?? [],
// 					this.colorFromAltitude(rawAltitude),
// 					pointA, pointB, pointC
// 				);
// 				this.terrainPolygons[polygonIndex] = newPolygon;
// 				polygonIndex++;
// 			}

// 			x = forward[0];
// 			y = forward[1];
// 			length++;
// 		} while (scaledRenderPosition.sub(pointA).magnitude() <= this.renderDistance * this.scale)

// // generate terrain as a bunch of parts
// 		// // generate parts
// 		// const dimensions: number[] = this.heightmap.dimensionSizes; // [y, x]
// 		// let partIndex = 0;
// 		// for (let y = 0; y < dimensions[0]; y += 2) {
// 		// 	const increment = (y === 0 || y === dimensions[0] - 1) ? dimensions[1] + 1 : 1;
// 		// 	for (let x = 0; x < dimensions[1]; x += increment) {
// 		// 		const rawPosition = this.projectOffsetPoint(x, y);
// 		// 		let part = this.partCache[partIndex];
// 		// 		if (rawPosition.sub(renderPosition).magnitude() <= renderDistance) {
// 		// 			const relativeHeight = this.heightmap.data[y][x];

// 		// 			// generate parts as needed
// 		// 			part = this.generatePart(
// 		// 				part, rawPosition.add(this.offset).mul(this.scale).toVector3(),
// 		// 				renderPosition.mul(-this.scale),
// 		// 				relativeHeight > waterLevel ?
// 		// 					Color3.fromHSV(.33, .75, (relativeHeight-waterLevel)/(255-waterLevel))
// 		// 					: Color3.fromRGB(0, 0, 255)
// 		// 			);

// 		// 			// add to points storage
// 		// 			this.partCache.push(part);
// 		// 			partIndex++;

// 		// 			// set/unset parent if needed
// 		// 			if (part.Parent === undefined) 
// 		// 				part.Parent = this.displayFolder.Parts;
// 		// 		} else if (part && part.Parent !== undefined) {
// 		// 			part.Parent = undefined;
// 		// 		}
// 		// 	}
// 		// }

// 		// // unparent remaining parts
// 		// for (let i = partIndex; i < this.partCache.size(); i++) {
// 		// 	this.partCache[i].Parent = undefined;
// 		// }

// 		print(`draw() fin @ ${os.clock() - startTime} seconds`)

// 		return this.displayFolder;
// 	}

// 	// Methods

// 	// Terrain generation

// 	/**
// 	 * Original Luau algorithm from
// 	 * https://github.com/EgoMoose/Articles/blob/master/3d%20triangles/3D%20triangles.md
// 	 */
// 	private generatePolygon(
// 		polygon: terrainPolygon, color: Color3,
// 		a: Vector3, b: Vector3, c: Vector3
// 	): terrainPolygon {
// 		let [ab, ac, bc] = [b.sub(a), c.sub(a), c.sub(b)];
// 		const [abd, acd, bcd] = [ab.Dot(ab), ac.Dot(ac), bc.Dot(bc)];

// 		if (abd > acd && abd > bcd) {
// 			[c, a] = [a, c];
// 		} else if (acd > bcd && acd > abd) {
// 			[a, b] = [b, a];
// 		}

// 		[ab, ac, bc] = [b.sub(a), c.sub(a), c.sub(b)];

// 		const right = ac.Cross(ab).Unit;
// 		const up = bc.Cross(right).Unit;
// 		const back = bc.Unit;

// 		const height = math.abs(ab.Dot(up))

// 		if (!polygon[0]) polygon[0] = new Instance("Folder");
// 		polygon[0].Name = "TerrainDisplay Polygon";
// 		polygon[0].Parent = this.displayFolder.Parts;

// 		if (!polygon[1]) polygon[1] = TerrainDisplay.wedgeBase.Clone();
// 		polygon[1].Size = new Vector3(0, height, math.abs(ab.Dot(back)));
// 		polygon[1].CFrame = CFrame.fromMatrix((a.add(b)).div(2), right, up, back);
// 		if (color) polygon[1].Color = color;
// 		polygon[1].Parent = polygon[0];

// 		if (!polygon[2]) polygon[2] = TerrainDisplay.wedgeBase.Clone();
// 		polygon[2].Size = new Vector3(0, height, math.abs(ac.Dot(back)));
// 		polygon[2].CFrame = CFrame.fromMatrix(
// 			(a.add(c)).div(2), Vector3.zero.sub(right),
// 			up, Vector3.zero.sub(back));
// 		if (color) polygon[2].Color = color;
// 		polygon[2].Parent = polygon[0];

// 		return polygon;
// 	}
	
// 	// private generateRightTriangle(
// 	// 	polygon: WedgePart, rawAltitude: number,
// 	// 	a: Vector3, b: Vector3, c: Vector3
// 	// ): WedgePart {
// 	// 	if (!polygon) polygon = TerrainDisplay.wedgeBase.Clone();
// 	// 	polygon.Size = new Vector3(0, height, math.abs(ac.Dot(back)));
// 	// 	polygon.CFrame = CFrame.fromMatrix(
// 	// 		(a.add(c)).div(2), Vector3.zero.sub(right),
// 	// 		up, Vector3.zero.sub(back));
// 	// 	polygon.Color = this.colorFromAltitude(rawAltitude);
// 	// 	polygon.Parent = polygon;

// 	// 	return polygon;
// 	// }

// 	private generatePart(
// 		part: Part, position: Vector3, lookAt: Vector3, color: Color3
// 	): Part {
// 		const newPart = part ?? new Instance("Part");
// 		newPart.Anchored = true;
// 		newPart.Size = new Vector3(1,1.5,1/40).mul(40);
// 		// newPart.Shape = Enum.PartType.Ball;
// 		newPart.Material = Enum.Material.Ground;
// 		newPart.CFrame = new CFrame(position, lookAt);
// 		newPart.Color = color;
// 		return newPart;
// 	}

// 	private colorFromAltitude(rawAltitude: number): Color3 {
// 		const waterLevel = 12//128; // temp hardcoded variable
// 		if (rawAltitude <= waterLevel)
// 			return Color3.fromRGB(0, 0, 255);
// 		else
// 			return Color3.fromHSV(.33, .75,
// 				(rawAltitude - waterLevel) / (255 - waterLevel));
// 	}

// 	// Conversion

// 	/**
// 	 * @param relativePosition Position relative to the GravityCelestial
// 	 * @returns Longitude and latitude, respectively.
// 	 */
// 	private pointToLongLat(relativePosition: Vector3D | Vector3): [number, number] {
// 		const longitude = math.atan2(-relativePosition.Z, relativePosition.X);
// 		const latitude = math.atan2(
// 			relativePosition.Y,
// 			math.sqrt(relativePosition.X ** 2 + relativePosition.Z ** 2)
// 		);

// 		return [longitude, latitude];
// 	}

// 	private pointToCoords(relativePosition: Vector3D | Vector3): [number, number] {
// 		return this.longLatToCoords(...this.pointToLongLat(relativePosition));
// 	}

// 	private coordsToLongLat(x: number, y: number): [number, number] {
// 		// Values in radians
// 		const longitude = (x / this.heightmap.dimensionSizes[0] - 0.5) * 2 * math.pi;
// 		const latitude = (0.5 - y / this.heightmap.dimensionSizes[1]) * math.pi;

// 		return [longitude, latitude];
// 	}

// 	private longLatToCoords(longitude: number, latitude: number): [number, number] {
// 		const x = (longitude / (2 * math.pi) + 0.5) * this.heightmap.dimensionSizes[0];
// 		const y = (latitude / math.pi - 0.5) * this.heightmap.dimensionSizes[1];

// 		return [x, y];
// 	}

// 	/** Projects a point with altitude taken from heightmap */
// 	// private projectHeightmapCoords(x: number, y: number): Vector3D {
// 	// 	const relativeHeight = this.heightmap.bilinearInterp(x, y);
// 	// 	const projectedPoint = this.pointToLongLat(
// 	// 		x, y, (relativeHeight / 255) * this.heightMultiplier
// 	// 	);
// 	// 	return projectedPoint;
// 	// }

// 	/**
// 	 * Projects a point from longitude & latitude + altitude
// 	 * @param altitude Units in GravityCelestial radii
// 	 */
// 	private projectLongLat(longitude: number, latitude: number, altitude: number): Vector3D {
// 		const latRotation = new Vector3D(
// 			this.gravityCelestial.radius * math.cos(latitude),
// 			this.gravityCelestial.radius * math.sin(latitude),
// 			0
// 		);
// 		const longRotation = new Vector3D(
// 			latRotation.X * math.cos(longitude),
// 			latRotation.Y,
// 			latRotation.X * -math.sin(longitude)
// 		);
// 		return longRotation.mul(altitude / this.gravityCelestial.radius + 1);
// 	}

// 	/**
// 	 * Projects a point from x & y + altitude
// 	 * @param altitude Units in GravityCelestial radii
// 	 */
// 	private projectCoords(x: number, y: number, altitude: number): Vector3D {
// 		const [longitude, latitude] = this.coordsToLongLat(
// 			x,
// 			y
// 		);
// 		return this.projectLongLat(longitude, latitude, altitude);
// 	}

// 	public updateSettings(
// 		scale?: number, offset?: CFrame,
// 		renderPosition?: Vector3D,
// 		renderDistance?: number,
// 		renderDensity?: number
// 	): void {
// 		if (scale !== undefined && scale <= 0)
// 			error("TerrainDisplay updateSettings() invalid argument(s)");

// 		if (scale !== undefined) this.scale = scale;
// 		if (offset) this.offset = offset;
// 		if (renderDistance !== undefined) this.renderDistance = renderDistance;
// 		if (renderPosition) {
// 			this.renderPosition = renderPosition;
// 			this.startLongLat = this.pointToLongLat(this.renderPosition);
// 			this.startCoords = this.longLatToCoords(...this.startLongLat); // (500, 250)
// 		}

// 		if (renderDensity !== undefined) this.renderDensity = renderDensity;
// 	}

// 	// Utility methods

// 	override deepClone(): TerrainDisplay {
// 		error("TerrainDisplay deepClone() Method disabled")
// 	}
// }

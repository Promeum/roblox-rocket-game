/*
    Triangular quadtree-based point projection
*/

import Vector3D from "shared/Modules/Libraries/Vector3D";
import FastV3D, { Vector } from "shared/Modules/Libraries/FastVector3D";
import Datamap from "../../Datamap";

// temp hardcoded constants
// TODO: Implement better ways to access these values

const EARTH_RADIUS = 6371.01e3;
/** Exaggerate terrain for debugging */
const HEIGHTMAP_MULTIPLIER = (
    1/3 * 98.8
    * (math.exp(1) ** -(EARTH_RADIUS / 10e5))
    * EARTH_RADIUS

    * 1.7
);
export const MAX_LOD_DEPTH = 7//15;
const WATER_RAW_HEIGHT = 12//128;

/**
 * Calculates Tetra subdivision level based on distance from camera.
 * @returns Subdivision level
 */
export function RENDER_DEPTH_FN(renderDistance: number): number {
    return 7; // math.random(6,7);

	// if (renderDistance < 40_000) {
	// 	// return math.min(
	// 	// 	// see desmos graph
	// 	// 	math.floor(23.4 / (renderDistance / 10000 + 1.45) + 2.8),
	// 	// 	15
	// 	// );
	// 	return math.clamp(
	// 		math.floor(23.4 / (renderDistance / 10000 + 1.45) + 2.8),
	// 		13, 15
	// 	);
	// } else {
	// 	return 0;
	// }

	// if (renderDistance < 20_000) {
	// 	return 14;
	// } else if (renderDistance < 100_000) {
	// 	return 8;
	// } else if (renderDistance < 1_000_000) {
	// 	return 6;
	// } else {
	// 	return 4;
	// }

	// if (renderDistance < 5_000) {
	// 	return 16;
	// } else if (renderDistance < 20_000) {
	// 	return 11;
	// } else if (renderDistance < 100_000) {
	// 	return 9;
	// } else if (renderDistance < 1_000_000) {
	// 	return 4;
	// } else {
	// 	return 2;
	// }
}

// Utility types

interface Triangle {
    top: Vector;
    left: Vector;
    right: Vector;
    center: Vector;
}

/**
 * Set `part.Size` and `part.Position` in bulk for performance
 */
export interface WedgeData {
    part: WedgePart; // & {WeldConstraint: WeldConstraint}; // For non-BulkMoveTo() strategy
    position: Vector;
    /** `part.Size` */
    size: Vector3;
    /** CFrame rotation vectors */
    rotation: {
        XVector: Vector3,
        YVector: Vector3,
        ZVector: Vector3,
    };
}

// Utility functions

/**
 * Midpoint of 2 vectors
 */
function midpoint(
    p1: Vector,
    p2: Vector
): Vector {
    return FastV3D.create(
        (p1.X + p2.X) / 2,
        (p1.Y + p2.Y) / 2,
        (p1.Z + p2.Z) / 2
    );
}

/**
 * Centerpoint of 3 vectors
 */
function centerpoint(
    p1: Vector,
    p2: Vector,
    p3: Vector
): Vector {
    return FastV3D.create(
        (p1.X + p2.X + p3.X) / 3,
        (p1.Y + p2.Y + p3.Y) / 3,
        (p1.Z + p2.Z + p3.Z) / 3
    );
}

/**
 * Centerpoint of a triangle
 */
export function centerpointTri(
    triangle: { top: Vector, left: Vector, right: Vector, center: Vector | undefined }
): Triangle {
    triangle.center = centerpoint(triangle.top, triangle.left, triangle.right);
    return triangle as Triangle;
}

// TODO: lng and lat should be precalculated during Tetrahedron instantiation
/**
 * @param relativePosition Position relative to the GravityCelestial
 * @returns Longitude and latitude, respectively.
 */
function pointToLongLat(relativePosition: Vector): [number, number] {
    const longitude = math.atan2(-relativePosition.Z, relativePosition.X);
    const latitude = math.atan2(
        relativePosition.Y,
        math.sqrt(relativePosition.X ** 2 + relativePosition.Z ** 2)
    );

    return [longitude, latitude];
}

/**
 * Projects a point from longitude & latitude + altitude
 * @param altitude Units in GravityCelestial radii
 */
function projectLongLat(altitude: number, longitude: number, latitude: number): Vector {
    // latRotation
    const rotation = FastV3D.create(
        math.cos(latitude),
        math.sin(latitude),
        0
    );
    // longRotation
    const X = rotation.X;
    rotation.X = X * math.cos(longitude);
    rotation.Z = X * -math.sin(longitude);
    return FastV3D.mul(rotation, altitude);
}

/**
 * Corrects the magnitude of `point`
 */
function reproject(point: Vector, magnitude: number): Vector {
    return FastV3D.mul(FastV3D.unit(point), magnitude);
}

/** 
 * Reprojects a point with altitude given by a `Datamap`
 */
function reprojectPoint(point: Vector, datamap: Datamap): Vector {
    const rawHeight = datamap.bicubicInterp(...datamap.longLatToCoords(...pointToLongLat(point)));
    const altitude = datamap.convertHeight(rawHeight) * HEIGHTMAP_MULTIPLIER;
    const radius = EARTH_RADIUS * (altitude / EARTH_RADIUS + 1);
    return reproject(point, radius);
}

// generatePolygon() pre-allocated tables

const ab = FastV3D.create(0, 0, 0);
const ac = FastV3D.create(0, 0, 0);
const bc = FastV3D.create(0, 0, 0);
let right = FastV3D.create(0, 0, 0);
let up = FastV3D.create(0, 0, 0);
const pos_1 = FastV3D.create(0, 0, 0);
const pos_2 = FastV3D.create(0, 0, 0);

/**
 * Original Luau algorithm from
 * https://github.com/EgoMoose/Articles/blob/master/3d%20triangles/3D%20triangles.md
 */
function generatePolygon(
    wedge1: WedgePart, wedge2: WedgePart,
    a: Vector, b: Vector, c: Vector
): [WedgeData, WedgeData] {
    FastV3D.setSub(ab, b, a);
    FastV3D.setSub(ac, c, a);
    FastV3D.setSub(bc, c, b);

    const abd = ab.X**2 + ab.Y**2 + ab.Z**2;
    const acd = ac.X**2 + ac.Y**2 + ac.Z**2;
    const bcd = bc.X**2 + bc.Y**2 + bc.Z**2;

    let swapped = false;
    if (abd > acd && abd > bcd) {
        [c, a] = [a, c];
        swapped = true;
    } else if (acd > bcd && acd > abd) {
        [a, b] = [b, a];
        swapped = true;
    }

    if (swapped) {
        FastV3D.setSub(ab, b, a);
        FastV3D.setSub(ac, c, a);
        FastV3D.setSub(bc, c, b);
    }

    FastV3D.unit(FastV3D.setCross(right, ac, ab)); // set right
    FastV3D.unit(FastV3D.setCross(up, bc, right)); // set up
    const back = FastV3D.unit(bc);
    const height = math.abs(FastV3D.dot(ab, up));

    const size1 = new Vector3(0, height, math.abs(FastV3D.dot(ab, back)));
    const pos1 = FastV3D.toVector3D(FastV3D.div(FastV3D.setAdd(pos_1, a, b), 2));

    const rightV3 = FastV3D.toVector3(right);
    const rightNegV3 = FastV3D.toVector3(FastV3D.negate(right));
    const backV3 = FastV3D.toVector3(back);
    const backNegV3 = FastV3D.toVector3(FastV3D.negate(back));
    const upV3 = FastV3D.toVector3(up);

    // wedge1.CFrame = CFrame.fromMatrix(
    //     FastV3D.toVector3(pos1),
    //     rightV3,
    //     upV3,
    //     backV3
    // );

    const size2 = new Vector3(0, height, math.abs(FastV3D.dot(ac, back)));
    const pos2 = FastV3D.toVector3D(FastV3D.div(FastV3D.setAdd(pos_2, a, c), 2));

    // wedge2.CFrame = CFrame.fromMatrix(
    //     FastV3D.toVector3(pos2),
    //     rightNegV3,
    //     upV3,
    //     backNegV3
    // );

    return [
        {
            part: wedge1 as WedgeData["part"],
            position: pos1,
            size: size1,
            rotation: { XVector: rightV3, YVector: upV3, ZVector: backV3 }
        },
        {
            part: wedge2 as WedgeData["part"],
            position: pos2,
            size: size2,
            rotation: { XVector: rightNegV3, YVector: upV3, ZVector: backNegV3 }
        }
    ];
}


/** Quadtree node with projected points */
export class Tetra {
    private static readonly folderBase = new Instance("Folder");
    private static readonly wedgeBase: WedgePart = new Instance("WedgePart");
    static {
        this.folderBase.Name = "Tetra"
        this.wedgeBase.Name = "Terrain Wedge";
        this.wedgeBase.Anchored = true;
        // this.wedgeBase.CastShadow = false;
        // this.wedgeBase.CanTouch = wedgeBase.CanQuery = wedgeBase.CanCollide = false;
        // this.wedgeBase.Material = Enum.Material.Ground;
        this.wedgeBase.Material = Enum.Material.SmoothPlastic;
    }

    static _DESCENDANTS_GENERATED = 0;

    private status?: "nonleaf" | "leaf" | "stitchinggap" | "pruned";
    /** Cache `WedgePart`s to reduce Instance.Clone() calls */
    public wedges?: [WedgeData, WedgeData];

    constructor(
        private depth: number,
        private points: Triangle,
        private center?: Tetra,
        private top?: Tetra,
        private left?: Tetra,
        private right?: Tetra
    ) {Tetra._DESCENDANTS_GENERATED++;}

    /**
     * @param parentIndex `>= 0`
     * @param childIndex 0 to 3 inclusive
     */
    static getChild(parentIndex: number, childIndex: number): number {
        return 4 * parentIndex + childIndex + 1;
    }

    // /**
    //  * @param parentIndex `>=  1`
    //  * @param childIndex 0 to 3 inclusive
    //  */
    // static getParent(childIndex: number): number {
    //     return math.floor((childIndex - 1) / 4);
    // }

    private generateDescendants(): this {
        const center: Triangle = {
            top: midpoint(this.points.left, this.points.right),
            left: midpoint(this.points.top, this.points.right),
            right: midpoint(this.points.top, this.points.left),
            center: this.points.center
        };

        const top = centerpointTri({
            top: this.points.top, left: center.right,
            right: center.left, center: undefined
        });
        const left = centerpointTri({
            top: this.points.left, left: center.top,
            right: center.right, center: undefined
        });
        const right = centerpointTri({
            top: this.points.right, left: center.left,
            right: center.top, center: undefined
        });

        const newDepth = this.depth + 1;

        this.center = new Tetra(newDepth, center);
        this.top = new Tetra(newDepth, top);
        this.left = new Tetra(newDepth, left);
        this.right = new Tetra(newDepth, right);

        return this;
    }

    /**
     * Sets child tetras up to `maxDepth`.
     * Orients bottom edges towards center.
     * 
     * Example array results:
     * ```
     * maxDepth = 0: 0 // length = 1
     * maxDepth = 1: 0  1 1 1 1 // length = 5
     * maxDepth = 2: 0  1 1 1 1  2 2 2 2  2 2 2 2  2 2 2 2  2 2 2 2 // length = 21
     * ```
     * 
     * This method has a time complexity of `O(4^n)`
     * (full: `O(4^(n-1) + 4^(n-2) + ... + 4^1 + 4^0 + 0)`)
     */
    static instantiate(maxDepth: number, points: Triangle): Tetra[] {
        let iterations = 0;
        for (let i = 0; i < maxDepth; i++)
            iterations += 4 ** i;

        const result = [new Tetra(0, points)];
        for (let i = 0; i < iterations; i++) {
            const tetra = result[i].generateDescendants();
            result[Tetra.getChild(i, 0)] = tetra.center!;
            result[Tetra.getChild(i, 1)] = tetra.top!;
            result[Tetra.getChild(i, 2)] = tetra.left!;
            result[Tetra.getChild(i, 3)] = tetra.right!;
        }

        return result;
    }

    static duplicate(arrayTree: Tetra[]): Tetra[] {
        const result = new Array<Tetra>(arrayTree.size());
        const arraySize = arrayTree.size();
        const maxDepth = arrayTree[arraySize - 1].depth;

        for (let i = arraySize - 1; i >= 0; i--) {
            const tetra = arrayTree[i];
            const clonedPoints = {
                top: FastV3D.clone(tetra.points.top),
                left: FastV3D.clone(tetra.points.left),
                right: FastV3D.clone(tetra.points.right),
                center: FastV3D.clone(tetra.points.center),
            };
            if (tetra.depth < maxDepth) {
                result[i] = new Tetra(
                    tetra.depth,
                    clonedPoints,
                    result[Tetra.getChild(i, 0)],
                    result[Tetra.getChild(i, 1)],
                    result[Tetra.getChild(i, 2)],
                    result[Tetra.getChild(i, 3)]
                );
            } else result[i] = new Tetra(tetra.depth, clonedPoints);
        }

        return result;
    }

    /**
     * Calculates which Tetra need to be drawn and returns the result.
     * @param renderPosition Camera location
     * @param renderDepth Quadtree depth as a function of distance
     */
    static probeLOD(
        tetras: Tetra[],
        renderPosition: Vector3D,
        renderDepth: (renderDistance: number) => number
    ): Tetra[] {
        const renderPosNormalized = renderPosition.div(EARTH_RADIUS);
        const toDraw: Tetra[] = [];

        function isInPlay(tetra?: Tetra): boolean {
            const status = tetra?.status;
            return status !== undefined && status !== "pruned";
        }

        for (let i = tetras.size() - 1; i >= 0; i--) {
            const tetra = tetras[i];

            const centerStatus = isInPlay(tetra?.center);
            const topStatus = isInPlay(tetra?.top);
            const leftStatus = isInPlay(tetra?.left);
            const rightStatus = isInPlay(tetra?.right);

            if (centerStatus && topStatus && leftStatus && rightStatus) {
                // nonLeaves.push(tetra);
                tetra.status = "nonleaf";
            } else if (!centerStatus && !topStatus && !leftStatus && !rightStatus) {
                const distance = FastV3D.distance(renderPosNormalized, tetra.points.center) * EARTH_RADIUS;
                // TODO: Calculate distance in km from latitude and longitude (Lat and lng should be stored in Tetra)
                // Or just store unit vectors
                // Current: Can only call probeLOD() once before it breaks
                const targetDepth = renderDepth(distance);

                if (tetra.depth === targetDepth) {
                    // leaves.push(tetra);
                    toDraw.push(tetra);
                    tetra.status = "leaf";
                } else {
                    // warn(tetra.depth > targetDepth,
                    //     `Tetra probeLODTetra() tetra.depth (${tetra.depth}) < targetDepth (${targetDepth}).\nThis means renderDepth() requests a higher depth than the maximum depth specified by TerrainDisplay.setMaxLOD()`);
                    tetra.status = "pruned";
                }
            } else {
                // TODO: Fill in the empty spaces with bespoke leaves
                // stitchingGap.push(tetra);
                tetra.status = "stitchinggap";
            }
        }

        return toDraw;
    }

    static reproject(tetras: Tetra[], datamap: Datamap): void {
        // TODO: Cache projected position, or consider projecting positions during instantiation
        for (const tetra of tetras) {
            if (tetra.points.left) {
                tetra.points.left = reprojectPoint(tetra.points.left, datamap);
            }
            if (tetra.points.right) {
                tetra.points.right = reprojectPoint(tetra.points.right, datamap);
            }
            if (tetra.points.top) {
                tetra.points.top = reprojectPoint(tetra.points.top, datamap);
            }
        }
    }

    /** Will eventually be removed; Datamap functionality not yet implemented */
    private static getColor(/* rawAltitude: number */): Color3 {
        // Random colors for contrast (debug)
        return Color3.fromRGB(math.random(0,255),math.random(0,255),math.random(0,255))
        // Will also replace below color system in future
        // if (rawAltitude <= waterLevel)
        // 	return Color3.fromRGB(0, 0, 255);
        // else
        // 	return Color3.fromHSV(.33, .75,
        // 		(rawAltitude - waterLevel) / (255 - waterLevel));
    }

    /**
     * This method is very expensive
     * (uses `Instance.Clone()`)
     */
    static draw(tetras: Tetra[]/*,  datamap: Datamap */): WedgeData[] {
        let data: WedgeData[] = [];

        for (const tetra of tetras) {
            tetra.status = undefined;
            if (!tetra.wedges) {
                const [wedge1, wedge2] = [this.wedgeBase.Clone(), this.wedgeBase.Clone()];

                // const center = pointToLongLat(this.points.center);
                const color = this.getColor(
                    // datamap.bicubicInterp(
                    //     ...datamap.longLatToCoords(...center)
                    // )
                );

                wedge1.Color = wedge2.Color = color;

                tetra.wedges = generatePolygon(
                    wedge1, wedge2,
                    tetra.points.top, tetra.points.left, tetra.points.right
                );
            }
            data.push(tetra.wedges![0]);
            data.push(tetra.wedges![1]);
        }

        return data;
    }
}

import Vector3D from "shared/Modules/Libraries/Vector3D";
import FastV3D, { Vector } from "shared/Modules/Libraries/FastVector3D";
import Datamap from "shared/Modules/BaseModule/Datamap";

/* Tetra.ts */

// Utility types

interface Triangle {
    top: Vector;
    left: Vector;
    right: Vector;
    center: Vector;
}

/** Uses `Vector3` (32-bit) */
interface TriangleF {
    top: Vector3;
    left: Vector3;
    right: Vector3;
}

interface WedgeData {
    part: WedgePart & {WeldConstraint: WeldConstraint};
    position: Vector3D;
    size: Vector3;
    rotation: TriangleF;
}

// Utility functions

/**
 * Midpoint of 2 vectors
 */
export function midpoint(
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
export function centerpoint(
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
export function pointToLongLat(relativePosition: Vector): [number, number] {
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
export function projectLongLat(altitude: number, longitude: number, latitude: number): Vector {
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
 * Corrects the altitude of `point`, returning a new `Vector3D`.
 */
export function reproject(point: Vector, altitude: number): Vector {
    return FastV3D.mul(FastV3D.unit(point), altitude);
}

/** 
 * Reprojects a point with altitude given by a `Datamap`
 */
export function reprojectPoint(point: Vector, datamap: Datamap): Vector {
    return reproject(point, datamap.bicubicInterp(...pointToLongLat(point))
* (
    1/3 * 98.8
    * (math.exp(1) ** -(6371.01e3 / 10e5))
    * 6371.01e3
));
}

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
export function generatePolygon(
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

    wedge1.CFrame = CFrame.fromMatrix(
        FastV3D.toVector3(pos1),
        rightV3,
        upV3,
        backV3
    );

    const size2 = new Vector3(0, height, math.abs(FastV3D.dot(ac, back)));
    const pos2 = FastV3D.toVector3D(FastV3D.div(FastV3D.setAdd(pos_2, a, c), 2));

    wedge2.CFrame = CFrame.fromMatrix(
        FastV3D.toVector3(pos2),
        rightNegV3,
        upV3,
        backNegV3
    );

    return [
        {
            part: wedge1 as WedgeData["part"],
            position: pos1,
            size: size1,
            rotation: {
                top: rightV3,
                right: upV3,
                left: backV3
            }
        },
        {
            part: wedge2 as WedgeData["part"],
            position: pos2,
            size: size2,
            rotation: {
                top: rightNegV3,
                right: upV3,
                left: backNegV3
            }
        }
    ];
}
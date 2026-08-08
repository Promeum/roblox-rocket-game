import Vector3D from "shared/Modules/Libraries/Vector3D";
import Datamap from "shared/Modules/BaseModule/Datamap";

/* Tetra.ts */

// Utility types

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
    p1: Vector3D | Vector3,
    p2: Vector3D | Vector3
): Vector3D {
    return new Vector3D(
        (p1.X + p2.X) / 2,
        (p1.Y + p2.Y) / 2,
        (p1.Z + p2.Z) / 2
    );
}

/**
 * Centerpoint of 3 vectors
 */
export function centerpoint(
    p1: Vector3D | Vector3,
    p2: Vector3D | Vector3,
    p3: Vector3D | Vector3
): Vector3D {
    return new Vector3D(
        (p1.X + p2.X + p3.X) / 3,
        (p1.Y + p2.Y + p3.Y) / 3,
        (p1.Z + p2.Z + p3.Z) / 3
    );
}

/**
 * Centerpoint of a triangle
 */
export function centerpointTri(
    triangle: {
        top: Vector3D | Vector3,
        left: Vector3D | Vector3,
        right: Vector3D | Vector3
    }
): Vector3D {
    return centerpoint(triangle.top, triangle.left, triangle.right);
}

// TODO: lng and lat should be precalculated during Tetrahedron instantiation
/**
 * @param relativePosition Position relative to the GravityCelestial
 * @returns Longitude and latitude, respectively.
 */
export function pointToLongLat(relativePosition: Vector3D | Vector3): [number, number] {
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
export function projectLongLat(altitude: number, longitude: number, latitude: number): Vector3D {
    const latRotation = new Vector3D(
        math.cos(latitude),
        math.sin(latitude),
        0
    );
    const longRotation = new Vector3D(
        latRotation.X * math.cos(longitude),
        latRotation.Y,
        latRotation.X * -math.sin(longitude)
    );
    return longRotation.mul(altitude);
}

/**
 * Corrects the altitude of `point`, returning a new `Vector3D`.
 */
export function reproject(point: Vector3D, altitude: number): Vector3D {
    return point.unit().mul(altitude);
}

/** 
 * Reprojects a point with altitude given by a `Datamap`
 */
export function reprojectPoint(point: Vector3D, datamap: Datamap): Vector3D {
    return reproject(point, datamap.bicubicInterp(...pointToLongLat(point))
* (
                1/3 * 98.8
                * (math.exp(1) ** -(6371.01e3 / 10e5))
                * 6371.01e3
            ));
}

/**
 * Original Luau algorithm from
 * https://github.com/EgoMoose/Articles/blob/master/3d%20triangles/3D%20triangles.md
 */
export function generatePolygon(
    wedge1: WedgePart, wedge2: WedgePart,
    a: Vector3D, b: Vector3D, c: Vector3D
): [WedgeData, WedgeData] {
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

    const height = math.abs(ab.dot(up));

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
        {
            part: wedge1 as WedgeData["part"],
            position: pos1,
            size: size1.toVector3(),
            rotation: {
                top: right.toVector3(),
                right: up.toVector3(),
                left: back.toVector3()
            }
        },
        {
            part: wedge2 as WedgeData["part"],
            position: pos2,
            size: size2.toVector3(),
            rotation: { 
                top: right.negate().toVector3(),
                right: up.toVector3(),
                left: back.negate().toVector3()
            }
        }
    ];
}
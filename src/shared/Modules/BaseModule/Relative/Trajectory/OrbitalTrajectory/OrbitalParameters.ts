import Vector3D from "shared/Modules/Libraries/Vector3D";

/**
 * Orbital parameters (all values adjusted for game space)
 * https://orbital-mechanics.space/classical-orbital-elements/orbital-elements-and-the-state-vector.html
 * @param mu Standard gravitational parameter
 * @param r Position vector
 * @param v Velocity vector
 * @returns Orbital parameters
 */
export default function orbitalParameters(mu: number, r: Vector3D, rM: number, v: Vector3D) {
    const v_r: number = v.dot(r.unit()); // Radial velocity
    // const v_T: number = math.sqrt(vM * vM - v_r * v_r); // Azumithal velocity

    const h: Vector3D = r.cross(v); // Orbital Angular Momentum. Normal to the orbital plane.
    const hM: number = h.magnitude(); // ...and its magnitude

    const i: number = math.acos(h.Y / hM); // Inclination

    // Axis along the intersection between the orbital and reference planes,
    // pointing to the right ascension of the ascending node
    const n: Vector3D = Vector3D.yAxis.cross(h);
    const nM: number = n.magnitude();
    // Right Ascension of the Ascending Node
    // Angle is relative to the x-axis
    // // Add pi to correct for game space
    let omegaN: number;
    if (n.Z > 0) // Determine quadrant (on the (X,-Z) reference plane)
        omegaN = math.acos(n.X / nM); // + math.pi;
    else if (nM !== 0)
        omegaN = 2 * math.pi - math.acos(n.X / nM); // + math.pi;
    else
        omegaN = 0; // Orbital plane is in line with (X,-Z) plane

    // Eccentricity
    // Vector points to periapsis
    const e: Vector3D = v.cross(h).div(mu).sub(r.unit());
    const eM: number = e.magnitude();
    if (eM <= 1e-4) error("Orbit is near-circular") // Check for any NaN's

    // Argument of Periapsis
    // Angle is relative to the Right Ascension
    let omegaP: number;
    if (e.Y > 0) // Determine quadrant (on the orbital plane)
        omegaP = math.acos(n.dot(e) / (nM * eM));
    else if (e.Y < 0)
        omegaP = 2 * math.pi - math.acos(n.dot(e) / (nM * eM));
    else
        omegaP = -math.pi / 2; // Orbital plane is in line with X-Z plane, angle = 0
    // omegaP = (omegaP + math.pi / 2) % (2 * math.pi); // Correct for game space

    // True Anomaly
    // Angle is relative to the Argument of Periapsis
    let nu: number;
    if (v_r > 0) // Determine quadrant (on the orbital plane)
        nu = math.acos((r.unit()).dot(e.unit()));
    else if (v_r < 0)
        nu = 2 * math.pi - math.acos((r.unit()).dot(e.unit()));
    else { // Currently at an apsis
        // Altitude at semi-latus rectum
        const A_slr = (hM ** 2 / mu) * (1 / (1 + eM * math.cos(math.pi / 2)));
        nu = (rM < A_slr) ? 0 : math.pi;
    }

    // More orbital parameters

    // Eccentricity shortcuts
    const isBound = eM <= 1; // Includes parabola
    const isClosed = eM < 1; // Excludes parabola

    // Semi-major, semi-minor axes
    let semiMajorAxis: number, semiMinorAxis: number;
    if (eM === 1) {
        semiMajorAxis = semiMinorAxis = 1 / 0;
    } else {
        let eSubParam: number;
        if (eM < 1)
            eSubParam = 1 - eM ** 2;
        else
            eSubParam = eM ** 2 - 1;
        semiMajorAxis = (h.magnitude() ** 2) / (mu * eSubParam);
        semiMinorAxis = semiMajorAxis * math.sqrt(eSubParam);
    }

    // Period
    let period: number | false;
    if (eM < 1)
        period = 2 * math.pi * math.sqrt((semiMajorAxis ** 3) / mu);
    else
        period = false;

    return {
        angularMomentum: h,
        eccentricity: e,
        inclination: i,
        rightAscension: omegaN, // (omegaN !== 0) ? omegaN + math.pi : 0, // Correct for game space
        argumentOfPeriapsis: omegaP, // (omegaP + math.pi / 2) % (2 * math.pi), // Correct for game space
        trueAnomaly: nu,
        period: period as number | false,
        semiMajorAxis: semiMajorAxis,
        semiMinorAxis: semiMinorAxis,
        isBound: isBound,
        isClosed: isClosed,
        eccentricityScalar: eM
    };
}
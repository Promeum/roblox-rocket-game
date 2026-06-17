/*
    Helper classes for OrbitalTrajectory.
*/

import Vector3D from "shared/Modules/Libraries/Vector3D";

import Orientation from "shared/Modules/BaseModule/Orientation";
import Kinematic from "../../Physics/Kinematic";

// Utility functions

/**
 * https://en.wikipedia.org/wiki/Inverse_hyperbolic_functions
 */
function atanh(n: number): number {
	assert(math.round, "atanh() Input parameter out of range (-1, 1)")
	return math.log((1 + n) / (1 - n)) / 2;
}

/**
 * https://en.wikipedia.org/wiki/Inverse_hyperbolic_functions
 */
function asinh(n: number): number {
	return math.log(n + math.sqrt(n**2 + 1));
}

/**
 * The Newton-Raphson root-finding algorithm.
 * @param f Function to find the root of.
 * @param fp Derivative of f(x).
 * @param guess Initial value to search.
 * @param guessBounds Clamps each guess to be within this range.
 * @returns An array containing the x value at a possible root,
 * and true if the answer is within tolerance.
 */
export function newtonRaphson(
	f: (x: number) => number,
	fp: (x: number) => number,
	guess: number,
	tolerance?: number,
	guessBounds?: number[],
	maxRecursions?: number
): [number, boolean] {
	if (tolerance === undefined) tolerance = 1e-12;
	if (maxRecursions === undefined) maxRecursions = 7;
	let recursions: number = 0;
	let x: number = guess;
	let lastY: number = 0 / 0; // NaN
	let y: number = f(x);

	let nextGuess: () => number;
	if (guessBounds === undefined) nextGuess = () => x - f(x) / fp(x);
	else nextGuess = () => math.clamp(x - f(x) / fp(x), guessBounds[0], guessBounds[1]);

	while (math.abs(y) > tolerance && recursions < maxRecursions && lastY !== y) {
		x = nextGuess();
		lastY = y;
		y = f(x);
		// if (fp(x) === 0 && math.abs(y) > tolerance) // hit local min/max
		// 	x += math.pi / math.sqrt(2);
		recursions++;
	}

	// if (math.abs(y) > tolerance) warn(`newtonRaphson() Result is above tolerance (${math.abs(y)} > ${tolerance})`)

// print("newtonRaphson fin @ "+ `${recursions} recursions; y=${y}`)
	return [x, math.abs(y) <= tolerance];
}

// Main classes

/**
 * Basic type facilitating access of orbital parameters in utility classes
 */
export type OuterClass = {
	angularMomentum: Vector3D
	timeSincePeriapsis: number
	eccentricityScalar: number
	period: number // set to -1 if orbit eccentricity >= 1
	mu: number
	rM: number
}

export abstract class Orbit {
	constructor(protected outer: OuterClass) {
		// outer.timeSincePeriapsis = this.trueToTime(outer.trueAnomaly);
	}

	// Main conversions
	public abstract timeToTrue(time: number): number
	public abstract trueToTime(trueAnomaly: number): number

	// Other calculations
	/** Returns a range centered at zero with a constant radius */
	public abstract trueAnomalyRange(): NumberRange // TODO: REPLACE ALL NumberRange WITH NON-FLOAT REPLACEMENT
	public trueToAltitude(trueAnomaly: number): number {
		const e = this.outer.eccentricityScalar;
		const mu = this.outer.mu;
		const h = this.outer.angularMomentum.magnitude();
		// Orbit equation
		return (h ** 2 / mu) * (1 / (1 + e * math.cos(trueAnomaly)));
	}
	/** Returns a KinematicState in perifocal math space */
	public trueToKinematic(trueAnomaly: number): Kinematic {
		const e = this.outer.eccentricityScalar;
		const mu = this.outer.mu;
		const h = this.outer.angularMomentum.magnitude();

		// Orbit equation, vectors are in math space
		const altitude = this.trueToAltitude(trueAnomaly);
		const cartesian2D = Orientation.polarToCartesian(altitude, trueAnomaly)
		const positionPerifocal: Vector3D = new Vector3D(-cartesian2D[1], 0, cartesian2D[0]); // (game space)
		// From vis viva equation
		const velocityPerifocal: Vector3D = new Vector3D(
			-(e + math.cos(trueAnomaly)),
			0,
			-math.sin(trueAnomaly)
		).mul(mu / h);
		// const velocityPerifocal: Vector3D = new Vector3D(
		// 	math.sin(trueAnomaly),
		// 	0,
		// 	-(e + math.cos(trueAnomaly))
		// ).mul(mu / h);

		return new Kinematic(
			positionPerifocal,
			velocityPerifocal
		);
	}

}

// Inner classes representing different types of orbits

export abstract class CircularElliptical extends Orbit {
	override trueAnomalyRange(): NumberRange {
		return new NumberRange(-math.pi, math.pi);
	}
}

export class Circular extends CircularElliptical {
	// Main conversions
	override timeToTrue(time: number): number {
		return time * (2 * math.pi / this.outer.period);
	}
	override trueToTime(trueAnomaly: number): number {
		return trueAnomaly * (this.outer.period / (2 * math.pi));
	}

	// Equations are degenerate (mean = eccentric = true anomaly) in a
	// circular orbit, so time is directly correlated with true anomaly
}

export class Elliptical extends CircularElliptical {
	// Main conversions
	override timeToTrue(time: number): number {
		const ret = this.eccentricToTrue(this.meanToEccentric(this.timeToMean(time)))
// assert(ret === ret, "trueAnomaly = nan")
		return ret;
	}
	override trueToTime(trueAnomaly: number): number {
		return this.meanToTime(this.eccentricToMean(this.trueToEccentric(trueAnomaly)));
	}

	// Time-Mean
	protected meanToTimeSincePe(meanAnomaly: number): number {
		return meanAnomaly * (this.outer.period / (2 * math.pi));
	}
	protected timeSincePeToMean(time: number): number {
		return time * (2 * math.pi / this.outer.period);
	}

	protected meanToTime(meanAnomaly: number): number {
		return this.meanToTimeSincePe(meanAnomaly) - this.outer.timeSincePeriapsis;
	}
	protected timeToMean(time: number): number {
		return this.timeSincePeToMean(time + this.outer.timeSincePeriapsis);
	}

	// Mean-Eccentric
	protected eccentricToMean(eccentricAnomaly: number): number {
		return eccentricAnomaly - this.outer.eccentricityScalar * math.sin(eccentricAnomaly);
	}
	protected meanToEccentric(meanAnomaly: number): number {
		// The raw Newton-Raphson method is unstable for high eccentricities (e = 0.99...)
		// but has been fixed with ultra-specific error bound calculations
		// Consider a different root-finding method?
		// if (this.outer.eccentricityScalar < 0.9) {
		let min: number;
		let max: number;
		if (math.floor(meanAnomaly / math.pi) % 2 === 0) {
			min = meanAnomaly;
			max = math.min(math.pi * math.ceil(meanAnomaly / math.pi), meanAnomaly + this.outer.eccentricityScalar);
		} else {
			min = math.max(math.pi * math.floor(meanAnomaly / math.pi), meanAnomaly - this.outer.eccentricityScalar);
			max = meanAnomaly;
		}
		return newtonRaphson(
			E => E - this.outer.eccentricityScalar * math.sin(E) - meanAnomaly,
			E => 1 - this.outer.eccentricityScalar * math.cos(E),
			meanAnomaly, undefined, [min, max], 9
		)[0];
		// } else {
		// 	Different root-finding method that is more stable?
		// }
	}

	// Eccentric-True
	protected trueToEccentric(trueAnomaly: number): number {
		if ((trueAnomaly / math.pi - 1) % 2 !== 0) {
			const squareRoot = math.sqrt((1 - this.outer.eccentricityScalar) / (1 + this.outer.eccentricityScalar));
			const angleOffset = 2 * math.pi * math.ceil((trueAnomaly / math.pi - 1) / 2);
			return 2 * math.atan(squareRoot * math.tan(trueAnomaly / 2)) + angleOffset;
		} else {
			return trueAnomaly;
		}
	}
	protected eccentricToTrue(eccentricAnomaly: number): number {
		if ((eccentricAnomaly / math.pi - 1) % 2 !== 0) {
			const squareRoot = math.sqrt((1 + this.outer.eccentricityScalar) / (1 - this.outer.eccentricityScalar));
			const angleOffset = 2 * math.pi * math.ceil((eccentricAnomaly / math.pi - 1) / 2);
			return 2 * math.atan(squareRoot * math.tan(eccentricAnomaly / 2)) + angleOffset;
		} else {
			return eccentricAnomaly;
		}
	}
}

export abstract class ParabolicHyperbolic extends Orbit {
	override trueAnomalyRange(): NumberRange {
		const radius = math.acos(-1 / this.outer.eccentricityScalar);
		return new NumberRange(-radius, radius);
	}
}

export class Parabolic extends ParabolicHyperbolic {
	// Main conversions
	override timeToTrue(time: number): number {
		return this.meanToTrue(this.timeToMean(time));
	}
	override trueToTime(trueAnomaly: number): number {
		return this.meanToTime(this.trueToMean(trueAnomaly));
	}

	// Time-Mean
	protected meanToTimeSincePe(meanAnomaly: number): number {
		const h_mu = (this.outer.angularMomentum.magnitude() ** 3) / (this.outer.mu ** 2);
		return h_mu * meanAnomaly;
	}
	protected timeSincePeToMean(time: number): number {
		const mu_h = (this.outer.mu ** 2) / (this.outer.angularMomentum.magnitude() ** 3);
		return mu_h * time;
	}

	protected meanToTime(meanAnomaly: number): number {
		return this.meanToTimeSincePe(meanAnomaly) - this.outer.timeSincePeriapsis;
	}
	protected timeToMean(time: number): number {
		return this.timeSincePeToMean(time + this.outer.timeSincePeriapsis);
	}

	// (Parabolic orbit does not have eccentric anomaly)

	// Mean-True
	protected trueToMean(trueAnomaly: number): number {
		const tan = math.tan(trueAnomaly / 2);
		return tan / 2 + tan ** 3 / 6;
	}
	protected meanToTrue(meanAnomaly: number): number {
		const z = ( 3 * meanAnomaly + math.sqrt(1 + (3 * meanAnomaly) ** 2) ) ** (1 / 3);
		return 2 * math.atan(z - 1 / z);
	}
}

export class Hyperbolic extends ParabolicHyperbolic {
	// Main conversions
	override timeToTrue(time: number): number {
		return this.eccentricToTrue(this.meanToEccentric(this.timeToMean(time)));
	}
	override trueToTime(trueAnomaly: number): number {
		return this.meanToTime(this.eccentricToMean(this.trueToEccentric(trueAnomaly)));
	}

	// Time-Mean
	protected meanToTimeSincePe(meanAnomaly: number): number {
		const h_mu = (this.outer.angularMomentum.magnitude() ** 3) / (this.outer.mu ** 2);
		const squareRoot = math.sqrt((this.outer.eccentricityScalar ** 2 - 1) ** 3);
		return h_mu * meanAnomaly / squareRoot;
	}
	protected timeSincePeToMean(time: number): number {
		const mu_h = (this.outer.mu ** 2) / (this.outer.angularMomentum.magnitude() ** 3);
		const squareRoot = math.sqrt((this.outer.eccentricityScalar ** 2 - 1) ** 3);
		return mu_h * time * squareRoot;
	}

	protected meanToTime(meanAnomaly: number): number {
		return this.meanToTimeSincePe(meanAnomaly) - this.outer.timeSincePeriapsis;
	}
	protected timeToMean(time: number): number {
		return this.timeSincePeToMean(time + this.outer.timeSincePeriapsis);
	}

	// Mean-Eccentric
	protected eccentricToMean(eccentricAnomaly: number): number {
		return this.outer.eccentricityScalar * math.sinh(eccentricAnomaly) - eccentricAnomaly;
	}
	protected meanToEccentric(meanAnomaly: number): number {
		return newtonRaphson(
			F => this.outer.eccentricityScalar * math.sinh(F) - F - meanAnomaly,
			F => this.outer.eccentricityScalar * math.cosh(F) - 1,
			asinh(meanAnomaly), undefined, undefined, 9
		)[0];
	}

	// Eccentric-True
	protected trueToEccentric(trueAnomaly: number): number {
		const squareRoot = math.sqrt((this.outer.eccentricityScalar - 1) / (this.outer.eccentricityScalar + 1));
		return 2 * atanh(squareRoot * math.tan(trueAnomaly / 2));
	}
	protected eccentricToTrue(eccentricAnomaly: number): number {
		const squareRoot = math.sqrt((this.outer.eccentricityScalar + 1) / (this.outer.eccentricityScalar - 1));
		return 2 * math.atan(squareRoot * math.tanh(eccentricAnomaly / 2));
	}
}

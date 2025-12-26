// import { $assert, $error } from "rbxts-transform-debug";
import CelestialState from ".";
import Vector3D from "shared/Modules/Libraries/Vector3D";
import KinematicTemporalState from "../Relative/State/KinematicTemporalState";
import type Celestial from "../Relative/Celestial";
import type GravityCelestial from "../Relative/Celestial/GravityCelestial";

/*
	TODO:
	Replace kinematicTemporalState with a LinearState (.temporalState is unused)
*/

/*
	Useful links
	https://www.bogan.ca/orbits/kepler/orbteqtn.html
	https://orbital-mechanics.space/classical-orbital-elements/classical-orbital-elements.html
	https://orbital-mechanics.space/classical-orbital-elements/orbital-elements-and-the-state-vector.html
	https://en.wikipedia.org/wiki/Orbital_elements
*/

/**
 * OrbitalState is the state of a Celestial on an OrbitalTrajectory,
 * handling orbital and kinematic parameters.
 * Does magic math for the parameter conversions.
 */
export default class OrbitalState extends CelestialState {
	public readonly orbiting: GravityCelestial;

	// Misc. orbital parameters
	public readonly angularMomentum: Vector3D;
	public readonly eccentricity: Vector3D;
	public readonly inclination: number;
	public readonly rightAscension: number;
	public readonly argumentOfPeriapsis: number;
	public readonly trueAnomaly: number;

	// Constructors

	/**
	 * Creates a new OrbitalState instance from a CelestialState.
	 */
	public constructor(initialPosition: CelestialState, orbiting: GravityCelestial);

	/**
	 * Creates a new OrbitalState instance from a KinematicTemporalState.
	 */
	public constructor(initialPosition: KinematicTemporalState, orbiting: GravityCelestial, celestial: Celestial);

	public constructor(arg1: KinematicTemporalState | CelestialState, arg2: GravityCelestial, arg3?: Celestial) {
		if (arg1 instanceof CelestialState) {
			super(arg1);
		} else {
			assert(arg3)
			super(arg1, arg3);
		}

		this.orbiting = arg2;

		// Quick access kinematics

		const mu: number = this.orbiting.mu; // Standard gravitational parameter
		const r: Vector3D = this.kinematicPosition.getPosition(); // Position vector
		const rM: number = r.magnitude(); // Position magnitude
		const v: Vector3D = this.kinematicPosition.getVelocity(); // Velocity vector
		// const vM: number = v.magnitude(); // Velocity magnitude

		// Key orbital parameters
		// https://orbital-mechanics.space/classical-orbital-elements/orbital-elements-and-the-state-vector.html

		const v_r: number = v.dot(r.unit()); // Radial velocity
		// const v_T: number = math.sqrt(vM * vM - v_r * v_r); // Azumithal velocity

		const h: Vector3D = r.cross(v); // Orbital Angular Momentum. Normal to the orbital plane
		const hM: number = h.magnitude(); // ...and its magnitude

		const i: number = math.acos(h.Y / hM) // Inclination

		// Axis along the intersection between the orbital and reference planes,
		// pointing to the right ascension of the ascending node
		const n: Vector3D = Vector3D.yAxis.cross(h);
		const nM: number = n.magnitude();
		// Right Ascension of the Ascending Node
		// Angle is relative to the x-axis
		let omegaN: number;
		if (n.Z >= 0) // Determine quadrant (on the X-Z reference plane)
			omegaN = math.acos(n.X / nM);
		else
			omegaN = 2 * math.pi - math.acos(n.X / nM);

		// Eccentricity
		// Vector points to periapsis
		const e: Vector3D = v.cross(h).div(mu).sub(r.unit());
		const eM: number = e.magnitude();

		// Argument of Periapsis
		// Angle is relative to the Right Ascension
		let omegaP: number;
		if (e.Y >= 0) // Determine quadrant (on the orbital plane)
			omegaP = math.acos(n.dot(e).idiv(nM * eM));
		else
			omegaP = 2 * math.pi - math.acos(n.dot(e).idiv(nM * eM));

		// True Anomaly
		// Angle is relative to the Argument of Periapsis
		let nu: number;
		if (v_r >= 0) // Determine quadrant (on the orbital plane)
			nu = math.acos(e.dot(r).idiv(eM * rM));
		else
			nu = 2 * math.pi - math.acos(e.dot(r).idiv(eM * rM));

		this.angularMomentum = h;
		this.eccentricity = e;
		this.inclination = i;
		this.rightAscension = omegaN;
		this.argumentOfPeriapsis = omegaP;
		this.trueAnomaly = nu;
	}

}
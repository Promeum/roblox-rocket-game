// import { $assert, $error, $warn } from "rbxts-transform-debug";
import Vector3D from "../../../Libraries/Vector3D";
// import MOID from "../../Libraries/MOID";

import KinematicState from "../State/KinematicState";
import TemporalState from "../State/TemporalState";
import AccelerationState from "../State/AccelerationState";
import KinematicTemporalState from "../State/KinematicTemporalState";
import TrajectoryState from "../TrajectoryState";
import OrbitalState from "../TrajectoryState/OrbitalState";
import Trajectory from ".";

import type GravityCelestial from "../../Celestial/GravityCelestial";

/*
	TODO:
	Move the complex math stuff into a library?
	Add a Bisection Search function?
*/

/**
 * OrbitalTrajectory represents an orbital trajectory with orbital motion.
 */
export default class OrbitalTrajectory extends Trajectory {
	declare readonly start: OrbitalState;
	private readonly orbit: Orbit;
	public readonly orbiting: GravityCelestial;
	// Cannot remove orbiting since calcs need mu
	// and itd be weird if a constructor parameter was just mu

	// Key orbital parameters
	public readonly angularMomentum: Vector3D;
	public readonly eccentricity: Vector3D;
	public readonly inclination: number;
	public readonly rightAscension: number;
	public readonly argumentOfPeriapsis: number;
	public readonly trueAnomaly: number;

	// Misc. orbital parameters
	private readonly apoapsis: OrbitalState | false;
	private readonly periapsis: OrbitalState | false;
	private readonly period: number | false;
	public readonly semiMajorAxis: number;
	public readonly semiMinorAxis: number;
	public readonly isBound: boolean;
	public readonly isClosed: boolean;
	public readonly eccentricityScalar: number;
	private readonly timeSincePeriapsis: number;

	// Perifocal frame
	private readonly p: Vector3D; // x-axis
	private readonly q: Vector3D; // y-axis
	private readonly w: Vector3D; // z-axis
	
	// Quick access kinematics
	protected readonly mu: number; // Standard gravitational parameter
	protected readonly r: Vector3D; // Position vector
	protected readonly rM: number; // Position magnitude
	protected readonly v: Vector3D; // Velocity vector
	// protected readonly vM: number; // Velocity magnitude

	// Constructors

	/**
	 * Internal constructor.
	 */
	public constructor(start: OrbitalState);

	/**
	 * Creates a new OrbitalTrajectory instance.
	 */
	public constructor(position: KinematicTemporalState, orbiting: GravityCelestial);

	/**
	 * Creates a new OrbitalTrajectory instance.
	 */
	public constructor(position: Vector3D, velocity: Vector3D, temporal: TemporalState, orbiting: GravityCelestial);

	public constructor(
			arg1: OrbitalState | KinematicTemporalState | Vector3D,
			arg2?: GravityCelestial | Vector3D,
			arg3?: TemporalState,
			arg4?: GravityCelestial
		) {
		let start: OrbitalState | undefined;
		let orbit: Orbit | undefined;
		let orbiting: GravityCelestial;
		let position: KinematicTemporalState;

		// Constructor overloads

		if (arg1 instanceof OrbitalState) {
			start = arg1;
			orbit = arg1.trajectory.orbit;
			orbiting = orbiting = arg1.trajectory.orbiting;
			position = arg1.getKinematic();
		} else if (arg1 instanceof KinematicTemporalState) {
			assert(arg2 && !(arg2 instanceof Vector3D))
			orbiting = arg2;
			position = arg1;
		} else {
			assert(arg2 instanceof Vector3D && arg3 && arg4)
			orbiting = arg4;
			position = new KinematicTemporalState(
				new KinematicState(arg1, arg2, orbiting.trajectory.getKinematic(arg3).kinematicState),
				arg3
			);
		}

		super(orbiting.trajectory);
		if (start) this.start = start;
		if (orbit) this.orbit = orbit;
		this.orbiting = orbiting;

		if (position.getVelocity().magnitude() === 0 || position.getPosition().magnitude() === 0) {
			// patch for 0 position or velocity
			const newPos = position.getPosition().magnitude() === 0 ? new Vector3D(1e-10, 0, 0) : position.getPosition();
			const newVel = position.getVelocity().magnitude() === 0 ? new Vector3D(0, 1e-10, 0) : position.getVelocity();
			position = new KinematicTemporalState(
				new KinematicState(
					newPos,
					newVel,
					position.kinematicState.getRelativeOrUndefined()
				),
				position.temporalState
			);
		}

		// Quick access kinematics

		const mu: number = this.mu = this.orbiting.mu; // Standard gravitational parameter
		const r: Vector3D = this.r = position.kinematicState.position; // Position vector
		const rM: number = this.rM = this.r.magnitude(); // Position magnitude
		const v: Vector3D = this.v = position.kinematicState.velocity; // Velocity vector
		// const vM: number = this.vM = this.v.magnitude(); // Velocity magnitude

		// Key orbital parameters (all values adjusted fo game space)
		// https://orbital-mechanics.space/classical-orbital-elements/orbital-elements-and-the-state-vector.html

		const v_r: number = v.dot(r.unit()); // Radial velocity
		// const v_T: number = math.sqrt(vM * vM - v_r * v_r); // Azumithal velocity

		const h: Vector3D = r.cross(v); // Orbital Angular Momentum. Normal to the orbital plane.
		const hM: number = h.magnitude(); // ...and its magnitude

		const i: number = -math.acos(h.Y / hM); // Inclination, negated (game space)

		// Axis along the intersection between the orbital and reference planes,
		// pointing to the right ascension of the ascending node
		const n: Vector3D = Vector3D.yAxis.cross(h);
		const nM: number = n.magnitude();
		// Right Ascension of the Ascending Node
		// Angle is relative to the x-axis
		// Add pi to correct for game space
		let omegaN: number;
		if (n.Z > 0) // Determine quadrant (on the X-Z reference plane)
			omegaN = math.acos(n.X / nM) + math.pi;
		else if (nM !== 0)
			omegaN = 2 * math.pi - math.acos(n.X / nM) + math.pi;
		else
			omegaN = 0; // Orbital plane is in line with X-Z plane

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
		omegaP = (omegaP + math.pi / 2) % (2 * math.pi); // Correct for game space

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

		this.angularMomentum = h;
		this.eccentricity = e;
		this.inclination = i;
		this.rightAscension = omegaN;
		this.argumentOfPeriapsis = omegaP;
		this.trueAnomaly = nu;

		// Generate start position
		if (!this.start) {
			this.start = new OrbitalState(
				this,
				position.temporalState,
				this.trueAnomaly,
				position.kinematicState
			);
		}

		// More orbital parameters

		// Eccentricity shortcuts
		this.eccentricityScalar = this.eccentricity.magnitude();
		this.isBound = this.eccentricityScalar <= 1; // Includes parabola
		this.isClosed = this.eccentricityScalar < 1; // Excludes parabola

		// Semi-major, semi-minor axes
		if (this.eccentricityScalar === 1) {
			this.semiMajorAxis = this.semiMinorAxis = 1 / 0;
		} else {
			let eSubParam: number;
			if (this.eccentricityScalar < 1)
				eSubParam = 1 - this.eccentricityScalar ** 2;
			else
				eSubParam = this.eccentricityScalar ** 2 - 1;
			this.semiMajorAxis = (h.magnitude() ** 2) / (mu * eSubParam);
			this.semiMinorAxis = this.semiMajorAxis * math.sqrt(eSubParam);
		}

		// Period
		if (this.eccentricityScalar < 1)
			this.period = 2 * math.pi * math.sqrt((this.semiMajorAxis ** 3) / mu);
		else
			this.period = false;

		// Set orbit type
		const constructorObject: OuterClass = {
			angularMomentum: this.angularMomentum,
			timeSincePeriapsis: 0,
			eccentricityScalar: eM,
			period: this.period !== false ? this.period : -1,
			mu: this.mu,
			rM: this.rM
		};

		if (eM === 0)
			this.orbit = new Circular(constructorObject);
		else if (this.isClosed)
			this.orbit = new Elliptical(constructorObject);
		else if (this.isBound)
			this.orbit = new Parabolic(constructorObject);
		else
			this.orbit = new Hyperbolic(constructorObject);

		this.timeSincePeriapsis = constructorObject.timeSincePeriapsis = this.orbit.trueToTime(nu);
		// Perifocal Frame
		// https://orbital-mechanics.space/classical-orbital-elements/perifocal-frame.html
		this.p = this.eccentricity.unit();
		this.q = h.unit();
		this.w = this.p.cross(this.q);

		// Apoapsis and Periapsis
		this.periapsis = this.calculateStateFromTrueAnomaly(0);

		if (this.isClosed) {
			this.apoapsis = this.calculateStateFromTrueAnomaly(math.pi);
		} else {
			this.apoapsis = false;
		}

		// checking if input pos/vel match
		const realS = this.start.getKinematic()
		const calcS = this.calculateStateFromTime(0).getKinematic()
		if (realS.getPosition().sub(calcS.getPosition()).magnitude() > 0.1 || realS.getVelocity().sub(calcS.getVelocity()).magnitude() > 0.1) {
			warn(`start positions inconsistent by ${realS.getPosition().sub(calcS.getPosition()).magnitude()}`)
		}
		this.start = this.calculateStateFromTime(0);
if (this.orbiting.name === "Moon") this._testpart(
	"SOI entry this trajectory (this.start)",
	new BrickColor("Rust").Color,
	new Vector3D(0.5,2,0.5),
	this.start.getKinematic().consolidateOnce().getPosition().mul(1/6371.01e3),
	game.Workspace,
	Enum.PartType.Cylinder
)
	}

	// TODO: Find out if the Unversal Anomaly can handle circular and parabolic orbits
	// May switch out to that if its faster...
	// Or if not then transfer all the math to inner classes
	// to seperate the control flow from the math!

	// Utility Methods

	/**
	 * Transforms a Vector3D to global space.
	 * https://orbital-mechanics.space/classical-orbital-elements/perifocal-frame.html
	 * https://en.wikipedia.org/wiki/Change_of_basis#Change_of_basis_formula
	 * @param toTransform A vector in perifocal space.
	 */
	private perifocalToGlobal(toTransform: Vector3D): Vector3D {
		// change all vectors into math basis
		// this mystery math was achieved through trial and error
		const p = new Vector3D(this.w.X, this.w.Z, this.w.Y);
		const q = new Vector3D(this.p.X, this.p.Z, this.p.Y);
		const w = new Vector3D(this.q.X, this.q.Z, this.q.Y);
		const v = new Vector3D(toTransform.X, toTransform.Z, toTransform.Y);

		const result = inverseChangeBasis(v, p, q, w);
		return new Vector3D(result.X, result.Z, result.Y);

		// rotate 3 times to change the basis (angles adjusted to be in math basis)
		// const p1 = axisRotation(p, w, -this.argumentOfPeriapsis);
		// const w2 = axisRotation(w, p1, -this.inclination);

		// const result = axisRotation(
		// 	axisRotation(
		// 		axisRotation(
		// 			v,
		// 			w2,
		// 			this.rightAscension
		// 		),
		// 		p1,
		// 		this.inclination
		// 	),
		// 	w,
		// 	this.argumentOfPeriapsis
		// );
		// return new Vector3D(result.X, result.Z, result.Y);
	}

	/**
	 * Transforms a Vector3D to perifocal space.
	 * https://orbital-mechanics.space/classical-orbital-elements/perifocal-frame.html
	 * https://en.wikipedia.org/wiki/Change_of_basis#Change_of_basis_formula
	 * @param toTransform A vector in global space.
	 */
	private globalToPerifocal(toTransform: Vector3D): Vector3D {
		// change all vectors into math basis
		// this mystery math was achieved through trial and error
		const p = new Vector3D(this.w.X, this.w.Z, this.w.Y);
		const q = new Vector3D(this.p.X, this.p.Z, this.p.Y);
		const w = new Vector3D(this.q.X, this.q.Z, this.q.Y);
		const v = new Vector3D(toTransform.X, toTransform.Z, toTransform.Y);

		const result = changeBasis(v, p, q, w);
		// return in game space
		return new Vector3D(result.X, result.Z, result.Y);

		// // rotate 3 times to change the basis (angles adjusted to be in math basis)
		// const p1 = axisRotation(p, w, -this.argumentOfPeriapsis);
		// const w2 = axisRotation(w, p1, -this.inclination);

		// const result = axisRotation(
		// 	axisRotation(
		// 		axisRotation(
		// 			v,
		// 			w,
		// 			-this.argumentOfPeriapsis
		// 		),
		// 		p1,
		// 		-this.inclination
		// 	),
		// 	w2,
		// 	-this.rightAscension
		// );
		// return new Vector3D(result.X, result.Z, result.Y);
	}

	/**
	 * Transsforms a KinematicState to global space.
	 */
	private perifocalKinematicToGlobal(toTransform: KinematicState): KinematicState {
		return new KinematicState(
			this.perifocalToGlobal(toTransform.position),
			this.perifocalToGlobal(toTransform.velocity),
			toTransform.getRelativeOrUndefined()
		)
	}

	// Position Calculations

	override getKinematic(time: TemporalState | number): KinematicTemporalState {
		const relativeTime: number = this.asRelativeTime(time);
		const temporal: TemporalState = new TemporalState(relativeTime, this.start.time);
		const trueAnomaly: number = this.orbit.timeToTrue(relativeTime);
		const position: KinematicState = this.trueToKinematic(trueAnomaly, relativeTime);

		return new KinematicTemporalState(position, temporal);
	}

	/**
	 * Calculates the state of orbiting at a given time.
	 * @param time Numbers assumed to be relative to this.start.time.
	 */
	private calculateOrbitingStateFromTime(time: TemporalState | number): TrajectoryState {
		const temporal: TemporalState = new TemporalState(this.asRelativeTime(time), this.start.time);

		return this.getRelative().calculateStateFromTime(
			this.getRelative().start.time.matchRelative(temporal).relativeTime
		);
	}

	// For use in State from True Anomaly and State from Time
	private trueToKinematic(trueAnomaly: number, time: number): KinematicState {
		const perifocalKinematic: KinematicState = this.orbit.trueToKinematic(trueAnomaly);
		return new KinematicState(
			this.perifocalToGlobal(perifocalKinematic.position),
			this.perifocalToGlobal(perifocalKinematic.velocity),
			this.calculateOrbitingStateFromTime(time).getKinematic().kinematicState
		)
	}

	// State Calculations

	public calculateStateFromTrueAnomaly(trueAnomaly: number): OrbitalState {
		const time: number = this.orbit.trueToTime(trueAnomaly);
		const temporal: TemporalState = new TemporalState(time, this.start.time);
		const position: KinematicState = this.trueToKinematic(trueAnomaly, time);

		return new OrbitalState(this, temporal, trueAnomaly, position);
	}

	override calculateStateFromTime(time: TemporalState | number): OrbitalState {
		const relativeTime: number = this.asRelativeTime(time);
		const trueAnomaly: number = this.orbit.timeToTrue(relativeTime);
		const temporal: TemporalState = new TemporalState(relativeTime, this.start.time);
		const position: KinematicState = this.trueToKinematic(trueAnomaly, relativeTime);

		return new OrbitalState(this, temporal, trueAnomaly, position);
	}

	override calculateStateFromPoint(position: Vector3D): OrbitalState {
		// // transform to perifocal space
		// const transformed: Vector3D = this.globalToPerifocal(position);
		// // project to orbital plane
		// const projected: Vector3D = new Vector3D(
		// 	transformed.X, transformed.Z, transformed.Y
		// );
		// // calculate closest point to orbit (conic section)
		// const distanceFromPoint = (trueAnomaly: number): number => {
		// 	const orbitalPos: Vector3D = this.orbit.;
		// 	return position.sub(thisPosition).magnitude();
		// }
		const distanceFromPoint = (trueAnomaly: number): number => {
			const thisPosition: Vector3D = this.perifocalToGlobal(
				this.orbit.trueToKinematic(trueAnomaly).position);
			return position.sub(thisPosition).magnitude();
		}

		const closestApproach = newtonRaphson(
			tA => distanceFromPoint(tA),
			tA => (distanceFromPoint(tA + 0.0001) - distanceFromPoint(tA - 0.0001)) / 0.0002, // secant apporach... could there be a better way?
			math.pi / 2
		)[0];

		return this.calculateStateFromTrueAnomaly(closestApproach);
	}

	/**
	 * If the orbit is elliptical, returns the soonest time which is
	 * guaranteed to be positive.
	 * If the orbit is hyperbolic, returns the next time if it is
	 * not already past (guaranteed to be positive), or the latest
	 * time which could be negative.
	 */
	override calculateStateFromMagnitude(altitude: number): OrbitalState {
		const e = this.eccentricityScalar;
		const mu = this.mu;
		const h = this.angularMomentum.magnitude();
		// Orbit equation solved for altitude
		const tA = math.acos(((h ** 2) / (mu * altitude) - 1) / e);

		if (this.isClosed) { // Select soonest time
			const anomaly1 = (tA - this.trueAnomaly) % (2 * math.pi) + this.trueAnomaly;
			const anomaly2 = (-tA - this.trueAnomaly) % (2 * math.pi) + this.trueAnomaly;
			const time1 = this.orbit.trueToTime(anomaly1);
			const time2 = this.orbit.trueToTime(anomaly2);
			let selectedTrueAnomaly: number;
			print(this.start.time.getRelative().relativeTime)
			if (time1 < time2 && time1 > 1e-4) {
				selectedTrueAnomaly = anomaly1;
			} else {
				selectedTrueAnomaly = anomaly2;
			}
			return this.calculateStateFromTrueAnomaly(
				selectedTrueAnomaly);
		} else { // Select next or latest time
			return this.calculateStateFromTrueAnomaly(
				this.trueAnomaly <= -tA ? -tA : tA);
		}
	}

	// Accessors

	/**
	 * Returns whether this trajectory has an apoapsis.
	 * @returns true if there is an apoapsis
	 */
	public hasApoapsis(): boolean {
		return this.apoapsis !== false;
	}

	/**
	 * Returns the apoapsis.
	 * @returns The apoapsis state
	 */
	public getApoapsis(): OrbitalState {
		assert(this.apoapsis !== false, "OrbitalState getApoapsis() Cannot call getApoapsis() on a non-elliptical OrbitalState");
		return this.apoapsis;
	}

	/**
	 * Returns the periapsis.
	 * @returns The periapsis state
	 */
	public getPeriapsis(): OrbitalState {
		assert(this.periapsis !== false, "OrbitalState getPeriapsis() Cannot call getPeriapsis() on a circular OrbitalState");
		return this.periapsis;
	}

	/**
	 * Returns the period.
	 * @returns The period
	 */
	public getPeriod(): number {
		assert(this.period !== false, "OrbitalState getPeriod() Cannot call getPeriod() on a non-elliptical OrbitalState");
		return this.period;
	}

	// Methods

	/**
	 * Finds the next one/two closest points.
	 * TODO: How many points should be calculated?
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override MOID(other: OrbitalTrajectory): OrbitalState[] {
		error("OrbitalTrajectory MOID() not implemented");
	}

	/**
	 * @param other The other OrbitalTrajectory to compare with.
	 * @param distance The target distance at which a state may be found.
	 */
	override orbitalIntersection(other: OrbitalTrajectory, distance: number): [OrbitalState, OrbitalState] | false {
		// Current implementation: Naive true anomaly-based approach
		const toOtherTrueAnomaly = (trueAnomaly: number): number => {
			return other.orbit.timeToTrue(
				other.start.time.matchRelative(
					new TemporalState(this.orbit.trueToTime(trueAnomaly), this.start.time)
				).relativeTime
			);
		}
		const distanceAtTrueAnomaly = (trueAnomaly: number): number => {
			const thisPosition: Vector3D = this.perifocalToGlobal(
				this.orbit.trueToKinematic(trueAnomaly).position);
			const otherPosition: Vector3D = other.perifocalToGlobal(
				other.orbit.trueToKinematic(toOtherTrueAnomaly(trueAnomaly)).position);
			return otherPosition.sub(thisPosition).magnitude();
		}
warn("orbitalIntersection() call")


// let p="[" // function visual
// for(let i=0;i<500;i++){
// 	const o=(i/6)*math.pi/2
// 	p+="("+o+"x,"+(distanceAtTrueAnomaly(o) - distance)+"),"
// }p+="]"
// print(p.gsub(",]","]")[0])
// let p="[" // points to test
// for(let i=0;i<17;i++){
// 	const o=(i * 10 / 9)*math.pi + this.trueAnomaly
// 	p+="("+o+"x,"+(distanceAtTrueAnomaly(o) - distance)+"),"
// }p+="]"

// print(p.gsub(",]","]")[0])

// let q="[" // found roots

		const roots: number[] = [];

		let guessCount = 0; // 17 recursions max
		let guess = 0;
		let orbitalIntersection: [number, boolean] = [-1, false];
		while (guessCount < 17) {
			guess = (guessCount * 10 / 9) * math.pi + this.trueAnomaly;
			guessCount++;
			orbitalIntersection = newtonRaphson(
				tA => distanceAtTrueAnomaly(tA) - distance,
				tA => (distanceAtTrueAnomaly(tA + 0.00001) - distanceAtTrueAnomaly(tA - 0.00001)) / 0.00002, // secant approach... could there be a better way?
				guess, 1e-4, undefined, 20
			);

			if (
				orbitalIntersection[1] // root must be close enough to 0
				&& orbitalIntersection[0] >= this.trueAnomaly // root must be in the future
				&& ( // derivative of distance must be negative (entering SOI)
					distanceAtTrueAnomaly(orbitalIntersection[0] + 0.0001)
					- distanceAtTrueAnomaly(orbitalIntersection[0] - 0.0001)) / 0.0002
					< 0
			) {
				roots.push(orbitalIntersection[0]);
// print("orbital intersection found")
// q+="("+orbitalIntersection[0]+"x,"+(distanceAtTrueAnomaly(orbitalIntersection[0])-distance)+"),"
			}
		}
// print("orbitalIntersection roots")
// print(roots)

		// Get the soonest answer, if any exist
		const answer = roots.size() > 0 ? math.min(...roots) : false;

// q+="]"
// print(q.gsub(",]","]")[0])
if (answer !== false){
// print("this trajectory's start anomaly:")
// print(this.trueAnomaly)
// print("the answer")
// print("("+answer+"x,"+(distanceAtTrueAnomaly(answer)-distance)+")")
this._testpart(
	"SOI entry last trajectory (post-calc)",
	new BrickColor("Sea green").Color,
	Vector3D.one.mul(0.9),
	this.calculateStateFromTrueAnomaly(answer).getKinematic().getPosition().mul(1/6371.01e3),
	game.Workspace
)
}
		if (answer !== false) {
			return [
				this.calculateStateFromTrueAnomaly(answer),
				other.calculateStateFromTrueAnomaly(toOtherTrueAnomaly(answer))
			];
		} else {
			return false;
		}
	}

	override atTime(delta: number, withAcceleration?: AccelerationState): OrbitalTrajectory {
		if (withAcceleration) {
			// Calculate and add the acceleration as a seperate velocity + position offset
			const velocityToAdd: Vector3D = withAcceleration.getAccelerationVector(delta);

			return new OrbitalTrajectory(
				new KinematicTemporalState(
					this.calculateStateFromTime(delta).getKinematic().kinematicState.add(
						new KinematicState(velocityToAdd.mul(delta), velocityToAdd)
					),
					this.start.time.withIncrementTime(delta)
				),
				this.orbiting
			);
		} else {
			return new OrbitalTrajectory(this.calculateStateFromTime(delta));
		}
	}

	/**
	 * Delta is based on trueAnomaly rather than time.
	 */
	override calculatePoints(
		startTime: TemporalState | number,
		endTime: TemporalState | number,
		recursions: number
	): OrbitalState[] {
		const startTA: number = this.orbit.timeToTrue(this.asRelativeTime(startTime));
		const endTA: number = this.orbit.timeToTrue(this.asRelativeTime(endTime));

		return super.calculatePointsInternal(
			startTA, endTA, recursions,
			x => this.calculateStateFromTrueAnomaly(x)
		) as OrbitalState[];
	}

	/**
	 * Delta is based on trueAnomaly rather than time.
	 */
	override async calculatePointsAsync(
		startTime: TemporalState | number, endTime: TemporalState | number,
		recursions: number, batchSize: number = 100
	): Promise<OrbitalState[]> {
		const startBound: number = this.orbit.timeToTrue(this.asRelativeTime(startTime));
		const endBound: number = this.orbit.timeToTrue(this.asRelativeTime(endTime));

		return super.calculatePointsAsyncInternal(
			startBound, endBound, recursions, batchSize,
			x => this.calculateStateFromTrueAnomaly(x)
		) as Promise<OrbitalState[]>;
	}

	override deepClone(): OrbitalTrajectory {
		return new OrbitalTrajectory(this.start.deepClone());
	}
}

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
 * Utility function to convert a 2D polar coordinate in the X-Z plane.
 */
function polarToCartesian(magnitude: number, angle: number): Vector3D {
	return new Vector3D(
		magnitude * math.cos(angle),
		0,
		magnitude * math.sin(angle)
	);
}

/**
 * Utility function to convert a Vector3D in the X-Z plane
 * to a magnitude and angle.
 * @param toTransform toTransform.Y is assumed to be 0.
 * @returns An array containing a magnitude and angle, respectively.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cartesianToPolar(toTransform: Vector3D): [number, number] {
	return [
		math.sqrt(toTransform.X ** 2 + toTransform.Z ** 2),
		math.atan2(toTransform.Z, toTransform.X)
	];
}

/**
 * Given a vector in the standard basis, compute the vector in the basis {i,j,k}.
 * All vectors are assumed to be in math basis.
 * @returns A vector in math basis.
 */
function changeBasis(toTransform: Vector3D, i: Vector3D, j: Vector3D, k: Vector3D): Vector3D {
	// math change of basis formula via martix multiplication
	// https://stemandmusic.in/maths/mvt-algebra/vectorCB.php
	return new Vector3D(
		i.dot(toTransform),
		j.dot(toTransform),
		k.dot(toTransform)
	);
}

/**
 * Given a vector in the basis {i,j,k}, compute the vector in the standard basis.
 * i, j, and k must all be perpendicular unit vectors.
 * All vectors are assumed to be in math basis.
 * @returns A vector in math basis.
 */
function inverseChangeBasis(toTransform: Vector3D, i: Vector3D, j: Vector3D, k: Vector3D): Vector3D {
	// math change of basis formula via martix multiplication
	return new Vector3D(
		i.X * toTransform.X + j.X * toTransform.Y + k.X * toTransform.Z,
		i.Y * toTransform.X + j.Y * toTransform.Y + k.Y * toTransform.Z,
		i.Z * toTransform.X + j.Z * toTransform.Y + k.Z * toTransform.Z
	);
}

/**
 * Rotates a vector counterclockwise relative to axis.
 * All vectors are assumed to be in math basis.
 * https://stackoverflow.com/questions/6721544/circular-rotation-around-an-arbitrary-axis
 * @param vector The vector to be rotated.
 * @param axis The axis of rotation. Assumed to be a unit vector.
 * @param angle The angle of rotation.
 * @returns A vector in math basis.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function axisRotation(vector: Vector3D, axis: Vector3D, angle: number): Vector3D {
	// Quaternion method
	const q0 = math.cos(angle / 2);
	const q1 = math.sin(angle / 2) * axis.X;
	const q2 = math.sin(angle / 2) * axis.Y;
	const q3 = math.sin(angle / 2) * axis.Z;

	return new Vector3D(
		(q0*q0 + q1*q1 - q2*q2 - q3*q3) * vector.X + 2*(q1*q2 - q0*q3) * vector.Y + 2*(q1*q3 + q0*q2) * vector.Z,
		2*(q1*q2 + q0*q3) * vector.X + (q0*q0 - q1*q1 + q2*q2 - q3*q3) * vector.Y + 2*(q2*q3 - q0*q1) * vector.Z,
		2*(q1*q3 - q0*q2) * vector.X + 2*(q2*q3 + q0*q1) * vector.Y + (q0*q0 - q1*q1 - q2*q2 + q3*q3) * vector.Z
	);

	// // Rotation matrix method
	// const c = math.cos(angle);
	// const s = math.sin(angle);
	// const oneMinusC = 1 - c;
	// const matrix = [
	// 	[
	// 		axis.X * axis.X * oneMinusC + c,
	// 		axis.X * axis.Y * oneMinusC - axis.Z * s,
	// 		axis.X * axis.Z * oneMinusC + axis.Y * s
	// 	],
	// 	[
	// 		axis.Y * axis.X * oneMinusC + axis.Z * s,
	// 		axis.Y * axis.Y * oneMinusC + c,
	// 		axis.Y * axis.Z * oneMinusC - axis.X * s
	// 	],
	// 	[
	// 		axis.Z * axis.X * oneMinusC - axis.Y * s,
	// 		axis.Z * axis.Y * oneMinusC + axis.X * s,
	// 		axis.Z * axis.Z * oneMinusC + c
	// 	]
	// ];

	// return new Vector3D(
	// 	matrix[0][0] * vector.X + matrix[0][1] * vector.Y + matrix[0][2] * vector.Z,
	// 	matrix[1][0] * vector.X + matrix[1][1] * vector.Y + matrix[1][2] * vector.Z,
	// 	matrix[2][0] * vector.X + matrix[2][1] * vector.Y + matrix[2][2] * vector.Z
	// )
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
function newtonRaphson(
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

// Utility classes representing types of orbits.

/**
 * Basic type facilitating access of orbital parameters in utility classes
 */
type OuterClass = {
	angularMomentum: Vector3D
	timeSincePeriapsis: number
	eccentricityScalar: number
	period: number // set to -1 if orbit eccentricity >= 1
	mu: number
	rM: number
}

abstract class Orbit {
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
	public trueToKinematic(trueAnomaly: number): KinematicState {
		const e = this.outer.eccentricityScalar;
		const mu = this.outer.mu;
		const h = this.outer.angularMomentum.magnitude();

		// Orbit equation
		const altitude = this.trueToAltitude(trueAnomaly);
		let positionPerifocal: Vector3D = polarToCartesian(altitude, trueAnomaly);
		positionPerifocal = new Vector3D(-positionPerifocal.Z, positionPerifocal.Y, positionPerifocal.X);
		// From vis viva equation
		const velocityPerifocal: Vector3D = new Vector3D(
			-(e + math.cos(trueAnomaly)),
			0,
			-math.sin(trueAnomaly)
		).mul(mu / h);

		return new KinematicState(
			positionPerifocal,
			velocityPerifocal
		);
	}

}

// Inner classes representing different types of orbits

abstract class CircularElliptical extends Orbit {
	override trueAnomalyRange(): NumberRange {
		return new NumberRange(-math.pi, math.pi);
	}
}

class Circular extends CircularElliptical {
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

class Elliptical extends CircularElliptical {
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

abstract class ParabolicHyperbolic extends Orbit {
	override trueAnomalyRange(): NumberRange {
		const radius = math.acos(-1 / this.outer.eccentricityScalar);
		return new NumberRange(-radius, radius);
	}
}

class Parabolic extends ParabolicHyperbolic {
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

class Hyperbolic extends ParabolicHyperbolic {
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

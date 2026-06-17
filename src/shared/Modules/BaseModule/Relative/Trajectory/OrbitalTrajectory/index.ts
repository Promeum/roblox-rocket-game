import Vector3D from "../../../../Libraries/Vector3D";

import Orientation from "../../../Orientation";
import Kinematic from "../../Physics/Kinematic";
import Chrono from "shared/Modules/BaseModule/Chrono";
import Acceleration from "../../Physics/Acceleration";
import KinematicChrono from "../../Physics/KinematicChrono";
import TrajectoryState from "../../TrajectoryState";
import OrbitalState from "../../TrajectoryState/OrbitalState";
import Trajectory from "..";

import type GravityCelestial from "../../../Celestial/GravityCelestial";

import { // eslint-disable-next-line @typescript-eslint/no-unused-vars
	Orbit, CircularElliptical, Circular, Elliptical, ParabolicHyperbolic,
	Parabolic, Hyperbolic, newtonRaphson, OuterClass
} from "./Orbit";
import orbitalParameters from "./OrbitalParameters";

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
	public constructor(position: KinematicChrono, orbiting: GravityCelestial);

	/**
	 * Creates a new OrbitalTrajectory instance.
	 */
	public constructor(position: Vector3D, velocity: Vector3D, temporal: Chrono, orbiting: GravityCelestial);

	public constructor(
			arg1: OrbitalState | KinematicChrono | Vector3D,
			arg2?: GravityCelestial | Vector3D,
			arg3?: Chrono,
			arg4?: GravityCelestial
		) {
		let start: OrbitalState | undefined;
		let orbit: Orbit | undefined;
		let orbiting: GravityCelestial;
		let initial: KinematicChrono;

		// Constructor overloads
		if (arg1 instanceof OrbitalState) {
			start = arg1;
			orbit = arg1.trajectory.orbit;
			orbiting = arg1.trajectory.orbiting;
			initial = arg1.getKinematic();
		} else if (arg1 instanceof KinematicChrono) {
			assert(arg2 && !(arg2 instanceof Vector3D))
			orbiting = arg2;
			initial = arg1;
		} else {
			assert(arg2 instanceof Vector3D && arg3 && arg4)
			orbiting = arg4;
			initial = new KinematicChrono(
				new Kinematic(arg1, arg2, orbiting.trajectory.getKinematic(arg3).kinematic),
				arg3
			);
		}

		super(orbiting.trajectory);
		if (start) this.start = start;
		if (orbit) this.orbit = orbit;
		this.orbiting = orbiting;

		// patch for 0 position or velocity
		if (initial.velocity.magnitude() === 0 || initial.position.magnitude() === 0) {
			const newPos = initial.position.magnitude() === 0 ? new Vector3D(1e-10, 0, 0) : initial.position;
			const newVel = initial.velocity.magnitude() === 0 ? new Vector3D(0, 1e-10, 0) : initial.velocity;
			initial = new KinematicChrono(
				new Kinematic(
					newPos,
					newVel,
					initial.kinematic.queryRelative()
				),
				initial.chrono
			);
		}

		// Quick access kinematics
		this.mu = this.orbiting.mu;
		this.r = initial.position;
		this.rM = this.r.magnitude();
		this.v = initial.velocity;

		const parameters = orbitalParameters(this.mu, this.r, this.rM, this.v);
		// Key orbital parameters
		this.angularMomentum = parameters.angularMomentum;
		this.eccentricity = parameters.eccentricity;
		this.inclination = parameters.inclination;
		this.rightAscension = parameters.rightAscension;
		this.argumentOfPeriapsis = parameters.argumentOfPeriapsis;
		this.trueAnomaly = parameters.trueAnomaly;
		// More orbital parameters
		this.period = parameters.period;
		this.semiMajorAxis = parameters.semiMajorAxis;
		this.semiMinorAxis = parameters.semiMinorAxis;
		this.isBound = parameters.isBound;
		this.isClosed = parameters.isClosed;
		this.eccentricityScalar = parameters.eccentricityScalar;

		// Generate start position
		if (!this.start) {
			this.start = new OrbitalState(
				this,
				initial.chrono,
				this.trueAnomaly,
				initial.kinematic
			);
		}

		// Set orbit type
		const constructorObject: OuterClass = {
			angularMomentum: this.angularMomentum,
			timeSincePeriapsis: 0,
			eccentricityScalar: this.eccentricityScalar,
			period: this.period !== false ? this.period : -1,
			mu: this.mu,
			rM: this.rM
		};

		if (this.eccentricityScalar === 0)
			this.orbit = new Circular(constructorObject);
		else if (this.isClosed)
			this.orbit = new Elliptical(constructorObject);
		else if (this.isBound)
			this.orbit = new Parabolic(constructorObject);
		else
			this.orbit = new Hyperbolic(constructorObject);

		this.timeSincePeriapsis = constructorObject.timeSincePeriapsis = this.orbit.trueToTime(this.trueAnomaly);
		// Perifocal Frame
		// https://orbital-mechanics.space/classical-orbital-elements/perifocal-frame.html
		this.p = this.eccentricity.unit();
		this.q = this.angularMomentum.unit();
		this.w = this.p.cross(this.q);

		// Apoapsis and Periapsis
		this.periapsis = this.calculateStateFromTrueAnomaly(0);

		if (this.isClosed)
			this.apoapsis = this.calculateStateFromTrueAnomaly(math.pi);
		else
			this.apoapsis = false;

		// checking if input pos/vel match
		const realS = this.start
		const calcS = this.calculateStateFromTime(0)
		if (realS.position.sub(calcS.position).magnitude() > 0.1 || realS.velocity.sub(calcS.velocity).magnitude() > 0.1)
			warn(`start positions inconsistent by ${realS.position.sub(calcS.position).magnitude()}`)
		this.start = this.calculateStateFromTime(0);
	}

	// Utility Methods

	/**
	 * Transforms a Vector3D to global space.
	 * https://orbital-mechanics.space/classical-orbital-elements/perifocal-frame.html
	 * https://en.wikipedia.org/wiki/Change_of_basis#Change_of_basis_formula
	 * @param toTransform A vector in perifocal space.
	 */
	private perifocalToGlobal(toTransform: Vector3D): Vector3D {
		// change all vectors into math basis
		const p = new Vector3D(this.w.X, this.w.Z, this.w.Y);
		const q = new Vector3D(this.p.X, this.p.Z, this.p.Y);
		const w = new Vector3D(this.q.X, this.q.Z, this.q.Y);
		const v = new Vector3D(toTransform.X, toTransform.Z, toTransform.Y);

		const result = Orientation.inverseChangeBasis(v, p, q, w);
		// return in game space
		return new Vector3D(result.X, result.Z, result.Y);
	}

	/**
	 * Transforms a Vector3D to perifocal space.
	 * https://orbital-mechanics.space/classical-orbital-elements/perifocal-frame.html
	 * https://en.wikipedia.org/wiki/Change_of_basis#Change_of_basis_formula
	 * @param toTransform A vector in global space.
	 */
	private globalToPerifocal(toTransform: Vector3D): Vector3D {
		// change all vectors into math basis
		const p = new Vector3D(this.w.X, this.w.Z, this.w.Y);
		const q = new Vector3D(this.p.X, this.p.Z, this.p.Y);
		const w = new Vector3D(this.q.X, this.q.Z, this.q.Y);
		const v = new Vector3D(toTransform.X, toTransform.Z, toTransform.Y);

		const result = Orientation.changeBasis(v, p, q, w);
		// return in game space
		return new Vector3D(result.X, result.Z, result.Y);
	}

	/**
	 * Transsforms a KinematicState to global space.
	 */
	private perifocalKinematicToGlobal(toTransform: Kinematic): Kinematic {
		return new Kinematic(
			this.perifocalToGlobal(toTransform.position),
			this.perifocalToGlobal(toTransform.velocity),
			toTransform.queryRelative()
		)
	}

	// Position Calculations

	override getKinematic(time: Chrono | number): KinematicChrono {
		const relativeTime: number = this.asRelativeTime(time);
		const temporal: Chrono = this.start.time.add(relativeTime);
		const trueAnomaly: number = this.orbit.timeToTrue(relativeTime);
		const position: Kinematic = this.trueToKinematic(trueAnomaly, relativeTime);

		return new KinematicChrono(position, temporal);
	}

	/**
	 * Calculates the state of orbiting at a given time.
	 * @param time Numbers assumed to be relative to this.start.time.
	 */
	private calculateOrbitingStateFromTime(time: Chrono | number): TrajectoryState {
		return this.getRelative().calculateStateFromTime(
			this.start.time.add(this.asRelativeTime(time))
		); // Convert time to absolute Chrono
	} // TODO: Make it so Chrono = absolute time while number = relative time

	// For use in State from True Anomaly and State from Time
	private trueToKinematic(trueAnomaly: number, time: number): Kinematic {
		const perifocalKinematic: Kinematic = this.orbit.trueToKinematic(trueAnomaly);
		return new Kinematic(
			this.perifocalToGlobal(perifocalKinematic.position),
			this.perifocalToGlobal(perifocalKinematic.velocity),
			this.calculateOrbitingStateFromTime(time).kinematics
		);
	}

	// State Calculations

	public calculateStateFromTrueAnomaly(trueAnomaly: number): OrbitalState {
		const time: number = this.orbit.trueToTime(trueAnomaly);
		const temporal: Chrono = this.start.time.add(time);
		const position: Kinematic = this.trueToKinematic(trueAnomaly, time);

		return new OrbitalState(this, temporal, trueAnomaly, position);
	}

	override calculateStateFromTime(time: Chrono | number): OrbitalState {
		const relativeTime: number = this.asRelativeTime(time);
		const trueAnomaly: number = this.orbit.timeToTrue(relativeTime);
		const temporal: Chrono = this.start.time.add(relativeTime);
		const position: Kinematic = this.trueToKinematic(trueAnomaly, relativeTime);

		return new OrbitalState(this, temporal, trueAnomaly, position);
	}

	override calculateStateFromPoint(position: Vector3D): OrbitalState {
		// TODO: Make a more advanced calculation method instead of directly plugging in 3D positions
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
			// TODO: secant apporach... could there be a better way?
			tA => (distanceFromPoint(tA + 0.0001)
				- distanceFromPoint(tA - 0.0001)) / 0.0002,
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
		// Orbit equation solved for true anomaly
		const tA = math.acos(((h ** 2) / (mu * altitude) - 1) / e);

		if (this.isClosed) { // Select soonest time
			const anomaly1 = (tA - this.trueAnomaly) % (2 * math.pi) + this.trueAnomaly;
			const anomaly2 = (-tA - this.trueAnomaly) % (2 * math.pi) + this.trueAnomaly;
			const time1 = this.orbit.trueToTime(anomaly1);
			const time2 = this.orbit.trueToTime(anomaly2);
			let selectedTrueAnomaly: number;

			if (time1 < time2 && time1 > 1e-4)
				selectedTrueAnomaly = anomaly1;
			else
				selectedTrueAnomaly = anomaly2;

			return this.calculateStateFromTrueAnomaly(selectedTrueAnomaly);
		} else { // Select next or latest time
			return this.calculateStateFromTrueAnomaly(this.trueAnomaly <= -tA ? -tA : tA);
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
		const toOtherTA = (trueAnomaly: number): number => {
			return other.orbit.timeToTrue(
				other.asRelativeTime(
					this.start.time.add(this.orbit.trueToTime(trueAnomaly)) // Convert time to absolute Chrono
				) // ...then to other relativeTime
			);
		}
		const distanceAtTA = (trueAnomaly: number): number => {
			const thisPosition: Vector3D = this.perifocalToGlobal(
				this.orbit.trueToKinematic(trueAnomaly).position);
			const otherPosition: Vector3D = other.perifocalToGlobal(
				other.orbit.trueToKinematic(toOtherTA(trueAnomaly)).position);
			return otherPosition.sub(thisPosition).magnitude();
		}

// warn("orbitalIntersection() call")

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
				tA => distanceAtTA(tA) - distance,
				tA => (distanceAtTA(tA + 0.00001)
					- distanceAtTA(tA - 0.00001)) / 0.00002,
				// TODO: secant approach... could there be a better way?
				guess, 1e-4, undefined, 20
			);

			if (
				orbitalIntersection[1] // root must be close enough to 0
				&& orbitalIntersection[0] >= this.trueAnomaly // root must be in the future
				&& ( // 'derivative' (actually a secant) of distance must be negative (entering SOI)
					distanceAtTA(orbitalIntersection[0] + 0.0001)
					- distanceAtTA(orbitalIntersection[0] - 0.0001)) / 0.0002
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
	this.calculateStateFromTrueAnomaly(answer).position.mul(1/6371.01e3),
	game.Workspace
)
}
		if (answer !== false) {
			return [
				this.calculateStateFromTrueAnomaly(answer),
				other.calculateStateFromTrueAnomaly(toOtherTA(answer))
			];
		} else {
			return false;
		}
	}

	override atTime(delta: number, withAcceleration?: Acceleration): OrbitalTrajectory {
		if (withAcceleration) {
			// Calculate and add the acceleration as
			// a seperate velocity + position offset
			const velocityToAdd: Vector3D = withAcceleration.vector(delta);

			return new OrbitalTrajectory(
				new KinematicChrono(
					this.calculateStateFromTime(delta).kinematics.add(
						new Kinematic(velocityToAdd.mul(delta), velocityToAdd)
					),
					this.start.time.add(delta)
				),
				this.orbiting
			);
		} else {
			return new OrbitalTrajectory(this.calculateStateFromTime(delta));
		}
	}

	override changeVelocity(currentTime: Chrono, velocity: Vector3D): OrbitalTrajectory {
		const state = this.calculateStateFromTime(currentTime);
		return new OrbitalTrajectory(
			state.position,
			state.velocity.add(velocity),
			state.time,
			this.orbiting
		);
	}

	/**
	 * Delta is based on trueAnomaly rather than time.
	 */
	override calculatePoints(
		startTime: Chrono | number,
		endTime: Chrono | number,
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
		startTime: Chrono | number, endTime: Chrono | number,
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

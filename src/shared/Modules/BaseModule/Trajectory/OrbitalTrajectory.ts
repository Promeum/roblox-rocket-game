// import { $assert, $error, $warn } from "rbxts-transform-debug";
import Vector3D from "../../Libraries/Vector3D";
// import MOID from "../../Libraries/MOID";
import KinematicState from "../Relative/State/KinematicState";
import TemporalState from "../Relative/State/TemporalState";
import KinematicTemporalState from "../Relative/State/KinematicTemporalState";
import AccelerationState from "../Relative/State/AccelerationState";
import OrbitalState from "../CelestialState/OrbitalState";
import Trajectory from "../Trajectory";
import type GravityCelestial from "../Relative/Celestial/GravityCelestial";
import type Celestial from "../Relative/Celestial";
import * as Constants from "../../../Constants";

/*
	TODO:
	Consolidate orbital/kinematic parameters into the OrbitalState class!
	Move the complex math stuff into a library!
	Add a Bisection Search function!
*/

/**
 * OrbitalTrajectory represents an orbital trajectory with elliptical or hyperbolic motion.
 */
export default class OrbitalTrajectory extends Trajectory {
	declare initialPosition: OrbitalState;
	public readonly orbiting: GravityCelestial;

	// Misc. orbital parameters
	private apoapsis: KinematicState | false;
	private periapsis: KinematicState;
	private semiMajorAxis: number | false;
	private semiMinorAxis: number;
	public readonly isBound: boolean;
	public readonly isClosed: boolean;
	public readonly specificOrbitalEnergy: number;
	public readonly eccentricityScalar: number;
	public readonly period: number;
	private readonly timeSincePeriapsis: number;
	
	// Quick access kinematics
	protected readonly mu: number; // Standard gravitational parameter
	protected readonly r: Vector3D; // Position vector
	protected readonly rM: number; // Position magnitude
	protected readonly v: Vector3D; // Velocity vector
	protected readonly vM: number; // Velocity magnitude

	// Constructors

	/**
	 * Creates a new OrbitalTrajectory instance.
	 */
	public constructor(initialPosition: OrbitalState);

	/**
	 * Creates a new OrbitalTrajectory instance.
	 */
	public constructor(initialPosition: KinematicTemporalState, celestial: Celestial, orbiting: GravityCelestial);

	public constructor(arg1: KinematicTemporalState | OrbitalState, arg2?: Celestial, arg3?: GravityCelestial) {
		if (arg1 instanceof OrbitalState) {
			super(arg1);
			this.orbiting = arg1.orbiting;
		} else {
			assert(arg2 && arg3)
			super(arg1, arg2);
			this.orbiting = arg3;
		}

		this.initialPosition = new OrbitalState(this.initialPosition, this.orbiting);

		// Quick access kinematics

		this.mu = this.orbiting.mu; // Standard gravitational parameter
		this.r = this.initialPosition.kinematicPosition.getPosition(); // Position vector
		this.rM = this.r.magnitude(); // Position magnitude
		this.v = this.initialPosition.kinematicPosition.getVelocity(); // Velocity vector
		this.vM = this.v.magnitude(); // Velocity magnitude

		const mu: number = this.mu;
		const r: Vector3D = this.r;
		const rM: number = this.rM;
		const v: Vector3D = this.v;
		const vM: number = this.vM;

		// More orbital parameters
		const visVivaSubParameter: number = 2 * mu * (rM ** -1) - vM ** 2;

		this.eccentricityScalar = this.initialPosition.eccentricity.magnitude();
		this.period = 2 * math.pi * mu * (visVivaSubParameter ** -1.5);
		this.semiMajorAxis = mu / visVivaSubParameter;
		this.semiMinorAxis = r.cross(v).magnitude() / math.sqrt(math.abs(visVivaSubParameter));
		// assert(
		// 	this.eccentricityScalar === (r.mul(mu).add(r.cross(v).cross(v).mul(rM))).magnitude() / (mu * rM),
		// 	"Eccentricity: " + this.eccentricityScalar + " vs " + ((r.mul(mu).add(r.cross(v).cross(v).mul(rM))).magnitude() / (mu * rM))
		// ); // Eccentricities not exactly the same but close enough
		this.isBound = this.eccentricityScalar <= 1;
		this.isClosed = this.eccentricityScalar < 1;
		// let timeToPeriapsis = 0;
		this.periapsis = this.calculatePointFromTrueAnomaly(0);

		// assert(this.periapsis, `periapsis is nil ({this.periapsis})`)

		if (this.isBound) {
			this.apoapsis = this.calculatePointFromTrueAnomaly(math.pi);
		} else {
			this.apoapsis = false;
		}

		if (this.period === this.period) { // Check for NaN
			this.timeSincePeriapsis = this.calculateTimeFromPoint(this.periapsis.position);//r);
			this.timeSincePeriapsis = this.period - this.timeSincePeriapsis;
			// timeToPeriapsis = this.period - this.timeSincePeriapsis;
		} else {
			this.timeSincePeriapsis = this.calculateTimeFromPoint(this.periapsis.position);//r);
			this.timeSincePeriapsis = -this.timeSincePeriapsis;
			// timeToPeriapsis = -this.timeSincePeriapsis;
		}

		this.specificOrbitalEnergy = (vM ** 2 / 2) - (mu / rM);
warn("new orbital trajectory")
print("real start of this trajectory")
print(this.calculateAbsolutePositionFromTime(0))
let realS = this.initialPosition.kinematicPosition
let calcS = this.calculateAbsolutePositionFromTime(0).kinematicPosition
if (realS.getAbsolutePosition().sub(calcS.getAbsolutePosition()).magnitude() > 1) {
	warn("start positions inconsistent")
}
	}

	// Return type override methods

	override calculatePositionFromTime(relativeTime: number): OrbitalState {
		return new OrbitalState(
			new KinematicTemporalState(
				this.calculatePointFromTime(relativeTime),
				new TemporalState(relativeTime, this.initialPosition.kinematicPosition.temporalState)
			),
			this.orbiting,
			this.celestial
		);
	}

	override calculateAbsolutePositionFromTime(relativeTime: number): OrbitalState {
		const rawPosition: KinematicState = this.calculatePointFromTime(relativeTime);
		const relativePositionTree: KinematicState = this.orbiting.trajectory.calculateAbsolutePositionFromTime(
			this.orbiting.trajectory.initialPosition.kinematicPosition.temporalState.matchRelative(
				new TemporalState(relativeTime, this.initialPosition.kinematicPosition.temporalState)
			).relativeTime
		).kinematicPosition.kinematicState;

		return new OrbitalState(
			new KinematicTemporalState(
				new KinematicState(
					rawPosition.position,
					rawPosition.velocity,
					relativePositionTree
				),
				new TemporalState(relativeTime, this.initialPosition.kinematicPosition.temporalState)
			),
			this.orbiting,
			this.celestial
		);
	}

	override calculatePositionFromPoint(position: Vector3D): OrbitalState {
		const timeFromPoint: number = this.calculateTimeFromPoint(position);

		return new OrbitalState(
			new KinematicTemporalState(
				this.calculatePointFromTime(timeFromPoint),
				this.initialPosition.kinematicPosition.temporalState.withRelativeTime(timeFromPoint)
			),
			this.orbiting,
			this.celestial
		);
	}

	override calculatePositionFromMagnitude(magnitude: number): OrbitalState {
		let result = super.calculatePositionFromMagnitude(magnitude) as OrbitalState;
		if (result.kinematicPosition.getRelativeTime() < 0 && this.isClosed) { // patch for negative times in closed orbits
			result = new OrbitalState(
				new KinematicTemporalState(
					result.kinematicPosition.kinematicState,
					result.kinematicPosition.temporalState.withIncrementTime(this.period)
				),
				this.orbiting,
				this.celestial
			)
		}
		return result;
	}

	override calculatePoints(delta: number, recursions: number): OrbitalState[] {
		// return super.calculatePoints(delta, recursions) as OrbitalState[];

		// temp
		const points: OrbitalState[] = [];

		// const subParam1M: number = this.r.add(this.r.cross(this.v).cross(this.v).mul(this.rM)).mul(this.mu).magnitude();
		const lowerLimit = this.calculateTrueAnomalyFromTime(0)// math.clamp(this.calculateTrueAnomalyFromTime(0), 0, (2 * math.pi));
		// //0//this.isClosed ? 0 : -math.acos(-(this.mu * this.rM) / subParam1M) + 0.0000001;
		const upperLimit = this.calculateTrueAnomalyFromTime(delta * recursions)// math.clamp(this.calculateTrueAnomalyFromTime(delta * recursions), 0, (2 * math.pi));
		// //2*math.pi//this.isClosed ? 2 * math.pi : math.acos(-(this.mu * this.rM) / subParam1M) - 0.0000001;
		const increment = (upperLimit - lowerLimit) / recursions;
		// print("lower and upper limits")
		// print(this.calculateTrueAnomalyFromTime(0))
		// print(this.calculateTrueAnomalyFromTime(delta * recursions))
		// print("\t"+lowerLimit)
		// print("\t"+upperLimit)
		// print("time since Pe: ")
		// print(this.initialPosition.kinematicPosition.temporalState)

		if (increment <= 0) {
			print("lower and upper limits")
			print(this.calculateTrueAnomalyFromTime(0))
			print(this.calculateTrueAnomalyFromTime(delta * recursions))
			print("\t"+lowerLimit)
			print("\t"+upperLimit)
			print("time since Pe: ")
			print(this.initialPosition.kinematicPosition.temporalState)
			error("increment is 0")
		}

		for (let i = lowerLimit; i <= upperLimit; i += increment) {
			const arg: OrbitalState = new OrbitalState(
				new KinematicTemporalState(
					this.calculatePointFromTrueAnomaly(i),
					new TemporalState(
						this.calculateTimeFromTrueAnomaly(i),
						this.initialPosition.kinematicPosition.temporalState
					)
				),
				this.orbiting,
				this.celestial
			);
			points.push(arg);
		}

		return points;
	}
	
	override displayTrajectory(delta: number, recursions: number, width: number): Folder {
		const display: Folder = super.displayTrajectory(delta, recursions, width);

		// Constantly update position of displayed trajectory until destroyed
		const attachmentPart: Part = display.WaitForChild("Attachments") as Part;
		const connection: RBXScriptConnection = game.GetService("RunService").PreSimulation.Connect(() => {
			attachmentPart.Position = this.orbiting.state.kinematicPosition.getPosition().mul(Constants.SOLAR_SYSTEM_SCALE).toVector3();
		});
		display.Destroying.Once(() => connection.Disconnect());

		display.Parent = game.Workspace.WaitForChild("Orbits");
		return display;
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
	 * @returns The apoapsis kinematic state
	 */
	public getApoapsis(): KinematicState {
		assert(this.apoapsis !== false, "OrbitalState apoapsis() Cannot call apoapsis() on a non-elliptical OrbitalState");
		return this.apoapsis;
	}

	/**
	 * Returns the periapsis.
	 * @returns The periapsis kinematic state
	 */
	public getPeriapsis(): KinematicState {
		return this.periapsis;
	}

	/**
	 * Returns whether this trajectory has a semi major axis.
	 * @returns true if there is a semi major axis
	 */
	public hasSemiMajorAxis(): boolean {
		return this.isClosed;
	}

	/**
	 * Returns the semi major axis.
	 * @returns The semi major axis in meters
	 */
	public getSemiMajorAxis(): number {
		assert(this.semiMajorAxis !== false, "OrbitalState semiMajorAxis() Cannot call semiMajorAxis() on a non-elliptical OrbitalState");
		return this.semiMajorAxis;
	}

	/**
	 * Returns the semi minor axis.
	 * @returns The semi minor axis in meters
	 */
	public getSemiMinorAxis(): number {
		return this.semiMinorAxis;
	}

	// Methods

	/**
	 * Helper method for calculateTrueAnomalyFromTime().
	 * Apparently a calculation for eccentric anomaly using Kepler's Equation solved via the Newton-Raphson Method.
	 * @param recursions Number of recursions
	 * @param periapsisRelativeTime Time relative to periapsis
	 * @returns The true anomaly angle in radians
	 */
	private recursiveTrueAnomalyHelper(recursions: number, periapsisRelativeTime: number): number {
		const mu: number = this.mu;
		const r: Vector3D = this.r;
		const rM: number = this.rM;
		const v: Vector3D = this.v;
		const vM: number = this.vM;
		const t: number = periapsisRelativeTime;

		if (recursions === 0) { // base case
			if (2 * mu <= rM * vM * vM) {
				// print(1)
				return math.sign(t) * math.sqrt(
					(math.log(
						(
							(2 * rM * math.abs(2 * mu * (1 / rM) - vM * vM) ** 1.5 * math.abs(t))
							/ (r.cross(v).cross(v).mul(rM).add(mu * rM)).magnitude()
						) + 1
					) + 1) ** 2 - 1
				);
			} else if (
				(math.pi - 1 + (r.cross(v).cross(v).mul(rM).add(mu * rM)).magnitude() / (mu * rM))
				<= math.abs((((t / mu) * (2 * mu * (1 / rM) - vM * vM) ** 1.5) % (2 * math.pi)) - math.pi)
			) {
				// print(2)
				return math.pi * (2 * math.round((t / (2 * math.pi * mu)) * math.abs(2 * mu * (1 / rM) - vM * vM) ** 1.5));
			} else if (
				math.abs((((t / mu) * (2 * mu * (1 / rM) - vM * vM) ** 1.5) % (2 * math.pi)) - math.pi)
				<= (1 + (r.cross(v).cross(v).mul(rM).add(mu * rM)).magnitude() / (mu * rM))
			) {
				// print(3)
				return math.pi * (2 * math.floor((t / (2 * math.pi * mu)) * math.abs(2 * mu * (1 / rM) - vM * vM) ** 1.5) + 1);
			} else {
				// print(4)
				return math.pi * (math.floor((t / (math.pi * mu)) * math.abs(2 * mu * (1 / rM) - vM * vM) ** 1.5) + 0.5);
			}
		} else { // non-base case
			const prevRecursion: number = this.recursiveTrueAnomalyHelper(recursions - 1, periapsisRelativeTime);
			// assert(prevRecursion == prevRecursion, `prevRecursion is nan ({prevRecursion})`)

			// print(`recursion {recursions - 1}`)
			// print(prevRecursion)

			if (2 * mu <= rM * vM * vM) {
				return prevRecursion
					+ (
						rM * (math.abs(2 * mu * (1 / rM) - vM * vM) ** 1.5) * t
						+ mu * rM * prevRecursion
						- math.sinh(prevRecursion) * (r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude()
					)
					/ (math.cosh(prevRecursion) * (r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude() - mu * rM);
			} else {
				return prevRecursion
					+ (
						rM * ((2 * mu * (1 / rM) - vM * vM) ** 1.5) * t
						- mu * rM * prevRecursion
						+ math.sin(prevRecursion) * (r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude()
					)
					/ (-math.cos(prevRecursion) * (r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude() + mu * rM);
			}
		}
	}

	/**
	 * Calculates the angle of true anomaly at a given point in time on this OrbitalTrajectory.
	 * @param relativeTime The time relative to this trajectory
	 * @returns The true anomaly angle in radians
	 */
	public calculateTrueAnomalyFromTime(relativeTime: number): number {
		/*

		TODO: TEST THIS IF ITS CORRECT AND ACTUALLY FUNCTIONS

		*/
		const mu: number = this.mu;
		const r: Vector3D = this.r;
		const rM: number = this.rM;
		const v: Vector3D = this.v;
		const vM: number = this.vM;

		const timeSincePeriapsis: number = this.timeSincePeriapsis;
		const periapsisRelativeTime: number = timeSincePeriapsis + relativeTime;
		const TrueAnomalyHelperResult: number = this.recursiveTrueAnomalyHelper(8, periapsisRelativeTime);

		if ((rM * vM * vM) < (2 * mu)) { // self:IsClosed() then -- orbit is not hyperbolic, eccentricity < 1
			return (
				2
				* math.pi
				* math.ceil(
					(math.abs(2 * mu * (1 / rM) - vM * vM) ** 1.5) * (periapsisRelativeTime / (2 * mu * math.pi)) - 0.5
				)
				+ 2
				* math.atan(
					(mu * rM + (r.cross(v).cross(v).mul(rM).add(mu * rM)).magnitude())
						/ (rM * math.sqrt(math.abs(2 * mu * (1 / rM) - vM * vM)) * r.cross(v).magnitude())
						* math.tan(0.5 * TrueAnomalyHelperResult)
				)
			);// % (2 * math.pi); // no % by 2pi!
		} else { // orbit is hyperbolic, eccentricity >= 1
			return 2
				* math.atan(
					(mu * rM + (r.cross(v).cross(v).mul(rM).add(mu * rM)).magnitude())
						/ (rM * math.sqrt(math.abs(2 * mu * (1 / rM) - vM * vM)) * r.cross(v).magnitude())
						* math.tanh(0.5 * TrueAnomalyHelperResult)
				);
		}
	}

	/**
	 * Calculates a new KinematicState at a given point on this OrbitalTrajectory, using the angle of true anomaly.
	 * @param trueAnomaly The true anomaly angle in radians
	 * @returns The kinematic state at that true anomaly
	 */
	public calculatePointFromTrueAnomaly(trueAnomaly: number): KinematicState {
		const mu: number = this.mu;
		const r: Vector3D = this.r;
		const rM: number = this.rM;
		const v: Vector3D = this.v;
		const vM: number = this.vM;

		const subParam2: number = r.cross(v).magnitude();
		const subParam3: Vector3D = r.cross(v).cross(r);

		if (this.eccentricityScalar === 0) { // orbit is a circle
			// position
			// the part with the sin
			const term1P = subParam3.mul(math.sin(trueAnomaly));
			// the part with the cos
			const term2P = r.mul(subParam2).mul(math.cos(trueAnomaly));
			// the fraction
			const numeratorP = term1P.add(term2P);
			const denominatorP = r.cross(v).magnitude();

			// velocity
			// the part with the sin
			const term1V = subParam3.mul(math.cos(trueAnomaly));
			// the part with the cos
			const term2V = r.mul(subParam2).mul(math.sin(trueAnomaly));
			// the fraction
			const numeratorV = term1V.sub(term2V);
			const denominatorV = rM * r.cross(v).magnitude();

			return new KinematicState(
				numeratorP.div(denominatorP),
				numeratorV.div(denominatorV).mul(vM),
				this.initialPosition.kinematicPosition.kinematicState.getRelativeOrUndefined()
			);
		}

		const subParam1: Vector3D = r.add(r.cross(v).cross(v).mul(rM)).mul(mu);
		const subParam1M: number = subParam1.magnitude();
		
		if (
			this.isClosed ||
			( // check range of true anomaly of hyperbolic orbit
				!this.isClosed
				// && -math.acos(-(mu * rM) / subParam1M)
				// < math.abs(trueAnomaly) % (2 * math.pi) * math.sign(trueAnomaly)
				// && math.abs(trueAnomaly) % (2 * math.pi) * math.sign(trueAnomaly)
				// < math.acos(-(mu * rM) / subParam1M)

				&& trueAnomaly % (2 * math.pi)
				< math.acos(-(mu * rM) / subParam1M)
			)
		) { // orbit is any other conic section
			// note: for velocity, the mu that multiplies with the entire fraction was moved to denominator to counter floating point errors (the big fraction should not end up as (0,0,0))
			// another note: really think about implementing arbitrary-precision arithmetic
			if (!this.isClosed && trueAnomaly % (2 * math.pi) < math.acos(-(mu * rM) / subParam1M)) warn("would otherwise be blocked");
			const subParam2Squared: number = subParam2 ** 2;
			// position
			// the part with the sin
			const term1P = ((r.cross(v).cross(r).mul(mu)).sub(v.mul(r.cross(v).magnitude() ** 2).mul(rM))).mul(math.sin(trueAnomaly));
			// the part with the cos
			const term2P = ((r.mul(mu)).add(r.cross(v).cross(v).mul(rM))).mul(r.cross(v).magnitude()).mul(math.cos(trueAnomaly));
			// the fraction
			const numeratorP = term1P.add(term2P);
			const denominatorP = -((r.mul(mu)).add(r.cross(v).cross(v).mul(rM))).magnitude() * (math.cos(trueAnomaly) * ((r.mul(mu)).add(r.cross(v).cross(v).mul(rM))).magnitude() + mu * rM);

			// velocity
			// the part with the sin
			const term1V = subParam1.mul(subParam2).mul(math.sin(trueAnomaly));
			// the part with the cos
			const term2V = (subParam3.mul(mu).sub(v.mul(subParam2Squared * rM))).mul(math.cos(trueAnomaly));
			// the fraction
			const numeratorV = term1V.sub(term2V);
			const denominatorV = subParam2Squared * subParam1M;
			const frac1V = numeratorV.div(denominatorV).mul(mu);
			// fraction 2
			const frac2V = (subParam3.mul(mu)).div(subParam2Squared * rM);

			return new KinematicState(
				numeratorP.div(denominatorP).mul(r.cross(v).magnitude()).mul(rM),
				frac1V.sub(frac2V).add(v),
				this.initialPosition.kinematicPosition.kinematicState.getRelativeOrUndefined()
			); // ...should i be concerned about performance issues
		} else { // true anomaly is out of range of hyperbolic orbit
			error( // (real) based on turn angle, https://orbital-mechanics.space/the-orbit-equation/hyperbolic-trajectories.html
				`CalculatePointFromTrueAnomaly Invalid angle
				Min: ${-math.acos(-(mu * rM) / subParam1M)}
				Max: ${math.acos(-(mu * rM) / subParam1M)}
				(real?): ${math.pi / 2 - math.asin(1 / this.eccentricityScalar)}
				Angle: ${math.abs(trueAnomaly) % (2 * math.pi) * math.sign(trueAnomaly)}`
			);
			assert(math.abs(trueAnomaly) % (2 * math.pi) * math.sign(trueAnomaly) === math.abs(trueAnomaly) % (2 * math.pi) * math.sign(trueAnomaly),
		"angle is nan")
			return new KinematicState(Vector3D.zero, Vector3D.zero);
		}
	}


	/**
	 * Calculates a new KinematicState at a given point in time on this OrbitalTrajectory.
	 * @param relativeTime The time relative to this trajectory
	 * @returns The kinematic state at that time
	 */
	override calculatePointFromTime(relativeTime: number): KinematicState {
		const trueAnomalyAngle: number = this.calculateTrueAnomalyFromTime(relativeTime);
		// assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan ({trueAnomalyAngle})`)
		// return new KinematicState(
		// 	this.calculatePointFromTrueAnomaly(trueAnomalyAngle),
		// 	this.orbiting.trajectory.calculatePointFromTime(
		// 		this.orbiting.trajectory.initialPosition.kinematicPosition.temporalState.matchRelative(
		// 			new TemporalState(relativeTime, this.initialPosition.kinematicPosition.temporalState)
		// 		).relativeTime
		// 	)
		// );
		return this.calculatePointFromTrueAnomaly(trueAnomalyAngle);
	}

	/**
	 * Calculates the true anomaly at the point on this OrbitalTrajectory closest to a given point.
	 * @param position The given point
	 * @returns The true anomaly angle in radians
	 */
	public calculateTrueAnomalyFromPoint(position: Vector3D): number {
		const mu: number = this.mu;
		const r: Vector3D = this.r;
		const rM: number = this.rM;
		const v: Vector3D = this.v;

		let greaterAnomaly: number;
		let lesserAnomaly: number;
		let greaterPoint: Vector3D;
		let lesserPoint: Vector3D;

		if (this.isClosed) { // find the quadrant of the point and get the two points at the axes lines bordering that quadrant (search range: 0 -> 2 * math.pi)
			const up: Vector3D = this.calculatePointFromTrueAnomaly(math.pi).position;
			const down: Vector3D = this.calculatePointFromTrueAnomaly(0).position;
			const left: Vector3D = this.calculatePointFromTrueAnomaly(3 * math.pi / 2).position;
			const right: Vector3D = this.calculatePointFromTrueAnomaly(math.pi / 2).position;

			if ((up.sub(position)).magnitude() < (down.sub(position)).magnitude()) {
				if ((left.sub(position)).magnitude() < (right.sub(position)).magnitude()) {
					greaterAnomaly = 3 * math.pi / 2;
					lesserAnomaly = math.pi;
					greaterPoint = left;
					lesserPoint = up;
				} else {
					greaterAnomaly = math.pi;
					lesserAnomaly = math.pi / 2;
					greaterPoint = up;
					lesserPoint = right;
				}
			} else {
				lesserAnomaly = 0;
				lesserPoint = down;
				if ((left.sub(position)).magnitude() < (right.sub(position)).magnitude()) {
					greaterAnomaly = 3 * math.pi / 2;
					greaterPoint = left;
				} else {
					greaterAnomaly = math.pi / 2;
					greaterPoint = right;
				}
			}
		} else { // get the two points defining the range of true anomaly of hyperbolic orbit (search range: -(x < math.pi) -> (x < math.pi))
			greaterAnomaly = math.acos(-(mu * rM) / (r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude()) - 2.24e-16;
			greaterPoint = this.calculatePointFromTrueAnomaly(greaterAnomaly).position;
			lesserAnomaly = -math.acos(-(mu * rM) / (r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude()) + 2.24e-16;
			lesserPoint = this.calculatePointFromTrueAnomaly(lesserAnomaly).position;
		}

		// Bisection search for true anomaly, check distance by converting anomaly to point and compare with position
		let lastMiddleAnomaly: number = 0 / 0;
		let middleAnomaly: number = (greaterAnomaly + lesserAnomaly) / 2;
		let middlePoint: Vector3D = this.calculatePointFromTrueAnomaly(middleAnomaly).position;
		let anomalySearchIteration: number = 1;

		do {
			// account for floating point error in trueAnomaly calculations
			const floatingPointError: boolean = (lastMiddleAnomaly === middleAnomaly) && (greaterAnomaly - lesserAnomaly !== 0);

			// Vector math for comparing the target point and middlePoint
			const transformedGreaterPoint: Vector3D = greaterPoint.sub(lesserPoint); // transformedLesserPoint is (0, 0, 0)
			const transformedTargetPoint: Vector3D = position.sub(lesserPoint);
			const transformedMiddlePoint: Vector3D = middlePoint.sub(lesserPoint);
			const referenceAxis: Vector3D = transformedGreaterPoint.div(transformedGreaterPoint.magnitude()); // get the unit axis vector

			// Project the two points onto the reference axis with dot product
			const projectedTargetPoint: Vector3D = referenceAxis.mul(transformedTargetPoint.dot(referenceAxis));
			const projectedMiddlePoint: Vector3D = referenceAxis.mul(transformedMiddlePoint.dot(referenceAxis));

			// Generate a 'number line' position along the reference axis for the two points
			const targetPointPosition: number = projectedTargetPoint.dot(referenceAxis);
			const middleAnomalyPosition: number = projectedMiddlePoint.dot(referenceAxis);

			if (targetPointPosition > middleAnomalyPosition) { // move lesser angle up
				lesserAnomaly = floatingPointError ? greaterAnomaly : middleAnomaly;
				lesserPoint = this.calculatePointFromTrueAnomaly(lesserAnomaly).position;
			} else { // elseif targetPointPosition < middleAnomalyPosition then -- move greater angle down
				greaterAnomaly = floatingPointError ? lesserAnomaly : middleAnomaly;
				greaterPoint = this.calculatePointFromTrueAnomaly(greaterAnomaly).position;
			}
			// else { -- shortcut in case angle of target point is directly in the middle of lesser and greater angles -- doesnt work due to inaccurate floating point
			// 	return middleAnomaly
			// }

			lastMiddleAnomaly = middleAnomaly;
			middleAnomaly = (greaterAnomaly + lesserAnomaly) / 2;
			middlePoint = this.calculatePointFromTrueAnomaly(middleAnomaly).position;

			// print(`iteration {anomalySearchIteration}, log10 ≈ {tostring(math.log10(math.abs(greaterAnomaly - lesserAnomaly))):sub(1, 4)}`)
			// print(greaterAnomaly)
			// print(middleAnomaly)
			// print(lesserAnomaly)
			// assert(middleAnomaly == middleAnomaly, `middleAnomaly has errored ({middleAnomaly})`)
			// ...should i be concerned about performance issues

			anomalySearchIteration += 1;
		} while (greaterAnomaly - lesserAnomaly !== 0 && (middlePoint.sub(position)).magnitude() < 1e-9 && anomalySearchIteration <= 70);

		// print(`trueAnomaly calc finished at {anomalySearchIteration} iterations`)

		// if (greaterAnomaly - lesserAnomaly === 0) {
		// 	print(`...because anomalies are close enough (difference ≈ 0)`)
		// 	print(`position error: {(middlePoint - position):Magnitude()}`)
		// } else if ((middlePoint.sub(position)).magnitude() < 1e-9) {
		// 	print(`...because position is close enough (difference: {(middlePoint - position):Magnitude()})`)
		// 	print(`anomaly discrepancy: {greaterAnomaly - lesserAnomaly}`)
		// } else {
		// 	print(`...because iterative search taking too long (iteration > 70)`)
		// 	print(`position error: {(middlePoint - position):Magnitude()}`)
		// 	print(`anomaly discrepancy: {greaterAnomaly - lesserAnomaly}`)
		// }

		return middleAnomaly;
	}

	/**
	 * Calculates the length of time from the periapsis to the given true anomaly.
	 * @param trueAnomaly The true anomaly angle in radians
	 * @returns The time in seconds
	 */
	public calculateTimeFromPeriapsis(trueAnomaly: number): number {
		const mu: number = this.mu;
		const r: Vector3D = this.r;
		const rM: number = this.rM;
		const v: Vector3D = this.v;
		const vM: number = this.vM;

		if (this.isClosed) { // Orbit is circular / elliptic
			return (-r.cross(v).magnitude() * (r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude() * math.sin(trueAnomaly))
					/ ((2 * mu * (rM ** -1) - vM ** 2) * ((r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude() * math.cos(trueAnomaly) + mu * rM))
				+ (mu * math.sqrt(math.abs(2 * mu * (rM ** -1) - vM ** 2)) ** -3)
					* (2 * math.pi * math.ceil(trueAnomaly / (2 * math.pi) - 0.5) - 2 * math.atan(
						((r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude() - mu * rM)
							/ (r.cross(v).magnitude() * rM * math.sqrt(math.abs(2 * mu * (rM ** -1) - vM ** 2)))
							* math.tan(trueAnomaly / 2)
					));
		} else { // Orbit is parabolic / hyperbolic
			return (-r.cross(v).magnitude() * (r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude() * math.sin(trueAnomaly))
					/ ((2 * mu * (rM ** -1) - vM ** 2) * ((r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude() * math.cos(trueAnomaly) + mu * rM))
				+ (mu * math.sqrt(math.abs(2 * mu * (rM ** -1) - vM ** 2)) ** -3)
					* (-math.log(
						((r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude() * math.cos(trueAnomaly) + mu * rM)
							/ (
								(r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude()
								+ mu * rM * math.cos(trueAnomaly)
								- math.sin(trueAnomaly)
									* rM
									* r.cross(v).magnitude()
									* math.sqrt(math.abs(2 * mu * (rM ** -1) - vM ** 2))
							)
					));
		}
	}

	/**
	 * Calculates the length of time separating two given true anomalies on this OrbitalTrajectory.
	 * @param trueAnomaly The end angle of true anomaly
	 * @param referenceTrueAnomaly The start angle of true anomaly (defaults to initial position)
	 * @returns The time in seconds
	 */
	public calculateTimeFromTrueAnomaly(trueAnomaly: number, referenceTrueAnomaly?: number): number {
		const adjustedReferenceTrueAnomaly: number = referenceTrueAnomaly ?? this.calculateTrueAnomalyFromPoint(this.initialPosition.kinematicPosition.getPosition());

		return this.calculateTimeFromPeriapsis(trueAnomaly) - this.calculateTimeFromPeriapsis(adjustedReferenceTrueAnomaly);
	}

	/**
	 * Calculates the time until the craft reaches a specific point on this OrbitalTrajectory.
	 * @param position The position to be reached
	 * @param referencePosition The reference position (defaults to initial position)
	 * @returns The time in seconds
	 */
	override calculateTimeFromPoint(position: Vector3D, referencePosition?: Vector3D): number {
		const trueAnomalyAngle: number = this.calculateTrueAnomalyFromPoint(position);

		if (referencePosition !== undefined) {
			return this.calculateTimeFromTrueAnomaly(trueAnomalyAngle, this.calculateTrueAnomalyFromPoint(referencePosition));
		} else {
			return this.calculateTimeFromTrueAnomaly(trueAnomalyAngle);
		}
	}

	/**
	 * Calculates the true anomaly at a given point closest to a given altitude on this OrbitalTrajectory.
	 * @param magnitude The target altitude
	 * @returns The true anomaly angle in radians
	 */
	public calculateTrueAnomalyFromMagnitude(magnitude: number): number {
		const mu: number = this.mu;
		const r: Vector3D = this.r;
		const rM: number = this.rM;
		const v: Vector3D = this.v;

		let greaterAnomaly: number;
		let lesserAnomaly: number = 0;

		if (this.isClosed) { // search range: 0 -> math.pi
			greaterAnomaly = math.pi;
		} else { // search range: 0 -> (k < math.pi) (the range of true anomaly of hyperbolic orbit)
			// subtract small number so greaterPoint will work, hopefully
			greaterAnomaly = math.acos(-(mu * rM) / (r.cross(v).cross(v).mul(rM).add(r.mul(mu))).magnitude()) - 2.24e-16;
		}

		// Bisection search for true anomaly, check distance by converting anomaly to point and compare with magnitude
		let lastMiddleAnomaly: number = 0 / 0;
		let middleAnomaly: number = (greaterAnomaly + lesserAnomaly) / 2;
		let middleAnomalyMagnitude: number = this.calculatePointFromTrueAnomaly(middleAnomaly).position.magnitude();
		let anomalySearchIteration: number = 0;
		// assert(middleAnomalyMagnitude ~= math.huge, `infinite value detected`)
		do {
			// account for floating point error in trueAnomaly calculations
			const floatingPointError: boolean = (lastMiddleAnomaly === middleAnomaly) && (greaterAnomaly - lesserAnomaly !== 0);

			if (middleAnomalyMagnitude < magnitude) {
				lesserAnomaly = floatingPointError ? greaterAnomaly : middleAnomaly;
			} else {
				greaterAnomaly = floatingPointError ? lesserAnomaly : middleAnomaly;
			}

			lastMiddleAnomaly = middleAnomaly;
			middleAnomaly = (greaterAnomaly + lesserAnomaly) / 2;
			middleAnomalyMagnitude = this.calculatePointFromTrueAnomaly(middleAnomaly).position.magnitude();
			// ...should i be concerned about performance issues
			
			// print(`iteration {anomalySearchIteration}, log10 ≈ {tostring(math.log10(math.abs(greaterAnomaly - lesserAnomaly))):sub(1, 4)}`);

			anomalySearchIteration += 1;
		} while (greaterAnomaly - lesserAnomaly !== 0 && middleAnomalyMagnitude - magnitude !== 0 && anomalySearchIteration <= 70);

		// print(`trueAnomaly calc finished at {anomalySearchIteration} iterations`);

		// if (greaterAnomaly - lesserAnomaly == 0) {
		// 	print(`...because anomalies are close enough (difference ≈ 0)`);
		// 	print(`magnitude error: {math.abs(middleAnomalyMagnitude - magnitude)}`);
		// } else if (middleAnomalyMagnitude - magnitude == 0) {
		// 	print(`...because magnitude is close enough (difference ≈ 0)`);
		// 	print(`anomaly discrepancy: {greaterAnomaly - lesserAnomaly}`);
		// } else {
		// 	print(`...because iterative search taking too long (iteration > 100)`);
		// 	print(`position error: {math.abs(middleAnomalyMagnitude - magnitude)}`);
		// 	print(`anomaly discrepancy: {greaterAnomaly - lesserAnomaly}`);
		// }

		return middleAnomaly;
	}

	/**
	 * Calculates the time the craft reaches a specific altitude on this OrbitalTrajectory.
	 * @param magnitude The target altitude
	 * @returns The time in seconds
	 */
	override calculateTimeFromMagnitude(magnitude: number): number {
		const trueAnomalyAngle: number = this.calculateTrueAnomalyFromMagnitude(magnitude);
		// assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan`)

		const resultTime: number = this.calculateTimeFromTrueAnomaly(trueAnomalyAngle);
		// assert(resultTime == resultTime, `resultTime is nan`)

		return resultTime;
	}

	/**
	 * Calculates a new KinematicState at a given altitude on this OrbitalTrajectory.
	 * @param magnitude The target altitude
	 * @returns The kinematic state at that altitude
	 */
	override calculatePointFromMagnitude(magnitude: number): KinematicState {
		const trueAnomalyAngle: number = this.calculateTrueAnomalyFromMagnitude(magnitude);
		// assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan`)

		const resultPoint: KinematicState = this.calculatePointFromTrueAnomaly(trueAnomalyAngle);

		return resultPoint;
	}

	// Superclass method implementations

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override MOID(other: OrbitalTrajectory): OrbitalState {
		error("Not implemented");
		// if (this.isBound) {
		// 	const thisParameters = this.getOrbitalParameters();
		// 	const otherParameters = other.getOrbitalParameters();
		// 	const MOIDDistance = MOID(
		// 		this.semiMajorAxis,
		// 		this.eccentricity,
		// 		thisParameters.argumentOfPeriapsis,
		// 		thisParameters.ascendingNode,
		// 		thisParameters.inclination,
		// 		other.semiMajorAxis,
		// 		other.eccentricity,
		// 		otherParameters.argumentOfPeriapsis,
		// 		otherParameters.ascendingNode,
		// 		otherParameters.inclination
		// 	);
		// // Find the KinematicTemporalState at which this and other
		// // are MOIDDistance away from each other
		// 	const
		// }
	}

	override atTime(delta: number, withAcceleration?: AccelerationState): OrbitalTrajectory {
		if (withAcceleration) {
			// Calculate and add the acceleration as a seperate velocity + position offset
			const velocityToAdd: Vector3D = withAcceleration.getAccelerationVector(delta);

			return new OrbitalTrajectory(
				new KinematicTemporalState(
					this.calculatePointFromTime(delta).add(
						new KinematicState(velocityToAdd.mul(delta), velocityToAdd)
					),
					this.initialPosition.kinematicPosition.temporalState.withIncrementTime(delta)
				),
				this.celestial,
				this.orbiting
			);
		} else {
			return new OrbitalTrajectory(this.calculatePositionFromTime(delta));
		}
	}

}

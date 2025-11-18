// import { $assert, $error } from "rbxts-transform-debug";
import BaseModule from "../BaseModule";
import KinematicState from "../BaseModule/Relative/State/KinematicState";
import TemporalState from "../BaseModule/Relative/State/TemporalState";
import KinematicTemporalState from "./KinematicTemporalState";
import GravityCelestial from "./Relative/Celestial/GravityCelestial";
import Vector3D from "shared/Modules/Libraries/Vector3D";

/*
Useful links
https://www.bogan.ca/orbits/kepler/orbteqtn.html
https://orbital-mechanics.space/classical-orbital-elements/classical-orbital-elements.html
https://orbital-mechanics.space/classical-orbital-elements/orbital-elements-and-the-state-vector.html
https://en.wikipedia.org/wiki/Orbital_elements
*/

/**
 * OrbitalState represents an orbital state, handling orbital and kinematic parameters.
 * Does magic math for the parameter conversions.
 */
export default class OrbitalState extends BaseModule {
    public readonly kinematicTemporalState: KinematicTemporalState;
    public readonly orbiting: GravityCelestial;

    // Key orbital parameters (main parameters used by the program)
    public readonly angularMomentum: Vector3D;
    public readonly eccentricity: Vector3D;
    public readonly inclination: number;
    public readonly rightAscension: number;
    public readonly argumentOfPeriapsis: number;
    public readonly trueAnomaly: number;

    // More orbital parameters
    public readonly eccentricityScalar: number;
    public readonly period: number;
    public readonly timeToPeriapsis: number;
    public readonly timeSincePeriapsis: number;
    private apoapsis: KinematicState | false;
    private periapsis: KinematicState;
    private semiMajorAxis: number | false;
    private semiMinorAxis: number;
    public readonly isBound: boolean;
    public readonly isClosed: boolean;
    public readonly specificOrbitalEnergy: number;

    // Quick access kinematics
    protected readonly mu: number; // Standard gravitational parameter
    protected readonly r: Vector3D; // Position vector
    protected readonly rM: number; // Position magnitude
    protected readonly v: Vector3D; // Velocity vector
    protected readonly vM: number; // Velocity magnitude

    // Constructors

    /**
     * Creates a new OrbitalState instance.
     */
    public constructor(kinematicState: KinematicState, temporalState: TemporalState, orbiting: GravityCelestial);

    /**
     * Creates a new OrbitalState instance from a KinematicTemporalState.
     */
    public constructor(position: KinematicTemporalState, orbiting: GravityCelestial);

    public constructor(arg1: KinematicTemporalState | KinematicState, arg2: GravityCelestial | TemporalState, arg3?: GravityCelestial) {
        super();

        // Constructor parameters

        let kinematicTemporalState: KinematicTemporalState;
        let orbiting: GravityCelestial;

        if (arg1 instanceof KinematicState) { // Constructor 1
            assert(arg2 instanceof TemporalState && arg3 instanceof GravityCelestial);
            kinematicTemporalState = new KinematicTemporalState(arg1, arg2);
            orbiting = arg3;
        } else { // Constructor 2
            assert(arg1 instanceof KinematicTemporalState && arg2 === undefined);
            kinematicTemporalState = arg1;
            orbiting = arg2;
        }

        this.kinematicTemporalState = kinematicTemporalState;
        this.orbiting = orbiting;

        // Quick access kinematics

        this.mu = orbiting.mu; // Standard gravitational parameter
        this.r = kinematicTemporalState.getPosition(); // Position vector
        this.rM = this.r.magnitude(); // Position magnitude
        this.v = kinematicTemporalState.getVelocity(); // Velocity vector
        this.vM = this.v.magnitude(); // Velocity magnitude

        const mu: number = this.mu;
        const r: Vector3D = this.r;
        const rM: number = this.rM;
        const v: Vector3D = this.v;
        const vM: number = this.vM;

        // Key orbital parameters

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

        // More orbital parameters
        const visVivaSubParameter: number = 2 * mu * (rM ** -1) - vM ** 2;

        this.eccentricityScalar = e.magnitude();
        this.period = 2 * math.pi * mu * (visVivaSubParameter ** -1.5);
        this.semiMajorAxis = mu / visVivaSubParameter;
        this.semiMinorAxis = r.cross(v).magnitude() / math.sqrt(math.abs(visVivaSubParameter));
        assert( this.eccentricityScalar === (r.mul(mu).add(r.cross(v).cross(v).mul(rM))).magnitude() / (mu * rM) );
        this.isBound = this.eccentricityScalar <= 1;
        this.isClosed = this.eccentricityScalar < 1;
        this.timeToPeriapsis = 0;
        this.periapsis = this.calculatePointFromTrueAnomaly(0);

        // assert(this.periapsis, `periapsis is nil ({this.periapsis})`)

        if (this.isBound) {
            this.apoapsis = this.calculatePointFromTrueAnomaly(math.pi);
        } else {
            this.apoapsis = false;
        }

        if (this.period === this.period) { // Check for NaN
            this.timeSincePeriapsis = this.calculateTimeFromPoint(r);
            this.timeToPeriapsis = this.period - this.timeSincePeriapsis;
        } else {
            this.timeSincePeriapsis = this.calculateTimeFromPoint(r);
            this.timeToPeriapsis = -this.timeSincePeriapsis;
        }

        this.specificOrbitalEnergy = (vM ** 2 / 2) - (mu / rM);
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
                        - math.sinh(prevRecursion) * (r.cross(v).cross(v).mul(rM).add(mu * rM)).magnitude()
                    )
                    / (math.cosh(prevRecursion) * (r.cross(v).cross(v).mul(rM).add(mu * rM)).magnitude() - mu * rM);
            } else {
                return prevRecursion
                    + (
                        rM * ((2 * mu * (1 / rM) - vM * vM) ** 1.5) * t
                        - mu * rM * prevRecursion
                        + math.sin(prevRecursion) * (r.cross(v).cross(v).mul(rM).add(mu * rM)).magnitude()
                    )
                    / (-math.cos(prevRecursion) * (r.cross(v).cross(v).mul(rM).add(mu * rM)).magnitude() + mu * rM);
            }
        }
    }

    /**
     * Calculates the angle of true anomaly at a given point in time on this OrbitalState.
     * @param relativeTime The time relative to this trajectory
     * @returns The true anomaly angle in radians
     */
    public calculateTrueAnomalyFromTime(relativeTime: number): number {
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
            ) % (2 * math.pi);
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
     * Calculates a new KinematicState at a given point on this OrbitalState, using the angle of true anomaly.
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
            return new KinematicState(
                (subParam3.add(r.mul(subParam2).mul(math.cos(trueAnomaly))).mul(math.sin(trueAnomaly)))
                    .div(subParam2),
                (subParam3.sub(r.mul(subParam2).mul(math.sin(trueAnomaly))).mul(math.cos(trueAnomaly)))
                    .div(rM * subParam2)
                    .mul(vM),
                this.kinematicTemporalState.kinematicState.getRelativeOrUndefined()
            );
        }

        const subParam1: Vector3D = r.add(r.cross(v).cross(v).mul(rM)).mul(mu);
        const subParam1M: number = subParam1.magnitude();
        
        if (
            this.isClosed ||
            ( // check range of true anomaly of hyperbolic orbit
                !this.isClosed
                && -math.acos(-(mu * rM) / subParam1M)
                < math.abs(trueAnomaly) % (2 * math.pi) * math.sign(trueAnomaly)
                && math.abs(trueAnomaly) % (2 * math.pi) * math.sign(trueAnomaly)
                < math.acos(-(mu * rM) / subParam1M)
            )
        ) { // orbit is any other conic section
            // note: for velocity, the mu that multiplies with the entire fraction was moved to denominator to counter floating point errors (the big fraction should not end up as (0,0,0))
            // another note: really think about implementing arbitrary-precision arithmetic
            const subParam2Squared: number = subParam2 ** 2;
            return new KinematicState(
                (
                    ((subParam3.sub(v.mul(rM * subParam2Squared)).mul(mu)).mul(math.sin(trueAnomaly)))
                    .add(subParam1.mul(subParam2).mul(math.cos(trueAnomaly)))
                )
                .mul(
                    (subParam2 * rM)
                    / (
                        -subParam1M
                        * (math.cos(trueAnomaly) * subParam1M + mu * rM)
                    )
                ),
                (subParam3.mul(mu)).div((subParam2Squared) * rM).negate()
                .add(
                    (
                        ((subParam3.sub(v.mul(rM * subParam2Squared)).mul(mu)).mul(math.cos(trueAnomaly))).negate()
                        .add(subParam1.mul(subParam2).mul(math.sin(trueAnomaly)))
                    )
                    .div((subParam2Squared) * subParam1M / mu)
                )
                .add(v),
                this.kinematicTemporalState.kinematicState.getRelativeOrUndefined()
            ); // ...should i be concerned about performance issues
        } else { // true anomaly is out of range of hyperbolic orbit
            error(
                `CalculatePointFromTrueAnomaly Invalid angle
                (min: ${-math.acos(-(mu * rM) / subParam1M)})
                (max: ${math.acos(-(mu * rM) / subParam1M)})`
            );
        }
    }


    /**
     * Calculates a new KinematicState at a given point in time on this OrbitalState.
     * @param relativeTime The time relative to this trajectory
     * @returns The kinematic state at that time
     */
    public calculatePointFromTime(relativeTime: number): KinematicState {
        const trueAnomalyAngle: number = this.calculateTrueAnomalyFromTime(relativeTime);
        // assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan ({trueAnomalyAngle})`)

        return this.calculatePointFromTrueAnomaly(trueAnomalyAngle);
    }

    // fweiughwrupig uewrguewr iger ybturwub9a tywuoitb hwaoiuths giujkrmhzdgnmcghjmtydtjcr

    /**
     * Calculates the true anomaly at the point on this OrbitalState closest to a given point.
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
     * Calculates the length of time separating two given true anomalies on this OrbitalState.
     * @param trueAnomaly The end angle of true anomaly
     * @param referenceTrueAnomaly The start angle of true anomaly (defaults to current position)
     * @returns The time in seconds
     */
    public calculateTimeFromTrueAnomaly(trueAnomaly: number, referenceTrueAnomaly?: number): number {
        const adjustedReferenceTrueAnomaly: number = referenceTrueAnomaly ?? this.calculateTrueAnomalyFromPoint(this.kinematicTemporalState.getPosition());

        return this.calculateTimeFromPeriapsis(trueAnomaly) - this.calculateTimeFromPeriapsis(adjustedReferenceTrueAnomaly);
    }

    /**
     * Calculates the time until the craft reaches a specific point on this OrbitalState.
     * @param position The position to be reached
     * @param referencePosition The reference position (defaults to current position)
     * @returns The time in seconds
     */
    public calculateTimeFromPoint(position: Vector3D, referencePosition?: Vector3D): number {
        const trueAnomalyAngle: number = this.calculateTrueAnomalyFromPoint(position);

        if (referencePosition !== undefined) {
            return this.calculateTimeFromTrueAnomaly(trueAnomalyAngle, this.calculateTrueAnomalyFromPoint(referencePosition));
        } else {
            return this.calculateTimeFromTrueAnomaly(trueAnomalyAngle);
        }
    }

    /**
     * Calculates the true anomaly at a given point closest to a given altitude on this OrbitalState.
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
     * Calculates the time the craft reaches a specific altitude on this OrbitalState.
     * @param magnitude The target altitude
     * @returns The time in seconds
     */
    public calculateTimeFromMagnitude(magnitude: number): number {
        const trueAnomalyAngle: number = this.calculateTrueAnomalyFromMagnitude(magnitude);
        // assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan`)

        const resultTime: number = this.calculateTimeFromTrueAnomaly(trueAnomalyAngle);
        // assert(resultTime == resultTime, `resultTime is nan`)

        return resultTime;
    }

    /**
     * Calculates a new KinematicState at a given altitude on this OrbitalState.
     * @param magnitude The target altitude
     * @returns The kinematic state at that altitude
     */
    public calculatePointFromMagnitude(magnitude: number): KinematicState {
        const trueAnomalyAngle: number = this.calculateTrueAnomalyFromMagnitude(magnitude);
        // assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan`)

        const resultPoint: KinematicState = this.calculatePointFromTrueAnomaly(trueAnomalyAngle);

        return resultPoint;
    }

}
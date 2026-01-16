import LinearState from "../TrajectoryState/LinearState";
import OrbitalState from "../TrajectoryState/OrbitalState";
import CelestialState from ".";
import PhysicsCelestial from "../../Celestial/PhysicsCelestial";
import GravityCelestial from "../../Celestial/GravityCelestial";

/**
 * PhysicsState is the state of a PhysicsCelestial at a given time.
 * Immutable.
 */
export default class PhysicsState extends CelestialState {
    declare readonly celestial: PhysicsCelestial;
    declare readonly trajectoryState: LinearState | OrbitalState;
    public readonly orbiting: GravityCelestial;

    // Constructors

    /**
     * Copy-constructor.
     */
    public constructor(state: PhysicsState);

    /**
     * Creates a new PhysicsState instance from a KinematicTemporalState.
     */
    public constructor(celestial: PhysicsCelestial, trajectoryState: LinearState | OrbitalState, orbiting: GravityCelestial);

    public constructor(
        arg1: PhysicsState | PhysicsCelestial,
        arg2?: LinearState | OrbitalState,
        arg3?: GravityCelestial
    ) {
        if (arg1 instanceof PhysicsState) {
            super(arg1);
            this.orbiting = arg1.orbiting;
        } else {
            assert(arg2 && arg3)
            super(arg1, arg2);
            this.orbiting = arg3;
        }
    }

    override equals(other?: PhysicsState): other is PhysicsState {
        return super.equals(other);
    }

    override deepClone(): PhysicsState {
        return new PhysicsState(this);
    }
}
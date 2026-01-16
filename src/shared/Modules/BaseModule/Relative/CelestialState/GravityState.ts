import LinearState from "../TrajectoryState/LinearState";
import OrbitalState from "../TrajectoryState/OrbitalState";
import CelestialState from ".";
import GravityCelestial from "../../Celestial/GravityCelestial";

/**
 * GravityState is the state of a GravityCelestial at a given time.
 * Immutable.
 */
export default class GravityState extends CelestialState {
    declare readonly celestial: GravityCelestial;
    declare readonly trajectoryState: LinearState | OrbitalState;

    // Constructors

    /**
     * Copy-constructor.
     */
    public constructor(state: GravityState);

    /**
     * Creates a new GravityState instance from a KinematicTemporalState.
     */
    public constructor(celestial: GravityCelestial, trajectoryState: LinearState | OrbitalState);

    public constructor(
        arg1: GravityState | GravityCelestial,
        arg2?: LinearState | OrbitalState
    ) {
        if (arg1 instanceof GravityState) {
            super(arg1);
        } else {
            assert(arg2)
            super(arg1, arg2);
        }
    }

    override equals(other?: GravityState): other is GravityState {
        return super.equals(other);
    }

    override deepClone(): GravityState {
        return new GravityState(this);
    }
}
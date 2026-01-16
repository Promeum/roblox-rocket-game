import Relative from "..";
import TrajectoryState from "../TrajectoryState";

import type Celestial from "../../Celestial";

/**
 * CelestialState is the state of a Celestial at a given time.
 * Immutable.
 */
export default class CelestialState extends Relative {
    public readonly celestial: Celestial;
    public readonly trajectoryState: TrajectoryState;

    // Constructors

    /**
     * Copy-constructor.
     */
    public constructor(state: CelestialState);

    /**
     * Creates a new CelestialState instance from a KinematicTemporalState.
     */
    public constructor(celestial: Celestial, trajectoryState: TrajectoryState);

    public constructor(
        arg1: CelestialState | Celestial,
        arg2?: TrajectoryState
    ) {
        if (arg1 instanceof CelestialState) {
            super(arg1.getRelativeOrUndefined());
            this.celestial = arg1.celestial;
            this.trajectoryState = arg1.trajectoryState;
        } else {
            assert(arg2)
            super(arg2.getRelativeOrUndefined());
            this.celestial = arg1;
            this.trajectoryState = arg2;
        }
    }

    override equals(other?: CelestialState): other is CelestialState {
        return other !== undefined && this.celestial.equals(other.celestial)
            && this.trajectoryState.equals(other.trajectoryState);
    }

    override deepClone(): CelestialState {
        return this;
    }
}
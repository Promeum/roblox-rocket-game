import BaseModule from "..";
import KinematicTemporalState from "../Relative/State/KinematicTemporalState";
import type Celestial from "../Relative/Celestial";

/**
 * A marker class for Celestial-related characteristics.
 */
export default class CelestialState extends BaseModule {
	public readonly celestial: Celestial;
    public readonly kinematicPosition: KinematicTemporalState;

    // Constructors

    /**
     * Creates a new CelestialState instance from a CelestialState.
     */
    public constructor(initialPosition: CelestialState);

    /**
     * Creates a new CelestialState instance from a KinematicTemporalState.
     */
    public constructor(initialPosition: KinematicTemporalState, celestial: Celestial);

    public constructor(arg1: KinematicTemporalState | CelestialState, arg2?: Celestial) {
        super();

        if (arg1 instanceof CelestialState) {
            this.celestial = arg1.celestial;
            this.kinematicPosition = arg1.kinematicPosition;
        } else {
            assert(arg2)
            this.celestial = arg2;
            this.kinematicPosition = arg1;
        }
    }
    
}

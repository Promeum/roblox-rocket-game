import Vector3D from "shared/Modules/Libraries/Vector3D";

import Relative from "..";
import Chrono from "../../Chrono";
import Kinematic from "../Physics/Kinematic";
import TrajectoryState from "../TrajectoryState";

import type Celestial from "../../Celestial";

/**
 * CelestialState is the state of a Celestial at a given time.
 * Immutable.
 */
export default class CelestialState extends Relative {
    public readonly celestial: Celestial;
    public readonly physics: TrajectoryState;
    public readonly time: Chrono;
    public readonly kinematics: Kinematic;
    public readonly position: Vector3D;
    public readonly velocity: Vector3D;

    // Constructors

    /**
     * Copy-constructor.
     */
    public constructor(state: CelestialState);

    /**
     * Creates a new CelestialState instance from a TrajectoryState.
     */
    public constructor(celestial: Celestial, trajectoryState: TrajectoryState);

    public constructor(
        arg1: CelestialState | Celestial,
        arg2?: TrajectoryState
    ) {
        if (arg1 instanceof CelestialState) {
            super(arg1.queryRelative());
            this.celestial = arg1.celestial;
            this.physics = arg1.physics;
        } else {
            assert(arg2)
            super(arg2.queryRelative());
            this.celestial = arg1;
            this.physics = arg2;
        }
		this.time = this.physics.time;
		this.kinematics = this.physics.kinematics;
		this.position = this.physics.position;
		this.velocity = this.physics.velocity;
    }

    override equals(other?: CelestialState): other is CelestialState {
        return other !== undefined && this.celestial.equals(other.celestial)
            && this.physics.equals(other.physics);
    }
}
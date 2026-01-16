import TemporalState from "../Relative/State/TemporalState";
import GravityCelestial from "../Celestial/GravityCelestial";
import PhysicsCelestial from "../Celestial/PhysicsCelestial";
import Universe from ".";
import UniverseState from "./UniverseState";

/**
 * This class stores a live representation of the current game.
 * Mutable.
 */
export default class UniverseInstance extends Universe {
	// Constructors

	public constructor(
		globalTime?: TemporalState,
		rootGravityCelestials?: GravityCelestial[],
		rootPhysicsCelestials?: PhysicsCelestial[]
	);

	public constructor(universe: Universe);

	public constructor(arg1?: TemporalState | Universe, arg2?: GravityCelestial[], arg3?: PhysicsCelestial[]) {
		super();
		if (arg1 instanceof Universe) {
			this.globalTime = arg1.globalTime;
			this.rootGravityCelestials = arg1.rootGravityCelestials;
			this.allPhysicsCelestials = arg1.allPhysicsCelestials;
		} else {
			this.globalTime = arg1 ?? new TemporalState(0);
			this.rootGravityCelestials = arg2 ?? [];
			this.allPhysicsCelestials = arg3 ?? [];
		}
	}

	public getState(): UniverseState {
		return new UniverseState(this);
	}

	override deepClone(): Universe {
		error("Universe deepClone() method disabled")
	}
}

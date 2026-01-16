import TemporalState from "../Relative/State/TemporalState";
import GravityCelestial from "../Celestial/GravityCelestial";
import PhysicsCelestial from "../Celestial/PhysicsCelestial";
import Universe from ".";

/**
 * This class stores a snapshot of everything going on in a game.
 * Immutable.
 */
export default class UniverseState extends Universe {
	declare readonly globalTime: TemporalState;
	declare readonly rootGravityCelestials: GravityCelestial[];
	declare readonly allPhysicsCelestials: PhysicsCelestial[];

	// Constructors

	public constructor(
		globalTime?: TemporalState,
		rootGravityCelestials?: GravityCelestial[],
		allPhysicsCelestials?: PhysicsCelestial[]
	);

	public constructor(universe: Universe);

	public constructor(arg1?: TemporalState | Universe, arg2?: GravityCelestial[], arg3?: PhysicsCelestial[]) {
		super();
		if (arg1 instanceof Universe) {
			this.globalTime = arg1.globalTime.deepClone();
			this.rootGravityCelestials = arg1.rootGravityCelestials.map(v => v.deepClone());
			this.allPhysicsCelestials = arg1.allPhysicsCelestials.map(v => v.deepClone());
		} else {
			this.globalTime = arg1?.deepClone() ?? new TemporalState(0);
			this.rootGravityCelestials = arg2?.map(v => v.deepClone()) ?? [];
			this.allPhysicsCelestials = arg3?.map(v => v.deepClone()) ?? [];
		}
	}

	public serialize(): string {
		error("Not implemented")
	}

	override deepClone(): UniverseState {
		return this;
	}
}

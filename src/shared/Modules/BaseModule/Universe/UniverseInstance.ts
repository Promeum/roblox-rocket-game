import Chrono from "../Chrono";
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
		time?: Chrono,
		rootGravityCelestials?: GravityCelestial[],
		rootPhysicsCelestials?: PhysicsCelestial[]
	);

	public constructor(universe: Universe);

	public constructor(arg1?: Chrono | Universe, arg2?: GravityCelestial[], arg3?: PhysicsCelestial[]) {
		super();
		if (arg1 instanceof Universe) {
			this.time = arg1.time;
			this.rootGravityCelestials = arg1.rootGravityCelestials;
			this.allPhysicsCelestials = arg1.allPhysicsCelestials;
		} else {
			this.time = arg1 ?? Chrono.zero;
			this.rootGravityCelestials = arg2 ?? [];
			this.allPhysicsCelestials = arg3 ?? [];
		}
		this.setUniverse();
	}

	/**
	 * Advances the state of the universe.
	 * @param delta deltaTime
	 */
	public advanceGlobalTime(delta: number): void {
		this.time = this.time.add(delta);

		for (const celestial of this.allPhysicsCelestials) {
			celestial.setState(this.time);
			if (celestial.physicsMode === "physics")
				celestial.preSimulation();
		}
		for (const celestial of this.allGravityCelestials())
			celestial.setState(this.time);
	}

	public postSimulation(): void {
		for (const celestial of this.allPhysicsCelestials)
			celestial.postSimulation();
	}

	public getState(): UniverseState {
		return new UniverseState(this);
	}

	override deepClone(): Universe {
		error("Universe deepClone() method disabled")
	}
}

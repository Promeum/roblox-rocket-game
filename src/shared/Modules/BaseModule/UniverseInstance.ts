import BaseModule from ".";
import Chrono from "./Chrono";
import GravityCelestial from "./Celestial/GravityCelestial";
import PhysicsCelestial from "./Celestial/PhysicsCelestial";

/**
 * This class stores a live representation of the current game.
 * Mutable.
 */
export default class UniverseInstance extends BaseModule {
	time: Chrono;
	rootGravityCelestials: GravityCelestial[] = [];
	allPhysicsCelestials: PhysicsCelestial[] = [];

	// Constructors

	constructor(
		time?: Chrono,
		rootGravityCelestials?: GravityCelestial[],
		rootPhysicsCelestials?: PhysicsCelestial[]
	);

	constructor(universe: UniverseInstance);

	constructor(arg1?: Chrono | UniverseInstance, arg2?: GravityCelestial[], arg3?: PhysicsCelestial[]) {
		super();
		if (arg1 instanceof UniverseInstance) {
			this.time = arg1.time;
			this.rootGravityCelestials = arg1.rootGravityCelestials;
			this.allPhysicsCelestials = arg1.allPhysicsCelestials;
		} else {
			this.time = arg1 ?? Chrono.zero;
			this.rootGravityCelestials = arg2 ?? [];
			this.allPhysicsCelestials = arg3 ?? [];
		}

		for (const celestial of this.allGravityCelestials())
			celestial.universe = this;
		for (const celestial of this.allPhysicsCelestials)
			celestial.universe = this;
	}

	// Private methods

	/** Breadth-first search */
	private allGravityCelestials(): GravityCelestial[] {
		let result = this.rootGravityCelestials;
		for (let index = 0; index < result.size(); index++) {
			const celestial = result[index];
			result = [...result, ...celestial.childGravityCelestials];
		}
		return result;
	}

	// Public methods

	/**
	 * Advances the state of the universe.
	 * @param delta deltaTime
	 */
	preSimulation(delta: number): void {
		this.time = this.time.add(delta);

		for (const celestial of this.allPhysicsCelestials) {
			celestial.setState(this.time);
			if (celestial.physicsMode === "physics")
				celestial.preSimulation(delta);
		}
		for (const celestial of this.allGravityCelestials())
			celestial.setState(this.time);
	}

	postSimulation(): void {
		for (const celestial of this.allPhysicsCelestials)
			celestial.postSimulation();
	}
}

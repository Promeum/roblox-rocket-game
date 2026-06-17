import BaseModule from "..";
import Chrono from "../Chrono";
import GravityCelestial from "../Celestial/GravityCelestial";
import PhysicsCelestial from "../Celestial/PhysicsCelestial";

/**
 * Stores a game state.
 */
export default abstract class Universe extends BaseModule {
	public time: Chrono = Chrono.zero;
	public rootGravityCelestials: GravityCelestial[] = [];
	public allPhysicsCelestials: PhysicsCelestial[] = [];

	/**
	 * Sets the universe for all Celestials.
	 */
	protected setUniverse(): void {
		for (const celestial of this.allGravityCelestials())
			celestial.universe = this;
		for (const celestial of this.allPhysicsCelestials)
			celestial.universe = this;
	}

	/** Breadth-first search */
	protected allGravityCelestials(): GravityCelestial[] {
		let result = this.rootGravityCelestials;
		for (let index = 0; index < result.size(); index++) {
			const celestial = result[index];
			result = [...result, ...celestial.childGravityCelestials];
		}
		return result;
	}

	abstract override deepClone(): Universe;
}

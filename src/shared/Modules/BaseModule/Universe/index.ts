import BaseModule from "..";
import TemporalState from "../Relative/State/TemporalState";
import GravityCelestial from "../Celestial/GravityCelestial";
import PhysicsCelestial from "../Celestial/PhysicsCelestial";

/**
 * Stores a game state.
 */
export default abstract class Universe extends BaseModule {
	public globalTime: TemporalState = new TemporalState(0);
	public rootGravityCelestials: GravityCelestial[] = [];
	public allPhysicsCelestials: PhysicsCelestial[] = [];

	abstract override deepClone(): Universe;
}

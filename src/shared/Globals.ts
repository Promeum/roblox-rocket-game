import type GravityCelestial from "./Modules/BaseModule/Relative/Celestial/GravityCelestial";
import type PhysicsCelestial from "./Modules/BaseModule/Relative/Celestial/PhysicsCelestial";
import TemporalState from "./Modules/BaseModule/Relative/State/TemporalState";

/*
	This class stores global variables local to the current Universe/save game.

	Most likely will be relocated in the future when the
	game is more developed (has menus/multisave/etc.)
*/

// Uses relative TemporalStates for maintaining precision
// over very long timescales (>1 year?)
// eslint-disable-next-line prefer-const
export let globalTime: TemporalState = new TemporalState(0);
export const rootGravityCelestials: GravityCelestial[] = [];
export const rootPhysicsCelestials: PhysicsCelestial[] = [];

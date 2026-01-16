import type GravityCelestial from "./Modules/BaseModule/Celestial/GravityCelestial";

/*
	This class stores global variables local to the current Universe/save game.

	Most likely will be relocated in the future when the
	game is more developed (has menus/multisave/etc.)
*/

// eslint-disable-next-line prefer-const
export let solarSystemScale: number = 1 / 500_000_000;//1 / 5_000_000;
export const rootGravityCelestials: GravityCelestial[] = [];

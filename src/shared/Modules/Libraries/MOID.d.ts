/**
 * The Minimum Orbital Intersection Distance function.
 * @param saxisA Semi-major axis of A
 * @param eccenA Eccentricity of A
 * @param argpeA Argument of periapsis of A
 * @param omegaA Longitude of the ascending node of A
 * @param incliA Inclination of B
 * @param saxisB Semi-major axis of B
 * @param eccenB Eccentricity of B
 * @param argpeB Argument of periapsis of B
 * @param omegaB Longitude of the asc3nding node of B
 * @param incliB Inclination of B
 */
declare function MOID(
	saxisA: number, eccenA: number, argpeA: number, omegaA: number, incliA: number,
	saxisB: number, eccenB: number, argpeB: number, omegaB: number, incliB: number
): number;

export = MOID;
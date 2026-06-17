import Relative from "..";

export default abstract class Physics extends Relative {

	/**
	 * Creates a new Physics instance.
	 */
	protected constructor(relativeTo?: Physics) {
		super(relativeTo);
	}

	/**
	 * Returns a new Physics relative to nil, representing
	 * the Physics relative to the base world Physics.
	 * 
	 * <code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	 * <code>result: result</code>
	 * 
	 * @returns {Physics} The resultant Physics.
	 */
	public abstract absolute(): Physics

	/**
	 * Returns a new Physics relative to the current relativeTo's relativeTo.
	 * 
	 * <code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	 * <code>result: a-b-c-result</code>
	 * 
	 * @returns {Physics} The resultant Physics.
	 */
	public abstract consolidate(): Physics

	/**
	 * Synchronizes this Physics with another
	 * such that they have the same RelativeTo.
	 *
	 * <code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	 * <code>other: &nbsp;a-b-e-other</code><br>
	 * <code>result: a-b-selfResult, a-b-otherResult</code>
	 *
	 * @param {Physics} other The other Physics to synchronize with.
	 * @returns {[Physics, Physics]} The synchronized Physics as a tuple
	 * of self and other, in that order.
	 */
	public abstract synchronize(other: Physics): [Physics, Physics]

	/**
	 * Matches the RelativeTo tree of other with this Physics.
	 * 
	 * <code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	 * <code>other: &nbsp;a-b-e-other</code><br>
	 * <code>result: a-b-c-d-otherResult</code>
	 * 
	 * @param {Physics} other The other Physics to match with.
	 * @returns {Physics} The synchronized other Physics.
	 */
	public abstract matchRelative(other: Physics): Physics

	public equals(other?: Physics): other is Physics {
		return super.equals(other);
	}

	public abstract deepClone(): Physics
}

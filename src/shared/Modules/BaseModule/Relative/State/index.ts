import Relative from "..";

export default abstract class State extends Relative {

    /**
     * Creates a new State instance.
     */
    protected constructor(relativeTo?: State) {
        super(relativeTo);
    }

    /**
     * Returns a new State relative to nil, representing
     * the State relative to the base world state.
     * Implemented in superclasses.
     * 
     * <code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
     * <code>result: result</code>
     * 
     * @returns {State} The resultant State.
     */
    public abstract getAbsolute(): State

    /**
     * Returns a new State relative to the current relativeTo's relativeTo.
     * Implemented in superclasses.
     * 
     * <code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
     * <code>result: a-b-c-result</code>
     * 
     * @returns {State} The resultant State.
     */
    public abstract consolidateOnce(): State

    /**
     * 	Synchronizes this State with another such that they have the same RelativeTo.
     * 	Implemented in superclasses.
     * 
     * 	<code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
     * 	<code>other: &nbsp;a-b-e-other</code><br>
     * 	<code>result: a-b-selfResult, a-b-otherResult</code>
     * 
     * 	@param {State} other The other State to synchronize with.
     * 	@returns {[State, State]} The synchronized States as a tuple of self and other, in that order.
     */
    public abstract synchronize(other: State): [State, State]

    /**
     * Matches the RelativeTo tree of other with this State.
     * Implemented in superclasses.
     * 
     * <code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
     * <code>other: &nbsp;a-b-e-other</code><br>
     * <code>result: a-b-c-d-otherResult</code>
     * 
     * @param {State} other The other State to match with.
     * @returns {State} The synchronized other State. Note: Resultant relativeTime may be negative.
     */
    public abstract matchRelative(other: State): State

	public equals(other?: State): boolean {
		return super.equals(other);
	}

	public deepClone(): State {
		return super.deepClone() as State;
	}
    
}

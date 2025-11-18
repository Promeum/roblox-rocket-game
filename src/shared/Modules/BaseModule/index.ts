/**
 * Base module (class) for all other modules.
 * Immutable. Abstract. Non-instantiatable.
 */
export default class BaseModule {
    public equals(other: BaseModule | undefined): boolean {
        return other instanceof BaseModule
    }

	public deepClone(): BaseModule {
        return this
    }
}

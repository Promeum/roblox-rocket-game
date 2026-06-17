class Controller {
    public constructor(player: Player);

    // Properties (Read Only)

    /**
     * Whether or not the controller is active.
     */
    public Enabled: boolean;

    /**
     * The last tick() when the `SetNormal()` method was successfully called and updated.
     * This is useful for doing thing like debounces between transitioning normals.
     */
    public readonly NormalUpdateTick: number;

	// Methods

    /**
     * Sets the world relative to the part where normal is "up".
     */
	public SetNormal(normal: Vector3): void;

    /**
     * Must be called after camera updates every frame.
     * @param {number} dt Delta time
     * @param {number} speed Interpolation speed, omit for no interpolation.
     */
	public Update(dt: number, speed?: number): void;
}

declare const Controller: Controller;

export = Controller;

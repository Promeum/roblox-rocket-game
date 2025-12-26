import State from ".";
import KinematicState from "./KinematicState";
import TemporalState from "./TemporalState";
import AccelerationState from "./AccelerationState";
import Vector3D from "shared/Modules/Libraries/Vector3D";

/**
 * KinematicTemporalState represents a composite state, made up of a KinematicState and TemporalState.
 * It encapsulates both a kinematic state (position/velocity) and a temporal state (time).
 */
export default class KinematicTemporalState extends State {
	public readonly kinematicState: KinematicState;
	public readonly temporalState: TemporalState;

    // Constructors

	/**
	 * Creates a new KinematicTemporalState instance.
	 */
	public constructor(kinematicState: KinematicState, temporalState: TemporalState) {
		super();
		this.kinematicState = kinematicState;
		this.temporalState = temporalState;
	}

    // Methods

	/**
	 * Gets the relative time of this KinematicTemporalState.
	 */
	public getRelativeTime(): number {
		return this.temporalState.relativeTime;
	}

	/**
	 * Gets the absolute time of this KinematicTemporalState.
	 */
	public getAbsoluteTime(): number {
		return this.temporalState.getAbsoluteTime();
	}

	/**
	 * Gets the position of this KinematicTemporalState.
	 */
	public getPosition(): Vector3D {
		return this.kinematicState.position;
	}

	/**
	 * Gets the velocity of this KinematicTemporalState.
	 */
	public getVelocity(): Vector3D {
		return this.kinematicState.velocity;
	}

	/**
	 * Gets the absolute position of this KinematicTemporalState.
	 */
	public getAbsolutePosition(): Vector3D {
		return this.kinematicState.getAbsolutePosition();
	}

	/**
	 * Gets the absolute velocity of this KinematicTemporalState.
	 */
	public getAbsoluteVelocity(): Vector3D {
		return this.kinematicState.getAbsoluteVelocity();
	}

	override getAbsolute(): KinematicTemporalState {
		return new KinematicTemporalState(
			this.kinematicState.getAbsolute(),
			this.temporalState.getAbsolute()
		);
	}

	override consolidateOnce(): KinematicTemporalState {
		return new KinematicTemporalState(
			this.kinematicState.consolidateOnce(),
			this.temporalState.consolidateOnce()
		);
	}

	override synchronize(other: KinematicTemporalState): [KinematicTemporalState, KinematicTemporalState] {
		const kinematicState: KinematicState[] = this.kinematicState.synchronize(other.kinematicState);
		const temporalState: TemporalState[] = this.temporalState.synchronize(other.temporalState);

		return [
			new KinematicTemporalState(
				kinematicState[0],
				temporalState[0]
			),
			new KinematicTemporalState(
				kinematicState[1],
				temporalState[1]
			)
		];
	}

	override matchRelative(other: KinematicTemporalState): KinematicTemporalState {
		return new KinematicTemporalState(
			this.kinematicState.matchRelative(other.kinematicState),
			this.temporalState.matchRelative(other.temporalState)
		);
	}

	/**
	 * Advances this KinematicTemporalState in time, and recursively
	 * does the same (without acceleration) to its entire relative tree.
	 * @param delta The time to advance.
	 * @param acceleration Optionally applies acceleration over delta.
	 * @returns A new KinematicTemporalState.
	 */
	public step(delta: number, acceleration?: AccelerationState): KinematicTemporalState {
		const newKinematicState = this.kinematicState.step(delta, acceleration);
		const newTemporalState = this.temporalState.withIncrementTime(delta);

		return new KinematicTemporalState(newKinematicState, newTemporalState);
	}

	/**
	 * Gets the absolute kinematic state of this KinematicTemporalState.
	 */
	public getAbsoluteKinematicState(): KinematicState {
		return this.kinematicState.getAbsolute();
	}

	/**
	 * Gets the absolute temporal state of this KinematicTemporalState.
	 */
	public getAbsoluteTemporalState(): TemporalState {
		return this.temporalState.getAbsolute();
	}

	/**
	 * Consolidates the kinematic part of this KinematicTemporalState.
	 */
	public consolidateKinematic(): KinematicTemporalState {
		return new KinematicTemporalState(
			this.kinematicState.consolidateOnce(),
			this.temporalState
		);
	}

	/**
	 * Consolidates the temporal part of this KinematicTemporalState.
	 */
	public consolidateTemporal(): KinematicTemporalState {
		return new KinematicTemporalState(
			this.kinematicState,
			this.temporalState.consolidateOnce()
		);
	}

	/**
	 * Checks if this KinematicTemporalState shares the same relative tree with another.
	 */
	public sameRelativeTree(other: KinematicTemporalState): boolean {
		return this.kinematicState.sameRelativeTree(other.kinematicState) &&
			   this.temporalState.sameRelativeTree(other.temporalState);
	}

	/**
	 * Checks equality with another KinematicTemporalState.
	 */
	public equals(other?: KinematicTemporalState): boolean {
        if (this === undefined || other === undefined)
            return this === undefined && other === undefined;

		return this.kinematicState.equals(other.kinematicState) && 
			   this.temporalState.equals(other.temporalState);
	}

	// Disabled supermethods

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected setRelative(relativeTo?: KinematicTemporalState): void {
		error("KinematicTemporalState setRelative() Unsupported operation");
	}

	public hasRelative(): boolean {
		error("KinematicTemporalState hasRelative() Unsupported operation");
	}
	
	public getRelative(): KinematicTemporalState {
		error("KinematicTemporalState getRelative() Unsupported operation");
	}

	public getRelativeOrUndefined(): KinematicTemporalState | undefined {
		error("KinematicTemporalState getRelativeOrUndefined() Unsupported operation");
	}

	public getRelativeTree(): KinematicTemporalState[] {
		error("KinematicTemporalState getRelativeTree() Unsupported operation");
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public convergenceIndex(other: KinematicTemporalState): number {
		error("KinematicTemporalState convergenceIndex() Unsupported operation");
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public convergenceItem(other: KinematicTemporalState): KinematicTemporalState | undefined {
		error("KinematicTemporalState convergenceItem() Unsupported operation");
	}

	public length(): number {
		error("KinematicTemporalState length() Unsupported operation");
	}
}

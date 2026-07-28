import Vector3D from "shared/Modules/Libraries/Vector3D";

import Physics from ".";
import Kinematic from "./Kinematic";
import Chrono from "../../Chrono";

/**
 * KinematicChrono represents a composite state, made up of a KinematicState and Chrono.
 * It encapsulates both a kinematic state (position/velocity) and a temporal state (time).
 */
export default class KinematicChrono extends Physics {
	public readonly kinematic: Kinematic;
	public readonly chrono: Chrono;

	public readonly position: Vector3D;
	public readonly velocity: Vector3D;

    // Constructors

	/**
	 * Creates a new KinematicChrono instance.
	 */
	public constructor(kinematic: Kinematic, chrono: Chrono, relativeTo?: KinematicChrono) {
		super(relativeTo);
		this.kinematic = kinematic;
		this.chrono = chrono;
		this.position = kinematic.position;
		this.velocity = kinematic.velocity;
	}

    // Methods

	/**
	 * Gets the absolute position of this KinematicChrono.
	 */
	public absolutePosition(): Vector3D {
		return this.kinematic.absolutePosition();
	}

	/**
	 * Gets the absolute velocity of this KinematicChrono.
	 */
	public absoluteVelocity(): Vector3D {
		return this.kinematic.absoluteVelocity();
	}

	override absolute(): KinematicChrono {
		return new KinematicChrono(this.kinematic.absolute(), this.chrono);
	}

	override consolidate(): KinematicChrono {
		return new KinematicChrono(this.kinematic.consolidate(), this.chrono);
	}

	override synchronize(other: KinematicChrono): [KinematicChrono, KinematicChrono] {
		const kinematic: Kinematic[] = this.kinematic.synchronize(other.kinematic);

		return [
			new KinematicChrono(kinematic[0], this.chrono),
			new KinematicChrono(kinematic[1], other.chrono)
		];
	}

	override matchRelative(other: KinematicChrono): KinematicChrono {
		return new KinematicChrono(
			this.kinematic.matchRelative(other.kinematic),
			this.chrono
		);
	}

	// /**
	//  * Advances this KinematicChrono in time, and recursively
	//  * does the same (without acceleration) to its entire relative tree.
	//  * @param delta The time to advance.
	//  * @param acceleration Optionally applies acceleration over delta.
	//  * @returns A new KinematicChrono.
	//  */
	// public step(delta: number, acceleration?: Acceleration): KinematicChrono {
	// 	const newKinematic = this.kinematic.step(delta, acceleration);
	// 	const newChrono = this.chrono.add(delta);

	// 	return new KinematicChrono(newKinematic, newChrono);
	// }

	// /**
	//  * Gets the absolute kinematic state of this KinematicChrono.
	//  */
	// public absoluteKinematic(): KinematicState {
	// 	return this.kinematic.absolute();
	// }

	/**
	 * Consolidates the kinematic part of this KinematicChrono.
	 */
	public consolidateKinematic(): KinematicChrono {
		return new KinematicChrono(
			this.kinematic.consolidate(),
			this.chrono
		);
	}

	// /**
	//  * Consolidates the temporal part of this KinematicChrono.
	//  */
	// public consolidateTemporal(): KinematicChrono {
	// 	return new KinematicChrono(
	// 		this.kinematic,
	// 		this.chrono.consolidateOnce()
	// 	);
	// }

	/**
	 * Checks if this KinematicChrono shares the same relative tree with another.
	 */
	public sameRelativeTree(other: KinematicChrono): boolean {
		return this.kinematic.sameRelativeTree(other.kinematic) &&
			   this.getRelative().chrono.equals(other.getRelative().chrono);
	}

	/**
	 * Checks equality with another KinematicChrono.
	 */
	public equals(other?: KinematicChrono): other is KinematicChrono {
        if (this === undefined || other === undefined)
            return this === undefined && other === undefined;

		return this.kinematic.equals(other.kinematic) && 
			   this.chrono.equals(other.chrono);
	}

	// Supermethods

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected setRelative(relativeTo?: KinematicChrono): void {
		error("KinematicChrono setRelative() Unsupported operation");
	}

	override hasRelative(): boolean {
		return super.hasRelative();
	}
	
	override getRelative(): KinematicChrono {
		return super.getRelative() as KinematicChrono;
	}

	override queryRelative(): KinematicChrono | undefined {
		return super.queryRelative() as KinematicChrono | undefined;
	}

	override getRelativeTree(): KinematicChrono[] {
		return super.getRelativeTree() as KinematicChrono[];
	}

	override convergenceIndex(other: KinematicChrono): number {
		return super.convergenceIndex(other);
	}

	override convergenceItem(other: KinematicChrono): KinematicChrono | undefined {
		return super.convergenceItem(other) as KinematicChrono | undefined;
	}

	override length(): number {
		return super.length();
	}
}

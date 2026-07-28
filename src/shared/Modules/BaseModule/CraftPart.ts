import Vector3D from "shared/Modules/Libraries/Vector3D";
import PARTS from "shared/Assets/CraftParts/CraftParts.json";
import BaseModule from ".";
import RigidBody from "./RigidBody";
import ModuleState, { StateVariant } from "./CraftModule/ModuleState";
import type Craft from "./Craft";
import { FlowState } from "./CraftModule/Flow";

type PresetName = "Rocket Engine" | "Fuel Tank" | "Probe Nosecone"

type CraftConnection = {
	part: CraftPart;
	/** Parented under `Craft` folder */
	weld: RigidConstraint;
	partner: CraftConnection;
}

export default class CraftPart extends BaseModule {
	private static readonly partAssets = game.GetService("ReplicatedStorage")
											 .WaitForChild("Assets")
											 .WaitForChild("CraftParts") as Folder;

	readonly id: string;
	readonly model: Model;
	readonly rigidBodies: RigidBody[];
	readonly connectionPoints: Attachment[];
	readonly state: ModuleState;

	craft!: Craft;
	parent?: CraftConnection;
	connections: CraftConnection[] = [];

	private constructor(
		name: string,
		model: Model,
		connectionPoints: Attachment[],
		rigidBodies: RigidBody[],
		state: ModuleState,
	) {
		super();

		this.id = name;
		this.model = model;
		this.rigidBodies = rigidBodies;
		this.connectionPoints = connectionPoints;
		this.state = state;
	}

	// Public methods

	/**
	 * Factory method for making preset `CraftPart`s
	 */
	static make(name: PresetName): CraftPart {
		const model = CraftPart.partAssets.FindFirstChild(name)!.Clone() as Model;
		const connections = model.QueryDescendants(".ConnectionPoint") as Attachment[];

		const rigidBodies: RigidBody[] = [];
		for (const collisionModel of model.QueryDescendants(".CollisionModel"))
			rigidBodies.push(new RigidBody(collisionModel as Model));

		const state = new ModuleState(PARTS[name] as StateVariant<"serializable">[], model);

		return new CraftPart(name, model, connections, rigidBodies, state);
	}

	// Simulation methods

	requestFlow(): FlowState<"live">[] {
		const result = [
			...this.state.thrusters.map(t => t.requestFlow()),
			...this.state.controlWheels.map(c => c.requestFlow())
		];
		return result;
	}

	/**
	 * @param flowAvailable Per-resource ratio (0-1) of craft-wide resource requirement met
	 */
	applyPhysics(delta: number) {
        for (const thruster of this.state.thrusters) thruster.applyPhysics(delta);
        for (const controlWheel of this.state.controlWheels) controlWheel.applyPhysics();
	}

	/**
	 * Propogates to all CraftParts.
	 * @param impulse Velocity to be added to current
	 */
	preSimulation(impulse: Vector3D): void {
		// this.logic.preSimulation();

		for (const rigidBody of this.rigidBodies)
			rigidBody.preSimulation(impulse);
	}

	/**
	 * @returns The velocity of this CraftPart only.
	 */
	postSimulation(): Vector3D {
		let total: Vector3D = Vector3D.zero;
		for (const rigidBody of this.rigidBodies)
			total = total.add(rigidBody.postSimulation());
		return total;
	}

	// Relationship management

	/**
	 * Parents a `CraftPart` to the current instance.
	 * Call in `preSimulation`.
	 */
	addChild(parentNode: Attachment, childNode: Attachment, child: CraftPart) {
		const weld = new Instance("RigidConstraint");
		weld.Attachment0 = parentNode;
		weld.Attachment1 = childNode;

		const toChild = { part: child, weld: weld } as CraftConnection;
		const toParent = { part: this, weld: weld, partner: toChild };
		toChild.partner = toParent;

		this.connections.push(toChild);
		child.parent = toParent;
		return this;
	}

	/**
	 * Unparents this `CraftPart`.
	 * Call in `postSimulation`.
	 */
	unparent() {
		assert(this.parent, `CraftPart unparent() CraftPart '${this.id}' has no parent`)
		const connection = this.parent;
		const parent = this.parent.part;
		const index = parent.connections.indexOf(connection.partner);

		parent.connections.remove(index);
		this.parent = undefined;
		connection.weld.Destroy();

		return this;
	}

	getConnectionPoint(name: string) {
		const result = this.connectionPoints
						   .find(a => a.GetAttribute("Name") === name);
		assert(result, `CraftPart getConnectionPoint() Could not find '${name}`);
		return result;
	}

	getChildWelds() {
		return this.connections.map(c => c.weld);
	}

	getChildParts() {
		return this.connections.map(c => c.part);
	}
}

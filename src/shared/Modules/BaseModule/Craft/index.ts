import Vector3D from "shared/Modules/Libraries/Vector3D";
import BaseModule from "..";
import PhysicsCelestial from "../Celestial/PhysicsCelestial";
import CraftPart from "../CraftPart";
import CraftModule from "../CraftModule";
import CraftState from "./CraftState";
import Container from "../CraftModule/Container";
import Flow, { FlowState } from "../CraftModule/Flow";
import ControlPoint from "../CraftModule/ControlPoint";
import PartLogic from "../CraftModule/PartLogic";

/** Orchestrates the craft simulation pipeline */
export default class Craft extends BaseModule {
    celestial!: PhysicsCelestial;
    primaryPart: CraftPart;
    state: CraftState;

    /** Used in impulse calculations */
    private lastVelocity = Vector3D.zero;

    constructor(
        primaryPart: CraftPart
    ) {
        super();

        this.primaryPart = primaryPart;
        primaryPart.craft = this;

        this.state = new CraftState(this);
    }

    // Private methods

    /** @param velocity From orbital calculations */
    private preKinematics(velocity: Vector3D): void {
        for (const childPart of this.allParts())
            childPart.preSimulation(velocity.sub(this.lastVelocity));
    }

    /** @returns Average velocity of all `CraftPart`s */
    private postKinematics(): Vector3D {
        const allParts = this.allParts();
        let total: Vector3D = Vector3D.zero;
        for (const part of allParts)
            total = total.add(part.postSimulation());
        this.lastVelocity = total.div(allParts.size());
        return this.lastVelocity;
    }

    private getFlowRequests(): Flow[] {
        const allParts = this.allParts();
        const result = [];
        for (const part of allParts) {
            for (const flowReq of part.requestFlow())
                result.push(flowReq);
        }
        return result;
    }

    // Public methods

    /**
     * Orchestrates everything on a Craft.
     * @param velocity Calculated trajectory velocity
     * @param delta Duration of this physics timestep in seconds
     */
    preSimulation(velocity: Vector3D, delta: number): void {
        ControlPoint.handleInput();
        PartLogic.executeHandlers();
        Flow.handleRequests(
            delta,
            this.state.containerResources(),
            this.state.containerMax(),
            this.getFlowRequests()
        );
        Flow.handleFlow(delta, this.state.tieredContainers, this.state.resourceFlows);
        Container.handleCrossfeed(delta, this.state.tieredContainers);
        for (const part of this.allParts()) part.applyPhysics(delta);

        // TODO: Player-initiated transfers (will implement in later phase)
        // - Add API for player-requested resource transfers between containers

        this.preKinematics(velocity);
    }

    postSimulation(): Vector3D {
        // TODO: Implement craft destruction physics, docking mechanics
        // this.modifyPartTree();
        // TODO: Refactor RigidBody to behave like other `CraftModule`s
        const kinematics = this.postKinematics();
        return kinematics;
    }

    /**
     * Transitions between physics and rails mode.
     */
    setPhysicsMode(physicsMode: "rails" | "physics"): void {
        // TODO: Implement multi-CraftPart craft physics
        if (physicsMode === "physics") {
            for (const craftPart of this.allParts()) {
                craftPart.rigidBodies.forEach(rb => {
                    rb.part.Anchored = false;
                    // Assume orbiting is 0 velocity, will change in future
                    rb.part.AssemblyLinearVelocity = this.celestial.state.velocity.toVector3();
                });
            }
        } else {
            for (const craftPart of this.allParts()) {
                craftPart.rigidBodies.forEach(rb => {
                    rb.part.AssemblyLinearVelocity = Vector3.zero;
                    rb.part.AssemblyAngularVelocity = Vector3.zero;
                    rb.part.Anchored = true;
                });
                for (const thruster of craftPart.state.thrusters) {
                    thruster.state.targetThrust = 0;
                    thruster.state.thrust = 0;
                    thruster.state.flowData.state.targetFlow = new Array(
                        thruster.state.flowData.state.resource.length, 0);
                }
            }
        }
    }

    /** Breadth-first search */
    allParts(): CraftPart[] {
        // TODO: Cache results
        let result = [this.primaryPart];
        let toAdd = result[0].getChildParts();
        let i = 0;
        while (i < toAdd.size()) {
            const part = toAdd[i];
            result.push(part);
            toAdd = [...toAdd, ...part.getChildParts()];
            i++;
        }
        return result;
    }

    getPartId(id: string) {
        return this.allParts().find(p => p.id === id)
    }
}

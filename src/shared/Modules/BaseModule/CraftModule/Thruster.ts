import CraftModule from ".";
import type Flow from "./Flow";
import type { FlowState } from "./Flow";
import { State } from "./ModuleState";

/**
 * [Roblox Force Unit](https://create.roblox.com/docs/physics/units),
 * or 'Rowtons' (RMU stud/s²)
 */
export const RFU_PER_NEWTON = 0.163;

export interface ThrusterState<S extends "serializable" | "live"> extends State {
    type: `Thruster`,
    flowData: S extends "serializable" ? FlowState<"serializable"> : Flow;
    /** Maximum thrust in Newtons */
    maxThrust: number; // TODO: Add atmospheric efficiency profile (for later phase)
    /** Thrust change rate as ratio per second squared */
    maxThrustRate: number;
    /** Current thrust as ratio (0 to 1 inclusive) */
    thrust: number;
    /** Target thrust as ratio (0 to 1 inclusive) */
    targetThrust: number;
    /** Actual thruster force in Newtons */
    force: number;
    /** Applied along +X */
    thrustVector: S extends "serializable" ? string[] : VectorForce;
    lookVector?: S extends "serializable" ? number[] : Vector3;
    gimbal?: S extends "serializable" ? string[] : AlignOrientation;
}

// TODO: Split the gimbal into its own module (later phase)
/**
 * Rocket engine with optional gimbal.
 * Dependency chain: Thrust > Flow > Target flow > Target thrust
 */
export default class Thruster extends CraftModule {
    constructor(public state: ThrusterState<"live">) {
        super();
        this.setThrust(this.state.thrust);
    }

    // Private methods

    protected setThrust(thrust: number): void {
        this.state.thrust = thrust;
        this.state.force = this.state.thrust * this.state.maxThrust;
        this.state.thrustVector.Force = Vector3.xAxis.mul(this.state.force * RFU_PER_NEWTON);
    }

    protected setGimbal(): void {
        assert(this.state.gimbal, "Thruster setGimbal() called on a non-gimbaling Thruster");
        this.state.gimbal.Attachment1!.Position = this.state.lookVector!;
    }

    /**
     * Applies modulation rate limit, flow rate limit
	 * @param flowAvailable Per-resource ratio (0-1) of craft-wide resource requirement met
     * @returns Thrust as ratio
     */
    protected adjustedThrust(delta: number): number {
        const maxModulation = this.state.maxThrustRate * delta;
        const modulated = math.clamp(
            this.state.targetThrust,
            math.max(0, this.state.thrust - maxModulation),
            math.min(1, this.state.thrust + maxModulation),
        );

        const flowData = this.state.flowData.state;
        const flowRatio = (() => { // Calculate ratio of target flow to max flow
            const proportions = flowData.resource.types
                .map((r, i) => !flowData.byproducts.includes(r) ? i : -1)
                .filter(i => i !== -1)
                .map(i => flowData.flow[i] / flowData.maxFlow[i]);
            return proportions.reduce((a, r) => a + r) / proportions.size();
        })();

        return math.min(modulated, flowRatio);
    }

    // Public methods

    /** Sets `flowData.targetFlow` */
    requestFlow(): Flow {
        // TODO: Apply maxThrustRate
        this.state.flowData.state.targetFlow = this.state.flowData.state.maxFlow
            .map(flow => flow * this.state.targetThrust);
        return this.state.flowData;
    }

    /**
	 * @param flowAvailable Per-resource ratio (0-1) of craft-wide resource requirement met
     */
    applyPhysics(delta: number): void {
        this.setThrust(this.adjustedThrust(delta));
        if (this.state.gimbal) this.setGimbal();
    }
}

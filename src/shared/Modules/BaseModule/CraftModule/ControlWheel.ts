import CraftModule from ".";
import type Flow from "./Flow";
import type { FlowState } from "./Flow";
import { State } from "./ModuleState";

export type TorqueValue = { X: number, Y: number, Z: number }

export interface ControlWheelState<S extends "serializable" | "live"> extends State {
    type: "ControlWheel",
    flowData: S extends "serializable" ? FlowState<"serializable"> : Flow;
    /** Maximum force in Newtons, applied per-axis */
    maxTorque: number;
    /** Current force as ratio (0 to 1 inclusive) */
    torque: TorqueValue;
    /** Target force as ratio (0 to 1 inclusive) */
    targetTorque: TorqueValue;
	gimbal: S extends "serializable" ? string[] : Torque;
}

export default class ControlWheel extends CraftModule {
    public constructor(public state: ControlWheelState<"live">) {
        super();
    }

    // Private methods

    private scaledTorque(torque: TorqueValue, factor: number): TorqueValue {
        return { X: factor * torque.X, Y: factor * torque.Y, Z: factor * torque.Z };
    }

    private setTorque(torque: TorqueValue): void {
        this.state.torque = torque;
        this.state.gimbal.Torque = new Vector3(
            this.state.torque.X,
            this.state.torque.Y,
            this.state.torque.Z,
        );
    }

    /**
     * Applies flow rate limit
     * @returns Thrust as ratio
     */
	private adjustedTorque(): TorqueValue {
        const flowData = this.state.flowData.state;
        const flowAvailable = (() => { // Calculate ratio of current flow to max flow
            const proportions = flowData.resource.types
                .map((r, i) => !flowData.byproducts.includes(r) ? i : -1)
                .filter(i => i !== -1)
                .map(i => flowData.flow[i] / flowData.maxFlow[i]);
            return proportions.reduce((a, r) => a + r) / proportions.size();
        })();
		return this.scaledTorque(this.state.targetTorque, flowAvailable);
	}

	// Public methods

    /** Sets `flowData.targetFlow` */
    requestFlow(): Flow {
        // TODO
        return this.state.flowData;
    }

    /**
	 * @param flowAvailable Per-resource ratio (0-1) of craft-wide resource requirement met
     */
	applyPhysics(): void {
        this.setTorque(this.adjustedTorque());
	}
}

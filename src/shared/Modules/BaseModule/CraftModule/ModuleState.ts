/*
 * CraftModule state type definitions
 */

import { ResourceArray } from "../Resource";
import Container, { ContainerState } from "./Container";
import Flow, { FlowState } from "./Flow";
import Thruster, { ThrusterState } from "./Thruster";
import ControlWheel, { ControlWheelState } from "./ControlWheel";
import { PartLogicState } from "./PartLogic";

// Types

export interface State {
    /** Unique within a `CraftPart` */
    id: string;
    type: string;
}

export type StateVariant<S extends "serializable" | "live"> = ContainerState<S> | FlowState<S>
    | ThrusterState<S> | ControlWheelState<S> | PartLogicState

/** Maps a `serializable` StateVariant to its `live` counterpart */
type LiveState<T extends StateVariant<"serializable">> =
    T extends ContainerState<"serializable"> ? ContainerState<"live">
    : T extends FlowState<"serializable"> ? FlowState<"live">
    : T extends ThrusterState<"serializable"> ? ThrusterState<"live">
    : T extends ControlWheelState<"serializable"> ? ControlWheelState<"live">
    : T

// Helper functions

function parsePath<T extends Instance>(model: Model, path: string[]): T {
    let instance: Instance = model;
    for (const pathString of path)
        instance = instance.WaitForChild(pathString);
    return instance as T;
}

/** Converts serialized `path` into simulation-specific `instance` */
function toLiveState<T extends StateVariant<"serializable">>(serialized: T, model: Model): LiveState<T> {
    if (serialized.type === "Flow" || serialized.type === "Container") {
        return {
            ...serialized,
            resource: new ResourceArray(serialized.resource)
        } as LiveState<T>;
    } else if (serialized.type === "Thruster") {
        return {
            ...serialized,
            flowData: new Flow(toLiveState(serialized.flowData, model)),
            thrustVector: parsePath(model as Model, serialized.thrustVector),
            lookVector: serialized.lookVector ? new Vector3(...serialized.lookVector) : undefined,
            gimbal: serialized.gimbal ? parsePath(model as Model, serialized.gimbal) : undefined
        } as LiveState<T>;
    } else if (serialized.type === "ControlWheel") {
        return {
            ...serialized,
            flowData: new Flow(toLiveState(serialized.flowData, model)),
            gimbal: parsePath(model as Model, serialized.gimbal)
        } as LiveState<T>;
    } else return {...serialized} as LiveState<T>;
}

// ModuleState

/**
 * Single source of truth for all `CraftModule`s inside a `CraftPart`.
 * Functions as an interface for a collection of modules.
 */
export default class ModuleState {
    /** Singleton */
    container?: Container;
    flows: Flow[] = [];
    thrusters: Thruster[] = [];
    controlWheels: ControlWheel[] = [];

    constructor(modules: StateVariant<"serializable">[], model: Model) {
		for (const moduleParam of modules) {
			switch (moduleParam.type) {
				case "Container":
					this.registerContainer(toLiveState(moduleParam, model));
					break;
				case "Thruster":
                    const liveThruster = toLiveState(moduleParam, model);
					this.registerThruster(liveThruster);
					this.registerFlow(liveThruster.flowData);
					break;
				case "ControlWheel":
                    const liveCW = toLiveState(moduleParam, model);
					this.registerControlWheel(liveCW);
					this.registerFlow(liveCW.flowData);
					break;
                default:
                    warn(`ModulesState constructor() Module ${moduleParam.type} not registered`);
			}
		}
    }

    // Private methods

    private registerContainer(state: ContainerState<"live">) {
        if (this.container !== undefined) warn(`ModuleState registerContainer() Overwriting an existing Container: ${this.container}`)
        this.container = new Container(state);
    }

    private registerFlow(flow: Flow) {
        this.flows.push(flow);
    }

    private registerThruster(state: ThrusterState<"live">) {
        const thruster = new Thruster(state);
        this.thrusters.push(thruster);
        this.registerFlow(thruster.state.flowData);
    }

    private registerControlWheel(state: ControlWheelState<"live">) {
        const controlWheel = new ControlWheel(state);
        this.controlWheels.push(controlWheel);
        this.registerFlow(controlWheel.state.flowData);
    }
    
    // Public methods

    allModules(): (Container | Flow | Thruster | ControlWheel)[] {
        return [this.container, ...this.flows, ...this.thrusters, ...this.controlWheels].filterUndefined();
    }

    getModule(id: string) {
        for (const module of this.allModules())
            if (module.state.id === id) return module;
        return undefined;
    }
}

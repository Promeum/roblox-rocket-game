import BaseModule from "..";
import Container, { ContainerPriority } from "../CraftModule/Container";
import Flow from "../CraftModule/Flow";
import Thruster from "../CraftModule/Thruster";
import { RESOURCES_LIST, ResourceTypes } from "../Resource";
import type Craft from ".";

// Unused for now
// /** Craft-wide data */
// export interface CraftContext {
//     // // User controls (TODO: implement in later phase)
//     // /** 0..1, primary thrust axis */
//     // userThrust: number;
//     // /** -1..1, zenith rotation */
//     // rotateZenith: number;
//     // /** -1..1, aft rotation */
//     // rotateAft: number;

//     // Craft-level kinematics (populated by CraftState)
//     /** meters above surface */
//     altitude: number;
//     /** world-space velocity vector */
//     velocity: Vector3D;
//     /** current craft orientation */
//     orientation: CFrame;

//     resourceTypes: ResourceTypes[];
//     /** Resource totals across all `Container`s in the craft */
//     totalResources: number[];
//     /** Resource flow totals across all `Flow`s in the craft */
//     netTargetFlow: number[];
// }

export type TieredContainers = ReadonlyMap<ResourceTypes, Record<ContainerPriority, Container[]> | undefined>
export type ResourceFlows = ReadonlyMap<ResourceTypes, Flow[] | undefined>

/**
 * Manages craft state over time and handles resource transfers.
 * Models transfer behavior using priority-based flow.
 */
export default class CraftState extends BaseModule {
    readonly craft: Craft;
    readonly containers: Container[] = [];
    readonly flows: Flow[] = [];
    readonly thrusters: Thruster[] = [];

    /** Sorted in descending priority per resource type */
    readonly tieredContainers: TieredContainers = new ReadonlyMap();
    /** Sorted per resource type */
    readonly resourceFlows: ResourceFlows = new ReadonlyMap();

    constructor(craft: Craft) {
        super();

        this.craft = craft;

        for (const module of this.craft.allModules()) {
            if (module instanceof Container)
                this.containers.push(module);
            else if (module instanceof Flow)
                this.flows.push(module);
            else if (module instanceof Thruster)
                this.thrusters.push(module);
            else error(`Unsupported CraftModule: "${module}"`);
        }

        const tieredContainers = new Map<ResourceTypes, Record<ContainerPriority, Container[]> | undefined>();
        const resourceFlows = new Map<ResourceTypes, Flow[] | undefined>();

        for (const resource of RESOURCES_LIST) {
            const containers = [[], [], [], [], [], [], [], [], [], []] as unknown as Record<ContainerPriority, Container[]>;
            let ctrEmpty = true;
            for (const container of this.containers) {
                if (!container.state.resource.contains(resource)) continue;
                ctrEmpty = false;
                const i = container.state.resource.index(resource);
                const priority = container.state.priority[i];
                containers[priority].push(container);
            }
            if (!ctrEmpty) tieredContainers.set(resource, containers);

            const flows: Flow[] = [];
            let flowEmpty = true;
            for (const flow of this.flows) {
                if (!flow.state.resource.contains(resource)) continue;
                flowEmpty = false;
                flows.push(flow);
            }
            if (!flowEmpty) resourceFlows.set(resource, flows);
        }
        this.tieredContainers = tieredContainers;
        this.resourceFlows = resourceFlows;
    }

    /**
     * Total available resources across all containers at call time.
     * Unstored resources are omitted.
     */
    public containerResources(): ReadonlyMap<ResourceTypes, number> {
        const available = new Map<ResourceTypes, number>();
        for (const container of this.containers) {
            for (let i = 0; i < container.state.resource.length; i++) {
                const resource = container.state.resource.types[i];
                available.set(resource, available.get(resource) ?? 0 + container.state.resources[i]);
            }
        }
        return available;
    }

    /**
     * Total capacity for all resources across all containers at call time.
     * Unstored resources are omitted.
     */
    public containerMax(): ReadonlyMap<ResourceTypes, number> {
        const capacity = new Map<ResourceTypes, number>(RESOURCES_LIST.map(r => [r, 0]));
        for (const container of this.containers) {
            for (let i = 0; i < container.state.resource.length; i++) {
                const resource = container.state.resource.types[i];
                capacity.set(resource, capacity.get(resource)! + container.state.max[i]);
            }
        }
        return capacity;
    }

    /** Total available resources from all flows at call time */
    public flowResources(): ReadonlyMap<ResourceTypes, number> {
        const available = new Map<ResourceTypes, number>(RESOURCES_LIST.map(r => [r, 0]));
        for (const flow of this.flows) {
            for (let i = 0; i < flow.state.resource.length; i++) {
                const resource = flow.state.resource.types[i];
                available.set(resource, available.get(resource)! + flow.state.flow[i]);
            }
        }
        return available;
    }
}

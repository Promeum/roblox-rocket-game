import CraftModule from ".";
import { ResourceFlows, TieredContainers } from "../Craft/CraftState";
import { State } from "./ModuleState";
import { ContainerPriority } from "../CraftModule/Container";
import { ResourceArray, ResourceTypes } from "../Resource";

/** Per-module resource request data schema */
export interface FlowState<S extends "serializable" | "live"> extends State {
	type: "Flow";
    /** Resource types this flow consumes/produces */
    resource: S extends "serializable" ? ResourceTypes[] : ResourceArray;
    /**
     * True flow rates (units/s).
     * Must be proportional to `targetFlow`.
    */
    flow: number[];
    /** Target flow rates (units/s) */
    targetFlow: number[];
    /** Max flow rates (units/s) */
    maxFlow: number[];
    /** Non-required resources are discarded */
    byproducts: ResourceTypes[];
}

// TODO: Refactor static methods: Split methods into multiple module scope functions and have only one static method

/** Consumption/Production request handling and resource flow execution */
export default class Flow extends CraftModule {
    constructor(public state: FlowState<"live">) {
        super();

        assert(state.resource.length === state.flow.size(),
               `Resource arrays have different sizes (${state.resource.length}, ${state.flow.size()})`);
    }

    // Static methods

    /**
     * Handles resource consumption and generation.
     * 
     * Produces to and consumes from cumulative craft resource supply,
     * affecting high priority-numbered containers first.
     */
    static handleFlow(
        delta: number,
        tieredContainers: TieredContainers,
        resourceFlows: ResourceFlows
    ): void {
        for (const [resource, flows] of resourceFlows) {
            if (!flows) continue;

            // Sum total flow rate across all modules for this resource.
            let totalRate = 0;
            for (const flow of flows)
                totalRate += flow.state.flow[flow.state.resource.index(resource)];

            let amount = math.abs(totalRate) * delta;
            if (amount === 0) continue;

            const containers = tieredContainers.get(resource);
            if (!containers) continue;

            // TODO: Add/Remove resources in *equal proportion when possible*, from each set of equal-priority containers.
            if (totalRate < 0) {
                // Consumption: deduct from high-priority-numbered containers first.
                for (let p = 10; p >= 1; p--) {
                    const list = containers[p as ContainerPriority];
                    if (!list || list.size() === 0) continue;

                    for (const container of list) {
                        const idx = container.state.resource.index(resource);
                        if (amount >= container.state.resources[idx]) {
                            amount -= container.state.resources[idx];
                            container.state.resources[idx] = 0;
                        } else {
                            container.state.resources[idx] -= amount;
                            amount = 0;
                            break;
                        }
                        if (amount === 0) break;
                    }
                    if (amount === 0) break;
                }
            } else if (totalRate > 0) {
                // Production: add to low-priority-numbered containers first.
                for (let p = 1; p <= 10; p++) {
                    const list = containers[p as ContainerPriority];
                    if (!list || list.size() === 0) continue;

                    for (const container of list) {
                        const idx = container.state.resource.index(resource);
                        const capacity = container.state.max[idx] - container.state.resources[idx];
                        if (amount >= capacity) {
                            amount -= capacity;
                            container.state.resources[idx] = container.state.max[idx];
                        } else {
                            container.state.resources[idx] += amount;
                            amount = 0;
                            break;
                        }
                        if (amount === 0) break;
                    }
                    if (amount === 0) break;
                }
            }
        }
    }

    /**
     * Processes all resource transfer requests.
     * 
     * Ensures `FlowState.flow` is equal in ratio
     * to `targetFlow` if target flow cannot be met.
     * @param totalResources Total available resources
     * across all containers at call time
     */
    static handleRequests(
        delta: number,
        totalResources: ReadonlyMap<ResourceTypes, number>,
        totalCapacity: ReadonlyMap<ResourceTypes, number>,
        flowRequests: Flow[]
    ): void {
        const totalRequested = new Map<ResourceTypes, number>();
        const byproductRequested = new Map<ResourceTypes, number>();
        for (const flow of flowRequests) {
            const request = flow.state;
            for (let i = 0; i < request.targetFlow.size(); i++) {
                const resource = request.resource.types[i];
                if (!request.byproducts.includes(resource)) {
                    totalRequested.set(
                        resource,
                        totalRequested.get(resource) ?? 0 + request.targetFlow[i]
                    );
                } else {
                    byproductRequested.set(
                        resource,
                        byproductRequested.get(resource) ?? 0 + request.targetFlow[i]
                    );
                }
            }
        }

        // 2 stages: non-byproduct ratio normalization generates excess
        // for byproduct ratio normalization
        // (byproduct trimmings are simply unused resources)

        /** Apply resource-specific fufillment ratio across all flows */
        function applyRatios(
            requests: Map<ResourceTypes, number>,
            resources: ReadonlyMap<ResourceTypes, number>
        ) {
            const ratios = new Map<ResourceTypes, number>();
            for (const [resource, available] of resources) {
                const request = (requests.get(resource) ?? 0) * delta;
                if (request < 0) {
                    const ratio = math.min(available / -request, 1);
                    ratios.set(resource, ratio);
                } else if (request > 0) {
                    const capacity = totalCapacity.get(resource) ?? 0 - available;
                    const ratio = math.min(capacity / request, 1);
                    ratios.set(resource, ratio);
                } else ratios.set(resource, 1);
            }
            return ratios;
        }
        const resourceRatios = applyRatios(totalRequested, totalResources);

        // Apply flow-specific ratio and audit excess resources
        const extra = totalResources as Map<ResourceTypes, number>;
        const flowRatios: number[] = [];
        for (let i = 0; i < flowRequests.size(); i++) {
            const request = flowRequests[i].state;
            let minRatio = 1;
            for (let j = 0; j < request.resource.length; j++) {
                const resource = request.resource.types[j];
                if (!request.byproducts.includes(resource))
                    minRatio = math.min(resourceRatios.get(resource)!, minRatio);
            }
            for (let k = 0; k < request.resource.length; k++) {
                const resource = request.resource.types[k];
                if (!request.byproducts.includes(resource)) {
                    const flow = request.targetFlow[k] * minRatio;
                    request.flow[k] = flow;
                    extra.set(resource, extra.get(resource) ?? 0 - flow);
                } else {
                    request.flow[k] = math.min(request.targetFlow[k] * resourceRatios.get(resource)!)
                }
            }
            flowRatios[i] = minRatio;
        }

        // Use excess resources for byproducts
        const byresourceRatios = applyRatios(byproductRequested, extra);
        for (let i = 0; i < flowRequests.size(); i++) {
            const request = flowRequests[i].state;
            for (let j = 0; j < request.resource.length; j++) {
                const resource = request.resource.types[j];
                if (request.byproducts.includes(resource)) {
                    const ratio = math.min(byresourceRatios.get(resource)!, flowRatios[i]);
                    request.flow[j] = request.targetFlow[j] * ratio;
                }
            }
        }
    }

    // Public methods (unused)

    // /** Weight flux of a single resource in kg */
    // resourceWeightFlow(resource: ResourceTypes): number {
    //     assert(this.state.resource.contains(resource), `Resource ${resource} not found in Flow`);
    //     const rate = this.getFlow(resource);
    //     switch (RESOURCES[resource].units) {
    //         case "kg": return rate;
    //         case "g": return rate * 1000;
    //         case "watts": return 0;
    //     }
    // }

    // /** Weight flux of all resources in kg */
    // totalWeightFlow(): number {
    //     let total = 0;
    //     for (const resource of this.state.resource.types)
    //         total += this.resourceWeightFlow(resource);
    //     return total;
    // }

    // /** Linear scaling of `maxFlow` according to `power` */
    // flowRatio(power: number): number[] {
    //     return this.state.maxFlow.map(flow => flow * power);
    // }

    // /**
    //  * Applies flow rate limit
    //  * @param flowAvailable Resources available to this module in units
    //  * @returns Power between 0 and 1
    //  */
    // flowLimit(flowAvailable: ReadonlyMap<ResourceTypes, number>): number {
    //     let limit = 1;
    //     for (let i = 0; i < this.state.resource.length; i++) {
    //         const resource = this.state.resource.types[i];
    //         if (!this.state.byproducts.includes(resource)) {
    //             const available = flowAvailable.get(resource) ?? 0;
    //             limit = math.min(limit, available / this.state.maxFlow[i]);
    //         }
    //     }
    //     return limit;
    // }
}

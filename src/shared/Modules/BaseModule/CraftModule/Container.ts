import CraftModule from ".";
import { TieredContainers } from "../Craft/CraftState";
import { ResourceArray, ResourceTypes } from "../Resource";
import { State } from "./ModuleState";

/** Default priority is 5 */
export type ContainerPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Uses parallel arrays */
export interface ContainerState<S extends "serializable" | "live"> extends State {
    type: "Container";
    /** Resource types stored in container */
    resource: S extends "serializable" ? ResourceTypes[] : ResourceArray;
    /** Maximum capacity for each resource */
    max: number[];
    /** Transfer rates as ratio of maximum capacity per second */
    transferRates: number[];
    /** Current amount of each resource */
    resources: number[];
    /** Per-resource crossfeed flow priority */
    priority: ContainerPriority[];
}

/** Stores resources */
export default class Container extends CraftModule {
    constructor(public state: ContainerState<"live">) {
        super();
        assert(state.resource.length === state.max.size() &&
               state.resource.length === state.transferRates.size() &&
               (!state.resources || state.resource.length === state.resources.size()) &&
               (!state.priority || state.resource.length === state.priority.size()),
               `Resource arrays have different sizes (${state.resource.length}, `
               + `${state.max.size()}${state.resources ? `, ${state.resources.size()}` : ""}`
               + `${state.priority ? `, ${state.priority.size()}` : ""})`);
    }

    // Static methods

    /**
     * Handles automatic crossfeed transfer between containers.
     * Uses priority-based system.
     * - High priority resources --> low priority destinations
     * - Same priority resources do not equalize
     * - Prefers proportional transfers when possible
     */
    static handleCrossfeed(delta: number, tieredContainers: TieredContainers): void {
        // Process each resource type using pre-sorted priority tiers from CraftState.
        // Higher-priority sources feed lower-priority sinks via adjacent-tier pairs.
        for (const [resource, tierRecord] of tieredContainers) {
            if (!tierRecord) continue;

            // Collect non-empty priorities in descending order.
            const priorities: ContainerPriority[] = [];
            for (let p = 10; p >= 1; p--) {
                const containers = tierRecord[p as ContainerPriority];
                if (containers && containers.size() > 0)
                    priorities.push(p as ContainerPriority);
            }

            // Process adjacent-tier pairs: higher-priority feeds lower-priority.
            for (let t = 0; t < priorities.size() - 1; t++) {
                const srcContainers = tierRecord[priorities[t]]!;
                const dstContainers = tierRecord[priorities[t + 1]]!;

                // Calculate total available from source tier.
                let srcTotal = 0;
                for (const s of srcContainers) {
                    const idx = s.state.resource.index(resource);
                    srcTotal += s.state.resources[idx];
                }
                if (srcTotal <= 0) continue;

                // Calculate total capacity at destination tier.
                // Precompute per-destination capacity shares.
                let dstCapacity = 0;
                const dstShares: number[] = [];
                for (const d of dstContainers) {
                    const idx = d.state.resource.index(resource);
                    const capacity = math.max(0, d.state.max[idx] - d.state.resources[idx]);
                    dstShares.push(capacity);
                    dstCapacity += capacity;
                }
                if (dstCapacity <= 0) continue;

                // Amount to transfer is the minimum of source surplus and destination capacity.
                const amount = math.min(srcTotal, dstCapacity);

                // Two-phase: calculate all transfers first using pre-modification state, then apply.
                type Transfer = { srcIdx: number; dstIdx: number; out: number; inAmount: number };
                const transfers: Transfer[] = [];

                for (let si = 0; si < srcContainers.size(); si++) {
                    const s = srcContainers[si];
                    const idx = s.state.resource.index(resource);
                    const ratio = s.state.resources[idx] / srcTotal;
                    let out = amount * ratio;

                    // Cap at available resources.
                    if (out > s.state.resources[idx]) out = s.state.resources[idx];

                    // Cap at transfer rate limit for source.
                    const rateLimit = s.state.transferRates[idx] * delta;
                    if (out > rateLimit) out = rateLimit;

                    for (let di = 0; di < dstContainers.size(); di++) {
                        let space = dstShares[di];
                        if (space <= 0) continue;

                        // Proportional share of this destination's capacity within the tier.
                        let inAmount;
                        if (dstCapacity > 0) {
                            const dstRatio = space / dstCapacity;
                            inAmount = amount * dstRatio;
                        } else {
                            inAmount = amount / dstContainers.size();
                        }

                        // Cap at transfer rate limit for destination.
                        const d = dstContainers[di];
                        const didx = d.state.resource.index(resource);
                        const dstRateLimit = d.state.transferRates[didx] * delta;
                        if (inAmount > dstRateLimit) inAmount = dstRateLimit;

                        // Final cap: don't exceed available space.
                        if (inAmount > space) inAmount = space;

                        transfers.push({ srcIdx: si, dstIdx: di, out, inAmount });
                    }
                }

                // Apply all calculated transfers.
                for (const tr of transfers) {
                    const s = srcContainers[tr.srcIdx];
                    const d = dstContainers[tr.dstIdx];
                    const idx = s.state.resource.index(resource);
                    const didx = d.state.resource.index(resource);
                    s.state.resources[idx] -= tr.out;
                    d.state.resources[didx] += tr.inAmount;
                }
            }
        }
    }

    // Public methods (unused)

    // /** Max capacity of a certain resource */
    // maxOf(resource: ResourceTypes): number {
    //     const index = this.state.resource.index(resource);
    //     return this.state.max[index];
    // }

    // /** Weight of a single resource in kg */
    // resourceWeight(resource: ResourceTypes): number {
    //     const amount = this.getResource(resource);
    //     switch (RESOURCES[resource].units) {
    //         case "kg": return amount;
    //         case "g": return amount * 1000;
    //         case "watts": return 0;
    //     }
    // }

    // /** Weight of all resources in kg */
    // totalWeight(): number {
    //     return this.state.resource.types.reduce((sum, resource) => {
    //         return sum + this.resourceWeight(resource);
    //     }, 0);
    // }
}

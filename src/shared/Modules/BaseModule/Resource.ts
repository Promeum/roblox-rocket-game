// export enum State { SOLID, LIQUID, GAS }

export type UnitTypes = "kg" | "g" | "watts";

export interface Resource {
    "name": string;
    /**
     * kg per cubic meter
     */
    "density": number;
    "units": UnitTypes;
}

const RESOURCES_SOURCE = [
    {
        "name": "Electricity",
        "density": 0,
        "units": "watts",
    },
    {
        "name": "LiquidOxygen",
        "density": 1141,
        "units": "kg",
    },
    {
        "name": "Kerosene",
        "density": 800,
        "units": "kg",
    },
    {
        "name": "Methane",
        "density": 422.8,
        "units": "kg",
    },
] as const;

export type ResourceTypes = typeof RESOURCES_SOURCE[number]["name"];

export const RESOURCES_LIST = RESOURCES_SOURCE.map(v => v.name);

const RESOURCES = RESOURCES_SOURCE.reduce(function (a, v) {
    return { ...a, [v.name]: v}
}, {} as {[R in ResourceTypes]: Resource});
export default RESOURCES;

/**
 * Parallel array functionality for resource-specific attribute storage
 */
export class ResourceArray {
    /**
     * All currently stored resource types
     */
    readonly types: ResourceTypes[];
    length: number;

    constructor(resourceTypes: ResourceTypes[] = []) {
        assert(resourceTypes.every((v, _, a) => a.filter(i => i === v).size() === 1),
               `Resource type list "${resourceTypes}" has duplicates`);
        this.types = resourceTypes;
        this.length = resourceTypes.size();
    }

    /**
     * @returns The index of the resource
     */
    index(resource: ResourceTypes): number {
        assert(this.contains(resource), `Resource ${resource} not found`);
        return this.types.findIndex(r => r === resource);
    }

    contains(resource: ResourceTypes): boolean {
        return this.types.includes(resource);
    }

    /**
     * Does nothing if the resource is already included
     * @returns `true` if resource was added, `false` otherwise
     */
    add(resource: ResourceTypes): boolean {
        const wasAdded = this.contains(resource);
        if (!wasAdded) {
            this.types.push(resource);
            this.length++;
        }
        return !wasAdded;
    }
}

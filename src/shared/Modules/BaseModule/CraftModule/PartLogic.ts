// TODO: Figure out logic system architecture in later phase
import BaseModule from "..";
import { State } from "./ModuleState";

export type PartLogicState = State & { // TODO: Implement in later phase
    type: "PartLogic";
} & ({
    logic: "handler";
    handler: string;
    config: object;
} | {
    logic: "nodes";
    // nodes: LogicNode[];
})

/** Orchestrates logic for a `CraftPart` */
export default class PartLogic extends BaseModule {
    // handlers: Map<string, HandlerFn> = new Map();

    static executeHandlers(/* craft context parameters here */): void {
        // TODO: Implementation for later phase
    }
}

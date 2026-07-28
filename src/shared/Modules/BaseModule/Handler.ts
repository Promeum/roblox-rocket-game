// TODO: Figure out handler architecture in later phase
// /*
//  * Directive types for use with handlers and module endpoints
//  */

// import { CraftContext } from "./Craft/CraftState";
// import { ResourceTypes } from "./Resource";

// /**
//  * Handlers operate on a part's modules plus craft-wide context.
//  */
// export type HandlerFn = (context: CraftContext, config: object) => PartDirective[];

// /** Declarative state change request to be delivered via `preSimulation()` */
// export interface PartDirective {
//     partId: string;
//     flow?: FlowDirective;
//     thruster?: ThrusterDirective[];
// }

// interface ModuleDirective {
//     id: string;
// }

// // Module-specific directives

// /** Uses parallel arrays */
// export interface FlowDirective extends ModuleDirective {
//     resourceTypes: ResourceTypes[];
//     /** Requested by other craft modules */
//     targetFlow: number[];
// }

// export interface ThrusterDirective extends ModuleDirective {
//     /** In (0..1) */
//     targetThrust?: number;
//     setGimbal?: Vector3;
// }

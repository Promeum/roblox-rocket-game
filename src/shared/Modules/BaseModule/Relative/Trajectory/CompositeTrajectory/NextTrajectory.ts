// /*
//     Time range calculation functions for CompositeTrajectory.
// */

// import Chrono from "shared/Modules/BaseModule/Chrono";
// import CompositeTrajectory from ".";
// import LinearTrajectory from "../LinearTrajectory";
// import OrbitalTrajectory from "../OrbitalTrajectory";
// import Kinematic from "../../Physics/Kinematic";
// import KinematicChrono from "../../Physics/KinematicChrono";
// import GravityCelestial from "shared/Modules/BaseModule/Celestial/GravityCelestial";
// import LinearState from "../../TrajectoryState/LinearState";
// import OrbitalState from "../../TrajectoryState/OrbitalState";

// type compositeTrajectory = CompositeTrajectory<LinearTrajectory | OrbitalTrajectory>;

// /**
//  * 
//  */
// export function nextFromOrbital(this: compositeTrajectory): void {
//     assert(this.current instanceof OrbitalTrajectory);
//     // const selfPosition: KinematicState = this.startPosition.kinematicState;
//     let SOIExit: OrbitalState | false = false;
//     let closestSOIEntryTime: Chrono | false = false;
//     let closestCelestialSOI: GravityCelestial | undefined | false = false;
//     let nextTrajectoryDirection: "in" | "out" | false = false;

//     if ( // check if exiting out of current SOI
//         !this.current.hasApoapsis()
//         || (
//             this.current.hasApoapsis()
//             && this.current.getApoapsis().getKinematic().position.magnitude() > this.current.orbiting.SOIRadius
//         )
//     ) {
//         SOIExit = this.current.calculateStateFromMagnitude(this.current.orbiting.SOIRadius);
//         closestSOIEntryTime = SOIExit.getKinematic().chrono;

// if (closestSOIEntryTime !== closestSOIEntryTime) closestSOIEntryTime = false
// // this._testpart(
// // 	"SOI exit",
// // 	new BrickColor("Bright reddish lilac").Color,
// // 	Vector3D.one.mul(0.6),
// // 	SOIExit.getKinematic().consolidateOnce().position.mul(1/6371.01e3),
// // 	game.Workspace
// // )

// // print(SOIExit)
// // print(calcSOIExit)
// // assert(SOIExit.trueAnomaly === calcSOIExit.trueAnomaly, "trueAnomaly mismatched by "+(calcSOIExit.trueAnomaly - SOIExit.trueAnomaly))
//             // orbiting, itself, may or may not be orbiting something else
//             closestCelestialSOI = this.current.orbiting.orbiting;
//             nextTrajectoryDirection = "out";
//         }

//         // find soonest SOI change
//         if (this.current.orbiting.childGravityCelestials.size() > 0) {
// // warn("CompositeTrajectory moid attempt")
//             // calculate SOI entry for all root GravityCelestials
//             for (const gravityCelestial of this.current.orbiting.childGravityCelestials) {
//                 assert(gravityCelestial.trajectory instanceof OrbitalTrajectory)

//                 // get earliest valid (time >= 0) SOI entry time
//                 // subtract 0.5 to ensure SOI is not exited immediately
//                 const intersection = this.current.orbitalIntersection(
//                     gravityCelestial.trajectory, gravityCelestial.SOIRadius - 0.5);
// // print("start time:")
//                 if (intersection !== false) {
//                     // set new closest (or keep current closest) SOI
//                     const SOIEntryTime = intersection[0].time;
// // print(SOIEntryTime)
//                     if (closestSOIEntryTime === false || SOIEntryTime.lessThan(closestSOIEntryTime)) {
//                         closestSOIEntryTime = SOIEntryTime;
//                         closestCelestialSOI = gravityCelestial;
//                         nextTrajectoryDirection = "in";
//                     }
//                 }
// // else print("[none found]")
//             }
//         }

//         if (closestSOIEntryTime !== false) { // trajectory exits the current SOI
//             assert(closestCelestialSOI !== false);
//             this.timeOfNext = closestSOIEntryTime;
//             this.nextDirectionCache = nextTrajectoryDirection as nextTrajectoryDirectionType<T> | false;
//             this.nextOrbitingCache = closestCelestialSOI;
//             if (this.nextDirectionCache === "out") {
//                 // Trajectory going into outer SOI
//                 const newKinematicState: KinematicChrono = this.current
//                     .calculateStateFromTime(closestSOIEntryTime).getKinematic().consolidateKinematic();
//                 // const newKinematicState: KinematicChrono = SOITExit !== false ? SOIExit.getKinematic().consolidateOnce();

//                 if (!closestCelestialSOI) {
//                     // No outer SOI exists,
//                     // Trajectory exiting into linear trajectory
//                     this.nextCache = new CompositeTrajectory<LinearTrajectory>(
//                         new LinearTrajectory(
//                             newKinematicState
//                         ), this.rootGravityCelestials
//                     ) as nextTrajectoryType<T>;
//                 } else {
//                     // Outer SOI exists,
//                     // Trajectory exiting into orbital trajectory
//                     assert(closestCelestialSOI !== undefined)
//                     this.nextCache = new CompositeTrajectory<OrbitalTrajectory>(
//                         new OrbitalTrajectory(
//                             newKinematicState,
//                             closestCelestialSOI
//                         ), this.rootGravityCelestials
//                     ) as nextTrajectoryType<T>;
//                 }
// // this._testpart(
// // 	"SOI entry last trajectory (pre-instantiation)",
// // 	new BrickColor("Brick yellow").Color,
// // 	Vector3D.one.mul(0.6),
// // 	newKinematicState.position.mul(1/6371.01e3),
// // 	game.Workspace
// // )
//             } else {
//                 // Trajectory going into inner SOI
//                 // and is guaranteed an orbital trajectory
//                 assert(closestCelestialSOI !== undefined);
//                 const futureOrbitingState = closestCelestialSOI
//                     .trajectory.getKinematic(closestSOIEntryTime);
//                 const futureThisState = this.current.getKinematic(this.timeOfNext);
//                 // const futureThisState = SOIExit.getKinematic();
//                 const startState = new KinematicChrono(
//                     new Kinematic(
//                         futureThisState.position.sub(futureOrbitingState.position),
//                         futureThisState.velocity.sub(futureOrbitingState.velocity),
//                         futureOrbitingState.kinematic
//                     ),
//                     futureThisState.chrono
//                 );
// // this._testpart(
// // 	"SOI entry last trajectory (pre-instantiation)",
// // 	new BrickColor("Neon orange").Color,
// // 	Vector3D.one.mul(1),
// // 	startState.consolidateOnce().position.mul(1/6371.01e3),
// // 	game.Workspace,
// // 	Enum.PartType.Ball
// // )
//                 this.nextCache = new CompositeTrajectory<OrbitalTrajectory>(
//                     new OrbitalTrajectory(
//                         startState,
//                         closestCelestialSOI
//                     ), this.rootGravityCelestials
//                 );
//             }
//         } else { // trajectory stays within current SOI
//             this.timeOfNext = false;
//             this.nextCache = false;
//             this.nextDirectionCache = false;
//             this.nextOrbitingCache = false;
//         }
// print(
//     "next is "
//     + (this.nextCache === false ? "[none]"
//         : (
//             (this.nextCache as compositeTrajectory).current instanceof OrbitalTrajectory ?
//             ("orbit, around " + (this.nextCache.current as OrbitalTrajectory).orbiting.name)
//             : "linear"
//         )
//     )
// )
// if (this.nextCache){
// print(`\tstart time: ${this.timeOfNext instanceof Chrono ? this.timeOfNext.toString() : error("5hruirft")}`)
// }
// }

// /**
//  * 
//  */
// export function nextFromLinear(): void {
//     assert(this.current instanceof LinearTrajectory
//         && this.start instanceof LinearState);
//     let closestGravityCelestial: GravityCelestial | false = false;

//     if (this.rootGravityCelestials.size() > 0) {
//         // calculate soonest SOI entry among all root GravityCelestials
//         let closestSOIEntry: LinearState | false = false;

//         for (let i = 0; i < this.rootGravityCelestials.size(); i++) {
//             const celestial: GravityCelestial = this.rootGravityCelestials[i];

//             assert(celestial.trajectory instanceof LinearTrajectory,
//                 "self and gravityCelestial start positions are not relative to the same thing");

//             // get valid (time >= 0) SOI entry time
//             let result: LinearState | false = this.current
//                 .orbitalIntersection(celestial.trajectory, celestial.SOIRadius)[0] ?? false;
//             if (!result || result.time.lessThan(0))
//                 result = false;

//             // set new closest (or keep current closest) SOI
//             if (result !== false
//                 && (
//                     closestSOIEntry === false
//                     || result.time.lessThan(closestSOIEntry.time)
//                 )) {
//                 closestSOIEntry = result;
//                 closestGravityCelestial = celestial;
//             }
//         }

//         // trajectory enters an SOI
//         if (closestSOIEntry !== false) {
//             this.timeOfNext = closestSOIEntry.time;
//             this.nextDirectionCache = "in";
//             this.nextOrbitingCache = closestGravityCelestial as GravityCelestial;
//             const newKinematic: Kinematic = (closestSOIEntry.trajectory.start as LinearState)
//             .kinematics.matchRelative(
//                 closestSOIEntry.kinematics
//             );
//             // A linear trajectory can only enter into an orbital trajectory,
//             // never another linear trajectory
//             this.nextCache = new CompositeTrajectory<OrbitalTrajectory>(
//                 new OrbitalTrajectory(
//                     newKinematic.position,
//                     newKinematic.velocity,
//                     closestSOIEntry.time,
//                     this.nextOrbitingCache
//                 ), this.rootGravityCelestials
//             );
//         } else { // trajectory misses all root GravityCelestial SOIs
//             this.timeOfNext = false;
//             this.nextCache = false;
//             this.nextDirectionCache = false;
//             this.nextOrbitingCache = false;
//         }
//     } else { // no root GravityCelestials exist (i.e. space is empty)
//         this.timeOfNext = false;
//         this.nextCache = false;
//         this.nextDirectionCache = false;
//         this.nextOrbitingCache = false;
//     }
// print(
//     "next is "
//     + (this.nextCache === false ? "[none]"
//         : (
//             (this.nextCache as compositeTrajectory).current instanceof OrbitalTrajectory ?
//             ("orbit, around " + (this.nextCache.current as OrbitalTrajectory).orbiting.name)
//             : "linear"
//         )
//     )
// )
// }

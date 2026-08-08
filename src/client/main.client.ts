// import Vector3D from "shared/Modules/Libraries/Vector3D";
// import Datamap from "shared/Modules/BaseModule/Datamap";
// import Chrono from "shared/Modules/BaseModule/Chrono";
// import GravityCelestial from "shared/Modules/BaseModule/Celestial/GravityCelestial";
// import PhysicsCelestial from "shared/Modules/BaseModule/Celestial/PhysicsCelestial";
// import UniverseInstance from "shared/Modules/BaseModule/UniverseInstance";
// import WorldView from "shared/Modules/BaseModule/View/WorldView";
// import Craft from "shared/Modules/BaseModule/Craft";
// import CraftPart from "shared/Modules/BaseModule/CraftPart";
// import ViewCamera from "shared/Modules/BaseModule/ViewCamera";
// // import PlanetP1Datamaps from "shared/Assets/PlanetP1/datamaps.json";
// import EarthDatamaps from "shared/Assets/PlanetData/Earth/datamaps.json";
// import AstronomicalView from "shared/Modules/BaseModule/View/AstronomicalView";
// import View from "shared/Modules/BaseModule/View";

// game.Workspace.Gravity = 0;
// game.GetService("Lighting").OutdoorAmbient = new Color3(.4, .4, .4);
// const RunService = game.GetService("RunService");

// print("== setup start ==")
// const setupStartTime = os.clock();

// /*
//  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
// ===================================================== Universe Initialization =====================================================
//  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
//   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// */

// // ON-EARTH START
// // const Earth = new GravityCelestial(
// //     "Earth",
// //     Vector3D.zero,
// //     Vector3D.zero,
// //     // new Vector3D(-2.344796397128329E+10, -1.638736262440681E+07, 1.452213061233350E+11),
// //     // new Vector3D(-2.989434743673573E+04, 9.000105203986752E-01, -4.853641762746061E+03),
// //     Chrono.zero,
// //     5.97219e24,
// //     6371.01e3,
// //     new BrickColor("Steel blue").Color,
// //     new Datamap(
// //         // PlanetP1Datamaps.heightmap,
// //         EarthDatamaps.heightmap,
// //         [1000, 500]
// //     )
// // );
// // ON-EARTH END

// // TODO: Transfer solar system data to .json asset
// // SOLAR SYSTEM START
// const Sun = new GravityCelestial(
//     "Sun",
//     new Vector3D(0, 0, 0),
//     new Vector3D(0, 0, 0),
//     Chrono.zero,
//     1.9885e30,
//     695700e3,
//     new BrickColor("Pastel brown").Color,
//     undefined as unknown as Datamap
// );
// const Mercury = new GravityCelestial(
//     "Mercury",
//     new Vector3D(-2.185835358441481E+10, -3.485005094346408E+09, -6.614625011845423E+10),
//     new Vector3D(3.650093369107909E+04, -4.367018609323549E+03, -1.273461833585731E+04),
//     Chrono.zero,
//     3.302e23,
//     2439.4e3,
//     new BrickColor("Smoky grey").Color,
//     undefined as unknown as Datamap,
//     Sun
// );
// const Venus = new GravityCelestial(
//     "Venus",
//     new Vector3D(-1.075385106364918E+11, 6.160527557804195E+09, -2.057163683439167E+09),
//     new Vector3D(4.611733871187763E+02, -5.279208622663791E+02, -3.516748102702129E+04),
//     Chrono.zero,
//     48.685e23,
//     6051.84e3,
//     new BrickColor("Bronze").Color,
//     undefined as unknown as Datamap,
//     Sun
// );
// const Earth = new GravityCelestial(
//     "Earth",
//     new Vector3D(-2.344796397128329E+10, -1.638736262440681E+07, 1.452213061233350E+11),
//     new Vector3D(-2.989434743673573E+04, 9.000105203986752E-01, -4.853641762746061E+03),
//     Chrono.zero,
//     5.97219e24,
//     6371.01e3,
//     new BrickColor("Steel blue").Color,
//     new Datamap(EarthDatamaps.heightmap, [1000, 500], EarthDatamaps.maxHeight),
//     Sun
// );
    
// const Mars = new GravityCelestial(
//     "Mars",
//     new Vector3D(2.079413286219068E+11, -5.180248494584806E+09, -5.677471461403446E+09),
//     // eslint-disable-next-line no-loss-of-precision
//     new Vector3D(1.615287420127653E+03, 5.160202387037263E+02, 2.627674229888704E+04),
//     Chrono.zero,
//     6.4171e23,
//     3389.92e3,
//     new BrickColor("Br. reddish orange").Color,
//     undefined as unknown as Datamap,
//     Sun
// );
// const Moon = new GravityCelestial(
//     "Moon",
//     new Vector3D(-3.205398330266103E+08, 3.658599781326822E+07, -2.380401614217560E+08),
//     // eslint-disable-next-line no-loss-of-precision
//     new Vector3D(5.511228197116279E+02, -1.568395408118706E+00, -8.066150606766933E+02),
//     Chrono.zero,
//     7.349e22,
//     1737.53e3,
//     new BrickColor("Dark stone grey").Color,
//     undefined as unknown as Datamap,
//     Earth
// );
// // SOLAR SYSTEM END

// /*
//  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
// ======================================================== Rocketship Setup ========================================================
//  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
//   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// */

// // Initial kinematics and stuff

// // ON-EARTH START
// // 43.56 N, 41.15 E, 11790 m above sea level
// // const start = new Vector3D(-3482814, 4398475.5, 3043608.75).mul(1.0000)//.mul(0.998423)//.negate()
// // // new Vector3D(-3482814, 4398475.5, 3043608.75).mul(0.998423).negate(),
// const startpos = new Vector3D(-3482814, 4398475.5, 3043608.75).mul(1.016614)//.mul(1.016612)
// const startvel = new Vector3D(-19, 3, 1.2);
// // const startRootGravCels = [Earth];
// const startOrbiting = Earth;
// // ON-EARTH END

// // // SOLAR SYSTEM START
// // const startpos = new Vector3D(0, 0, -1e7);
// // const startvel = Earth.trajectory.start.velocity.mul(.08) // new Vector3D(920, 300, 100);
// const startRootGravCels = [Sun];
// // const startOrbiting = Moon;
// // // SOLAR SYSTEM END

// // Rocketship Setup

// const nosecone = CraftPart.make("Probe Nosecone");
// const fueltank = CraftPart.make("Fuel Tank");
// const rocketengine = CraftPart.make("Rocket Engine");

// const rocketship = new PhysicsCelestial(
//     "Rocketship",
//     startpos,
//     startvel,
//     Chrono.zero, startRootGravCels,
//     new Craft(
//         nosecone.addChild(
//             nosecone.getConnectionPoint("Bottom"),
//             fueltank.getConnectionPoint("Top"),
//             fueltank.addChild(
//                 fueltank.getConnectionPoint("Bottom"),
//                 rocketengine.getConnectionPoint("Top"),
//                 rocketengine
//             )
//         )
//     ),
//     startOrbiting
// );

// const weldfolder = new Instance("Folder");
// weldfolder.Name = "Welds";
// rocketship.flyingObject.allParts().map(p => p.getChildWelds()).reduce((a,c) => [...a, ...c])
//     .forEach(weld => {
//         weld.Parent = weldfolder;
//     }
// );

// const rocketfolder = new Instance("Folder");
// rocketfolder.Name = "Rocketship";
// for (const model of [nosecone.model, fueltank.model, rocketengine.model])
//     model.Parent = rocketfolder;

// weldfolder.Parent = rocketfolder;
// rocketfolder.Parent = game.Workspace;

// // Final universe setup

// const universe = new UniverseInstance(Chrono.zero, startRootGravCels, [rocketship]);

// /*
//  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
// =========================================================== View Setup ===========================================================
//  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
//   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// */

// print("instantiate View")

// const viewInstantiateStartTime = os.clock();
// // ON-EARTH
// let scale = 1;
// let view: View = new WorldView(
//     universe, Earth, startpos,
//     scale, startpos.negate()
// );
// // ON-EARTH END
// // // SOLAR SYSTEM
// // let scale = 1 / Earth.radius;//1 / Mercury.radius;//1 / 500_000_000;
// // const view: AstronomicalView = new AstronomicalView(
// //     universe, 360, undefined,
// //     scale,
// //     Earth.calculateState(universe.time).physics.getKinematic().absolutePosition().negate()
// // );
// // // SOLAR SYSTEM END
// print(`	fin @ ${os.clock() - viewInstantiateStartTime} seconds`)

// print("parent View folder to Workspace")
// const viewFolderParentStartTime = os.clock();
// view.viewFolder.Parent = game.Workspace; // TODO: Test inserting before vs after view.draw()
// print(`	fin @ ${os.clock() - viewFolderParentStartTime} seconds`)

// // final rendering preparations

// const timeWarpMultiplier = 1//200//20_000;
// let camera = new ViewCamera(nosecone.model.PrimaryPart!);
// universe.preSimulation(0); // Needed?
// rocketship.setPhysicsMode("physics");

// print("view.draw()")
// const worldViewDrawCallStartTime = os.clock();
// view.draw();
// print(`	fin @ ${os.clock() - worldViewDrawCallStartTime} seconds`)

// print(`== fin @ ${os.clock() - setupStartTime} seconds ==`)

// /*
//  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
// ========================================================= Rendering Loop =========================================================
//  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
//   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// */

// // Render loop testing
// camera.setNormal(Vector3.yAxis);
// RunService.BindToRenderStep("After Camera",
//     Enum.RenderPriority.Character.Value + 1,
//     dt => camera.update(dt)
// );

// function switchView(to: "astronomical" | "world", physicsMode: "rails" | "physics") {
//     view.destroy();

//     if (to === "astronomical") {
//         view = new AstronomicalView(
//             universe, undefined,
//             scale=1 / Earth.radius * 1e2,
//             Earth.state.kinematics.absolutePosition().negate()
//         );
//     } else {
//         view = new WorldView(
//             universe, Earth,
//             rocketship.state.position,
//             scale=1,
//             rocketship.state.position.negate()
//         );
//     }

//     view.viewFolder.Parent = game.Workspace;
//     rocketship.setPhysicsMode(physicsMode);

//     let subject: BasePart;
//     if (to === "astronomical") subject = view.viewFolder.QueryDescendants("#Crafts >> Part")[0] as BasePart;
//     else subject = nosecone.model.PrimaryPart!;
//     camera = new ViewCamera(subject);
//     assert(camera.camera.CameraSubject === subject, subject.Name)

//     RunService.UnbindFromRenderStep("After Camera");
//     RunService.BindToRenderStep("After Camera",
//         Enum.RenderPriority.Character.Value + 1,
//         dt => camera.update(dt)
//     );

//     if (to === "astronomical") camera.setNormal(Vector3.yAxis);
//     else camera.setNormal(rocketship.state.position);
// }

// const startTime = os.clock();

// let viewSwitched1 = false;
// let timedout1 = false;
// let viewSwitched2 = false;
// let timedout2 = false;
// let viewSwitched3 = false;
// let timedout3 = false;

// /*
// TODO
// # TerrainDisplay
// - A better Level Of Detail system
//   * No rotating the tetrahedron
//   * First increase depth to a preliminary probe depth (an arbitrary constant)
//   * Increase depth of each tetra to the depth of the closest point on its calculated great triangle to the render position
//     * (This will be max depth if render position is within the great triangle)
//   * Then decrease depth as much as possible to meet LOD threshold
// - Automatic terrain redraw events based on craft position
//   * Planet tetrahedron rotated to be centered under renderPosition; vertex positions will be inconsistent after redraws
// # CompositeTrajectoryDisplay
// - Convert time ranges to something better before drawing to remove unclosed/overlapping loops
// - Add continuous draw functionality for physics mode
// - Perhaps start the trajectory from an arbitrary constant position and prune all attachments outside range?
// */

// RunService.PreSimulation.Connect((deltaTime: number) => {
//     debug.profilebegin("Render + Physics loop");
//     const now = os.clock();

//     // PHYSICS
//     if (!timedout1) camera.setNormal(rocketship.state.position);
//     universe.preSimulation(deltaTime * timeWarpMultiplier);
//     // PHYSICS END

//     // // VIEW SWITCH
//     // timedout1 = now - startTime > 10;
//     // timedout2 = now - startTime > 20;
//     // timedout3 = now - startTime > 30;

//     // if (timedout1 && !viewSwitched1) {
//     //     switchView("astronomical", "rails");
//     //     viewSwitched1 = true;
//     //     print("view switched to AstronomicalView")
//     // }

//     // if (timedout2 && !viewSwitched2) {
//     //     switchView("world", "physics");
//     //     viewSwitched2 = true;
//     //     print("view switched to WorldView")
//     // }

//     // if (timedout3 && !viewSwitched3) {
//     //     switchView("astronomical", "physics");
//     //     viewSwitched3 = true;
//     //     print("view switched to AstronomicalView")
//     // }
//     // // VIEW SWITCH END

//     // DRAW
//         view.draw(
//             scale,
//             undefined/* rocketship.state.position.negate() */,
//             // // Continuous (0,0)'ing
//             // satellite.trajectory.calculateStateFromTime(universe.globalTime)
//             //     .getKinematic().getAbsolutePosition().negate(),
//             universe.time
//         );
//     // DRAW END

//     debug.profileend();
// });

// // // RESOURCE MANAGEMENT debug helper functions
// // function printResources(cont: Container) {
// //     let result = "Container: ";
// //     for (let i = 0; i < cont.state.resource.length; i++) {
// //         const resource = cont.state.resource.types[i];
// //         result += `\t${resource}: ${cont.state.resources[i]} ${RESOURCES[resource].units}`
// //     }
// //     return result;
// // }
// // function printFlow(f: Flow) {
// //     let result = "Flow: ";
// //     for (let i = 0; i < f.state.resource.length; i++) {
// //         const resource = f.state.resource.types[i];
// //         result += `\t${resource}: ${f.state.flow[i]} ${RESOURCES[resource].units}`
// //     }
// //     return result;
// // }
// // // RESOURCE MANAGEMENT debug helpers END

// // // PHYSICS PIPELINE visualization debug
// // const rp = rocketship._testpart(
// //     "RobloxPhysics", new BrickColor("Really red").Color, new Vector3D(.25,.5,2),
// //     Vector3D.zero, game.Workspace
// // );
// // const cp = rocketship._testpart(
// //     "CelestPhysics", new BrickColor("Bright purple").Color, new Vector3D(.5,.25,2),
// //     Vector3D.zero, game.Workspace
// // );
// // const d1p = rocketship._testpart(
// //     "DiffCalced", new BrickColor("Navy blue").Color, new Vector3D(.7,.1,2),
// //     Vector3D.zero, game.Workspace
// // );
// // // PHYSICS PIPELINE visualization debug END

// RunService.PostSimulation.Connect((deltaTimeSim: number) => {
//     universe.postSimulation();

// // if (os.time() - startTime > 10)
// // nosecone.rigidBodies[0].part.Position = rocketship.state.position.add(startpos.negate()).mul(scale).toVector3()

// // // RESOURCE MANAGEMENT debug
// // print(printResources(rocketship.flyingObject.primaryPart.connections[0].part.state.container!))
// // print(printResources(rocketship.flyingObject.primaryPart.state.container!))
// // print(printFlow(rocketship.flyingObject.primaryPart.connections[0].part.connections[0].part.state.flows[0]))
// // // RESOURCE MANAGEMENT debug END

// // // PHYSICS PIPELINE visualization debug
// // // satellite roblox velocity
// // const rpV = nosecone.rigidBodies[0].part.AssemblyLinearVelocity
// // rp.CFrame = CFrame.lookAlong(nosecone.rigidBodies[0].part.Position.add(rpV.Unit.mul(3 + rpV.Magnitude % 3)), rpV)
// // // sattelite orbital mechanics velocity
// // const cpV = rocketship.state.velocity.toVector3()
// // cp.CFrame = CFrame.lookAlong(nosecone.rigidBodies[0].part.Position.add(cpV.Unit.mul(3 + cpV.Magnitude % 3)), cpV)
// // // error of orbital mechanics
// // const d1pV = rpV.sub(cpV)
// // d1p.CFrame = CFrame.lookAlong(nosecone.rigidBodies[0].part.Position.add(d1pV.Unit.mul(3 + d1pV.Magnitude % 3)), d1pV)
// // // PHYSICS PIPELINE visualization debug END

// });

// import KinematicState from "shared/Modules/BaseModule/Relative/State/KinematicState";
// import TemporalState from "shared/Modules/BaseModule/Relative/State/TemporalState";
// import KinematicTemporalState from "shared/Modules/BaseModule/Relative/State/KinematicTemporalState";
// import GravityCelestial from "shared/Modules/BaseModule/Relative/Celestial/GravityCelestial";
// import PhysicsCelestial from "shared/Modules/BaseModule/Relative/Celestial/PhysicsCelestial";
// // import GravityOrbitalState from "shared/Modules/BaseModule/CelestialState/OrbitalState/GravityOrbitalState";
// // import GravityLinearState from "shared/Modules/BaseModule/CelestialState/LinearState/GravityLinearState";
// import Vector3D from "shared/Modules/Libraries/Vector3D";
// // import * as Globals from "shared/Globals";
// import * as Constants from "shared/Constants";
// import OrbitalTrajectory from "shared/Modules/BaseModule/Trajectory/OrbitalTrajectory";

// // Helper methods to make parts that represent Celestials

// function makeRootPartFor(name: string, radius: number, color: BrickColor): Part {
//     const part: Part = new Instance("Part");
// 	part.Name = name;
// 	part.Shape = Enum.PartType.Ball;
// 	part.Size = Vector3.one.mul(radius * Globals.solarSystemScale);
// 	part.Anchored = true;
// 	part.Material = Enum.Material.Neon;
// 	part.BrickColor = color;
// 	part.Position = Earth.trajectory.initialPosition.kinematicPosition.getAbsolutePosition().toVector3();
//     if (!game.Workspace.QueryDescendants("Folder").some((inst: Instance) => inst.Name === "Planets")) {
//         const planetsFolder: Folder = new Instance("Folder");
// 		planetsFolder.Name = "Planets"
//         planetsFolder.Parent = game.Workspace;
//     }
// 	part.Parent = game.Workspace.WaitForChild("Planets");

//     return part;
// }

// function makeSOIFor(parentPart: Part, parentGravityBody: GravityCelestial): Part {
// 	const SOI: Part = new Instance("Part");
// 	SOI.Shape = Enum.PartType.Ball;
// 	SOI.BrickColor = new BrickColor("Steel blue");
// 	SOI.CanCollide = false;
// 	SOI.Anchored = false;
// 	SOI.Transparency = 0.8;
// 	SOI.Material = Enum.Material.ForceField;

// 	SOI.Name = parentPart.Name + "SOI";
// 	SOI.Size = Vector3D.one.mul(parentGravityBody.SOIRadius * 2 * Globals.solarSystemScale).toVector3();
// 	SOI.Position = parentPart.Position;
// 	SOI.Parent = parentPart;

// 	const w1: WeldConstraint = new Instance("WeldConstraint");
// 	w1.Part0 = SOI;
// 	w1.Part1 = parentPart;
// 	w1.Parent = w1.Part0;

//     return SOI
// }

// // Initialize Celestials

// // let Earth = new GravityCelestial(
// // 	new Vector3D(-2.344796397128329E+10, -1.638736262440681E+07, 1.452213061233350E+11),
// // 	Vector3D.zero,// new Vector3D(-2.989434743673573E+04, 9.000105203986752E-01, -4.853641762746061E+03),
// // 	5.97219e24
// // )
// // let Moon = new GravityCelestial(
// // 	new Vector3D(-3.205398330266103E+08, 3.658599781326822E+07, -2.380401614217560E+08),
// // 	new Vector3D(5.511228197116279E+02, -1.568395408118706E+00, -8.066150606766933E+02),
// // 	7.349e22,
// // 	Earth
// // )

// const Earth = new GravityCelestial(
// 	new Vector3D(0, 0, 0),
// 	Vector3D.zero,
// 	5.972168e24
// )
// const Moon = new GravityCelestial(
// 	new Vector3D(0, 36_372_000, -403_964_992),
// 	new Vector3D(-967,0,0),
// 	7.349e22,
// 	Earth
// )
// print(Moon.state)

// // set up the parts

// const EarthPart: Part = makeRootPartFor("Earth", 6371.01e3, new BrickColor("Steel blue"));
// makeSOIFor(EarthPart, Earth);
// const MoonPart: Part = makeRootPartFor("Moon", 1737.53e3, new BrickColor("Dark stone grey"));
// makeSOIFor(MoonPart, Earth);

// // TODO: Transfer all of the magic math and variables in OrbitalState to OrbitalTrajectory?
// // ...Or maybe transfer it to a library?
// // TODO: Make an Obsidian diagram of all this program flow logic architecture stuff

// // print(
// 	// Moon.updateState(new TemporalState(0)).kinematicPosition.kinematicState.getAbsolutePosition()
// // )
// // print(
// 	// Moon.updateState(new TemporalState(100000)).kinematicPosition.kinematicState.getAbsolutePosition()
// // )
// let OrbitLineResolution: number = 800
// let period = (Moon.trajectory as OrbitalTrajectory).period
// Moon.trajectory.displayTrajectory(period / (OrbitLineResolution - 1), OrbitLineResolution, 1).Parent = game.Workspace.WaitForChild("Orbits")
// print("fin")

// let time: TemporalState = new TemporalState(0);
// // const START = os.clock()
// // for (let loop = 0; loop < 10; loop++) {
// 	// const deltaTime = os.clock() - START
// game.GetService("RunService").PreSimulation.Connect((deltaTime: number) => {
// 	// print("deltaTime: " + deltaTime);
// 	print("universe time: " + time.relativeTime);
// 	// print("Earth pos: " + Earth.state.kinematicPosition.kinematicState.getAbsolutePosition());
// 	print("Moon pos: " + Moon.state.kinematicPosition.kinematicState.getAbsolutePosition());
// 	// print("Moon: ", Moon.state);
// 	Earth.updateState(time);
// 	EarthPart.Position = Earth.state.kinematicPosition.kinematicState.getAbsolutePosition().toVector3().mul(Globals.solarSystemScale);
// 	Moon.updateState(time);
// 	MoonPart.Position = Moon.state.kinematicPosition.kinematicState.getAbsolutePosition().toVector3().mul(Globals.solarSystemScale);

// 	time = time.withIncrementTime(deltaTime ^ 50);
// 	// if (time.relativeTime > .6) error("fin")
// });
// // }

// // print("main.server.ts fin @ " + (os.clock() - START));

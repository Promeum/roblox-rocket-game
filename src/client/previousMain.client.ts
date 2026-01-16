// import KinematicTemporalState from "shared/Modules/BaseModule/KinematicTemporalState";
// import GravityCelestial from "shared/Modules/BaseModule/Relative/Celestial/GravityCelestial";
// import PhysicsCelestial from "shared/Modules/BaseModule/Relative/Celestial/PhysicsCelestial";
// import KinematicState from "shared/Modules/BaseModule/Relative/State/KinematicState";
// import TemporalState from "shared/Modules/BaseModule/Relative/State/TemporalState";
// import Vector3D from "shared/Modules/Libraries/Vector3D";

// print("main.client.ts");

// print("Solar System")

// /*
// 	TODO:
// 	First get the lune workflow in order!!

// 	Clean up the inheritance tree to reduce mess and tidy up spilled spaghetti code
	
// 	Proposal for new inheritance tree:
// 	BaseModule
// 	- State (maybe?) (what would this do other than just being a parent) {Basically an Interface} [new]
// 		- OrientationState (maybe?) (very scary math aaaa) [new]
// 		- KinematicState (velocity and position, with means for inputting acceleration) [MovingObject]
// 		- TemporalState (time) [TemporalPosition]
// 		- KinematicTemporalState (KinematicState + TemporalState) [SolarSystemObject]
// 			* Do I need to define a class for all (or just some) of the composite states
// 			* or is just one general CompositeState class enough?
// 	- Trajectory (maybe?) (what would this do other than just being a parent) {Basically an Interface} [new]
// 		- LinearTrajectory
// 		- OrbitalTrajectory
// 		- TrajectoryHolder [TrajectoryHolderObject]
// 		- TrajectoryWrapper (maybe?) (is this middleman class really necessary?) [TrajectoryObject]
// 	- Celestial (maybe?) (worth making this class for the inheritance tree and relative GravityBody?) [a bit of SolarSystemObject; mostly new]
// 		- GravityBody
// 		- PhysicsBody (Need to account for development roadmap [adding actual rocket objects to the game])
// */

// /*

// Notes
// Source for positions and velocities of bodies
// https://ssd.jpl.nasa.gov/horizons/app.html#/

// */


// // initialize Planets
// // All statistics from Wikipedia
// let Sun = new GravityCelestial(
// 	new KinematicTemporalState(
//         new KinematicState(
//             new Vector3D(0, 0, 0),
//             new Vector3D(0, 0, 0),
//         ),
//         new TemporalState(0)
//     ),
// 	new Instance("Part"),
// 	1.9885e30,
// 	1.5e12
// )
// let Mercury = new GravityCelestial(
// 	new KinematicTemporalState(
//         new KinematicState(
//             new Vector3D(-2.185835358441481E+10, -3.485005094346408E+09, -6.614625011845423E+10),
//             new Vector3D(3.650093369107909E+04, -4.367018609323549E+03, -1.273461833585731E+04),
//         ),
//         new TemporalState(0)
//     ),
// 	new Instance("Part"),
// 	3.302e23,
// 	1e8,
// 	Sun
// )
// let Venus = new GravityCelestial(
// 	new KinematicTemporalState(
//         new KinematicState(
//             new Vector3D(-1.075385106364918E+11, 6.160527557804195E+09, -2.057163683439167E+09),
//             new Vector3D(4.611733871187763E+02, -5.279208622663791E+02, -3.516748102702129E+04),
//         ),
//         new TemporalState(0)
//     ),
// 	new Instance("Part"),
// 	48.685e23,
// 	1.2e9,
// 	Sun
// )
// let Earth = new GravityCelestial(
// 	new KinematicTemporalState(
//         new KinematicState(
//             new Vector3D(-2.344796397128329E+10, -1.638736262440681E+07, 1.452213061233350E+11),
//             new Vector3D(-2.989434743673573E+04, 9.000105203986752E-01, -4.853641762746061E+03),
//         ),
//         new TemporalState(0)
//     ),
// 	new Instance("Part"),
// 	5.97219e24,
// 	1.5e9,
// 	Sun
// )
// let Mars = new GravityCelestial(
// 	new KinematicTemporalState(
//         new KinematicState(
//             new Vector3D(2.079413286219068E+11, -5.180248494584806E+09, -5.677471461403446E+09),
//             new Vector3D(1.615287420127653E+03, 5.160202387037263E+02, 2.627674229888704E+04),
//         ),
//         new TemporalState(0)
//     ),
// 	new Instance("Part"),
// 	6.4171e23,
// 	2.4e8,
// 	Sun
// )
// let Moon = new GravityCelestial(
// 	new KinematicTemporalState(
//         new KinematicState(
//             new Vector3D(-3.205398330266103E+08, 3.658599781326822E+07, -2.380401614217560E+08),
//             new Vector3D(5.511228197116279E+02, -1.568395408118706E+00, -8.066150606766933E+02),
//         ),
//         new TemporalState(0)
//     ),
// 	new Instance("Part"),
// 	7.349e22,
// 	66e6,
// 	Earth
// )
// // let Satellite = SolarSystemPhysicsBody.new(
// // 	new Vector3D(0, 0, 1e7),
// // 	new Vector3D(-1010, 0, 0),
// // 	new Instance("Part"),
// // 	Moon
// // )
// let Satellite = new PhysicsCelestial(
// 	new KinematicTemporalState(
//         new KinematicState(
//             new Vector3D(0, 0, 1e7),
//             new Vector3D(-1010, 0, 0),
//         ),
//         new TemporalState(0)
//     ),
// 	new Instance("Part"),
// 	Moon
// )

// let rootGravityBodies: GravityCelestial[] = {
// 	Sun,
// }

// // set up the RootParts
// function void makeRootPartFor(GBody: GravityCelestial, name: string, radius: number, color: BrickColor) {
// 	GBody.RootPart.Name = name
// 	GBody.RootPart.Shape = Enum.PartType.Ball
// 	GBody.RootPart.Size = Vector3.one * (radius * Globals.solarSystemScale)
// 	GBody.RootPart.Anchored = true
// 	GBody.RootPart.Material = Enum.Material.Neon
// 	GBody.RootPart.BrickColor = color
// 	GBody.RootPart.Position = GBody:CalculateWorkspacePosition():ToVector3()
// 	GBody.RootPart.Parent = workspace.Planets
// }

// makeRootPartFor(Sun, "Sun", 695700e3, BrickColor.new("Pastel brown"));
// makeRootPartFor(Mercury, "Mercury", 2439.4e3, BrickColor.new("Smoky grey"));
// makeRootPartFor(Venus, "Venus", 6051.84e3, BrickColor.new("Bronze"));
// makeRootPartFor(Mars, "Mars", 3389.92e3, BrickColor.new("Br. reddish orange"));
// makeRootPartFor(Earth, "Earth", 6371.01e3, BrickColor.new("Steel blue"));
// makeRootPartFor(Moon, "Moon", 1737.53e3, BrickColor.new("Dark stone grey"));

// Satellite.RootPart.Name = "Satellite"
// Satellite.RootPart.Size = Vector3.new(1, 4, 1.5) * (5e6 * Globals.solarSystemScale)
// Satellite.RootPart.Anchored = true
// Satellite.RootPart.Material = Enum.Material.Neon
// Satellite.RootPart.BrickColor = BrickColor.new("Bright yellow")
// Satellite.RootPart.Position = Satellite:CalculateWorkspacePosition():ToVector3()
// Satellite.RootPart.Parent = workspace.Planets

// let function makeSOIFor(GBody: Modules.GravityBody)
// 	let SOI = new Instance("Part")
// 	SOI.Shape = Enum.PartType.Ball
// 	SOI.BrickColor = BrickColor.new("Steel blue")
// 	SOI.CanCollide = false
// 	SOI.Anchored = false
// 	SOI.Transparency = 0.8
// 	SOI.Material = Enum.Material.ForceField

// 	SOI.Name = GBody.RootPart.Name .. "SOI"
// 	SOI.Size = (Vector3D.one * GBody.SOIRadius * 2 * Globals.solarSystemScale):ToVector3()
// 	SOI.Position = GBody.RootPart.Position
// 	SOI.Parent = GBody.RootPart

// 	let w1: WeldConstraint = new Instance("WeldConstraint")
// 	w1.Part0 = SOI
// 	w1.Part1 = GBody.RootPart
// 	w1.Parent = w1.Part0
// end

// makeSOIFor(Sun)
// makeSOIFor(Mercury)
// makeSOIFor(Venus)
// makeSOIFor(Mars)
// makeSOIFor(Earth)
// makeSOIFor(Moon)

// let OrbitLineResolution: number = 20

// Mercury.Trajectory:DisplayTrajectory(Mercury.Trajectory.Orbit:OrbitalPeriod() / OrbitLineResolution, OrbitLineResolution)
// Venus.Trajectory:DisplayTrajectory(Venus.Trajectory.Orbit:OrbitalPeriod() / OrbitLineResolution, OrbitLineResolution)
// Earth.Trajectory:DisplayTrajectory(Earth.Trajectory.Orbit:OrbitalPeriod() / OrbitLineResolution, OrbitLineResolution)
// Mars.Trajectory:DisplayTrajectory(Mars.Trajectory.Orbit:OrbitalPeriod() / OrbitLineResolution, OrbitLineResolution)
// Moon.Trajectory:DisplayTrajectory(Moon.Trajectory.Orbit:OrbitalPeriod() / OrbitLineResolution, OrbitLineResolution)
// let SatTraj = Satellite.TrajectoryHolder:DisplayTrajectory(OrbitLineResolution)

// print("trajectories finished")

// let timePassed = 0
// let timeWarpMultiplier = 9000

// let data = {}
// let prevData = Moon.Position

// let player = game:GetService("Players").LocalPlayer
// let Frame = player.PlayerGui:WaitForChild("ScreenGui").Frame
// let lastXms = Frame:GetAttribute("msX")
// let lastYms = Frame:GetAttribute("msY")
// let lastZms = Frame:GetAttribute("msZ")

// RunService.PreSimulation:Connect(function()
// 	let newXms = Frame:GetAttribute("msX")
// 	let newYms = Frame:GetAttribute("msY")
// 	let newZms = Frame:GetAttribute("msZ")
// 	if lastXms ~= newXms or lastYms ~= newYms or lastZms ~= newZms then
// 		SatTraj:Destroy()
// 		Satellite = SolarSystemPhysicsBody.new(
// 			new Vector3D(0, 0, 1e7),
// 			new Vector3D(newXms, newYms, newZms),
// 			Satellite.RootPart,
// 			Moon
// 		)
// 		SatTraj = Satellite.TrajectoryHolder:DisplayTrajectory(OrbitLineResolution)
// 		lastXms = newXms
// 		lastYms = newYms
// 		lastZms = newZms
// 	end
// end)

// Moon:Update(1)

// // run with physics loop
// // RunService.PreSimulation:Connect(function(deltaTime)
// // 	let scaledTimePassed: number = timePassed * timeWarpMultiplier
// // 	// print(timePassed)

// // 	// print("Mercury")
// // 	Mercury:Update(scaledTimePassed)
// // 	// print("Venus")
// // 	Venus:Update(scaledTimePassed)
// // 	// print("Earth")
// // 	Earth:Update(scaledTimePassed)
// // 	// print("Mars")
// // 	Mars:Update(scaledTimePassed)
// // 	// print("Moon")
// // 	Moon:Update(scaledTimePassed)
// // 	// print("Satellite")
// // 	Satellite:Update(scaledTimePassed)

// // 	// for v in allGravityBodies do
// // 	// 	v:Update(scaledTimePassed)
// // 	// end
// // 	timePassed += deltaTime

// // 	// let newData = Moon.Trajectory:CalculatePointFromTime(scaledTimePassed).Position
// // 	// data[#data + 1] = "(" .. table.concat(
// // 	// 	{
// // 	// 		timePassed,
// // 	// 		(newData - prevData):Magnitude()
// // 	// 	},",") .. ")"
// // 	// prevData = newData
// // 	// if timePassed > 4 then
// // 	// 	error(`[{table.concat(data,",")}]`)
// // 	// end
// // end)

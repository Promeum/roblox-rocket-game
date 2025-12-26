import KinematicState from "shared/Modules/BaseModule/Relative/State/KinematicState";
import TemporalState from "shared/Modules/BaseModule/Relative/State/TemporalState";
import KinematicTemporalState from "shared/Modules/BaseModule/Relative/State/KinematicTemporalState";
import GravityCelestial from "shared/Modules/BaseModule/Relative/Celestial/GravityCelestial";
import PhysicsCelestial from "shared/Modules/BaseModule/Relative/Celestial/PhysicsCelestial";
// import GravityOrbitalState from "shared/Modules/BaseModule/CelestialState/OrbitalState/GravityOrbitalState";
// import GravityLinearState from "shared/Modules/BaseModule/CelestialState/LinearState/GravityLinearState";
import Vector3D from "shared/Modules/Libraries/Vector3D";
import * as Globals from "shared/Globals";
import * as Constants from "shared/Constants";
import OrbitalTrajectory from "shared/Modules/BaseModule/Trajectory/OrbitalTrajectory";

// Helper methods to make parts that represent Celestials

function makeRootPartFor(name: string, radius: number, color: BrickColor): Part {
	const part: Part = new Instance("Part");
	part.Name = name;
	part.Shape = Enum.PartType.Ball;
	part.Size = Vector3.one.mul(radius * Constants.SOLAR_SYSTEM_SCALE);
	part.Anchored = true;
	part.Material = Enum.Material.Neon;
	part.BrickColor = color;
	part.Position = Earth.trajectory.initialPosition.kinematicPosition.getAbsolutePosition().toVector3();
	if (!game.Workspace.QueryDescendants("Folder").some((inst: Instance) => inst.Name === "Planets")) {
		const planetsFolder: Folder = new Instance("Folder");
		planetsFolder.Name = "Planets"
		planetsFolder.Parent = game.Workspace;
	}
	part.Parent = game.Workspace.WaitForChild("Planets");

	return part;
}

function makeSOIFor(parentPart: Part, parentGravityCelestial: GravityCelestial): Part {
	const SOI: Part = new Instance("Part");
	SOI.Shape = Enum.PartType.Ball;
	SOI.BrickColor = new BrickColor("Steel blue");
	SOI.CanCollide = false;
	SOI.Anchored = false;
	SOI.Transparency = 0.8;
	SOI.Material = Enum.Material.ForceField;

	SOI.Name = parentPart.Name + "SOI";
	SOI.Size = Vector3D.one.mul(parentGravityCelestial.SOIRadius * 2 * Constants.SOLAR_SYSTEM_SCALE).toVector3();
	SOI.Position = parentPart.Position;

	const w1: WeldConstraint = new Instance("WeldConstraint");
	w1.Part0 = SOI;
	w1.Part1 = parentPart;
	w1.Parent = SOI;

	SOI.Parent = parentPart;

	return SOI
}

// Initialize Celestials

const Earth = new GravityCelestial(
	Vector3D.zero, // new Vector3D(-2.344796397128329E+10, -1.638736262440681E+07, 1.452213061233350E+11),
	Vector3D.zero, // new Vector3D(-2.989434743673573E+04, 9.000105203986752E-01, -4.853641762746061E+03),
	undefined,
	5.97219e24
);
const Moon = new GravityCelestial(
	new Vector3D(-3.205398330266103E+08, 3.658599781326822E+07, -2.380401614217560E+08),
	new Vector3D(5.511228197116279E+02, -1.568395408118706E+00, -8.066150606766933E+02),
	undefined,
	7.349e22,
	Earth
);

// const Earth = new GravityCelestial(
// 	new Vector3D(0, 0, 0),
// 	Vector3D.zero,
// 	undefined,
// 	5.972168e24
// )
// const Moon = new GravityCelestial(
// 	new Vector3D(0, 36_372_000, -403_964_992),
// 	new Vector3D(-967,0,0),
// 	undefined,
// 	7.349e22,
// 	Earth
// )
print("moon state")
print(Moon.state)

// set up the planets

const EarthPart: Part = makeRootPartFor("Earth", 6371.01e3, new BrickColor("Steel blue"));
const EarthSOI = makeSOIFor(EarthPart, Earth);
const MoonPart: Part = makeRootPartFor("Moon", 1737.53e3, new BrickColor("Dark stone grey"));
const MoonSOI = makeSOIFor(MoonPart, Moon);

// set up the trajectories

const OrbitLineResolution: number = 380
const moonPeriod = (Moon.trajectory as OrbitalTrajectory).period
warn("moon trajectory")
Moon.trajectory.displayTrajectory(moonPeriod / OrbitLineResolution, OrbitLineResolution, 1);

print("moon trajectory finished");

// set up satellite stuff

const player: Player = game.GetService("Players").LocalPlayer;
const satellitePart: Part = makeRootPartFor("Satellite", 1e6, BrickColor.Yellow());
let satellite = new PhysicsCelestial(
	new Vector3D(0, 0, 1e7),
	new Vector3D(100, 0, 0),
	undefined,
	Moon
);
Moon._testpart(
	"real start of moon",
	new BrickColor("Brick yellow").Color,
	0.4,
	Moon.state.kinematicPosition.getAbsolutePosition(),
	game.Workspace
)
satellite._testpart(
	"real start of satellite",
	new BrickColor("Brick yellow").Color,
	0.4,
	satellite.state.kinematicPosition.getAbsolutePosition(),
	game.Workspace
)
let trajectoryDisplayDuration = 1e6;
let sTrajectory!: Folder;// = satellite.trajectory.displayTrajectory(trajectoryDisplayDuration / (OrbitLineResolution - 1), OrbitLineResolution, 1);
// sTrajectory.Parent = game.Workspace.WaitForChild("Orbits");

const Frame = player.WaitForChild("PlayerGui").WaitForChild("ScreenGui").WaitForChild("Frame");
let lastdVX = -1;
let lastdVY = -1;
let lastdVZ = -1;
let lastTimeRange = -1;

// run with physics loop

let scaledTimePassed: TemporalState = new TemporalState(0);
const timeWarpMultiplier = 9000+9000;

function updateUniverseState(scaledTimePassed: TemporalState) {
	// print(scaledTimePassed.relativeTime)
	// print("Earth")
	// Earth.updateState(scaledTimePassed);
	// EarthPart.Position = Earth.state.kinematicPosition.kinematicState.getAbsolutePosition().toVector3().mul(Constants.SOLAR_SYSTEM_SCALE);
	// EarthSOI.Position = EarthPart.Position;
	// print("Moon")
	Moon.updateState(scaledTimePassed);
	MoonPart.Position = Moon.state.kinematicPosition.kinematicState.getAbsolutePosition().toVector3().mul(Constants.SOLAR_SYSTEM_SCALE);
	MoonSOI.Position = MoonPart.Position;
	// print("Satellite")
	satellite.updateState(scaledTimePassed);
	satellitePart.Position = satellite.state.kinematicPosition.getPosition()
		.add(satellite.orbiting?.state.kinematicPosition.getPosition() ?? Vector3D.zero).toVector3().mul(Constants.SOLAR_SYSTEM_SCALE);
	// (sTrajectory.WaitForChild("Attachments") as Part).Position = MoonPart.Position;
	// print(satellite.orbiting?.mass)
}

// main game loop

updateUniverseState(scaledTimePassed);

let displayTrajectoryTask: thread | undefined;
game.GetService("RunService").PreSimulation.Connect((deltaTime: number) => {
	const newdVX = Frame.GetAttribute("dVX") as number;
	const newdVY = Frame.GetAttribute("dVY") as number;
	const newdVZ = Frame.GetAttribute("dVZ") as number;
	trajectoryDisplayDuration = Frame.GetAttribute("timeRange") as number;
	if (lastdVX !== newdVX || lastdVY !== newdVY || lastdVZ !== newdVZ || lastTimeRange !== trajectoryDisplayDuration) {
		// redo trajectory lines
		if (sTrajectory) sTrajectory.Destroy();

		if (lastdVX !== newdVX || lastdVY !== newdVY || lastdVZ !== newdVZ) {
			satellite = new PhysicsCelestial(
				new Vector3D(0, 0, 1e7),
				new Vector3D(newdVX, newdVY, newdVZ),
				Globals.globalTime,
				Moon
			);
		}
		if (displayTrajectoryTask) task.cancel(displayTrajectoryTask);
		displayTrajectoryTask = task.defer(() => {
			sTrajectory = satellite.trajectory.displayTrajectory(trajectoryDisplayDuration / OrbitLineResolution, OrbitLineResolution, 1);
		});

		lastdVX = newdVX;
		lastdVY = newdVY;
		lastdVZ = newdVZ;
		lastTimeRange = trajectoryDisplayDuration;
	}

	if (Frame.GetAttribute("timeRunning") as boolean) {
		scaledTimePassed = scaledTimePassed.withIncrementTime(deltaTime * timeWarpMultiplier);
		updateUniverseState(scaledTimePassed);
	}
})

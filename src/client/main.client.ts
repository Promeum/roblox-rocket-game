import Vector3D from "shared/Modules/Libraries/Vector3D";

import TemporalState from "shared/Modules/BaseModule/Relative/State/TemporalState";
import GravityCelestial from "shared/Modules/BaseModule/Celestial/GravityCelestial";
import PhysicsCelestial from "shared/Modules/BaseModule/Celestial/PhysicsCelestial";

// import * as Globals from "shared/Globals";
import UniverseInstance from "shared/Modules/BaseModule/Universe/UniverseInstance";
import AstronomicalView from "shared/Modules/BaseModule/View/AstronomicalView";

// Initialize Celestials

// (Solar System)

const Sun = new GravityCelestial(
	"Sun",
	new Vector3D(0, 0, 0),
	new Vector3D(0, 0, 0),
	new TemporalState(0),
	1.9885e30,
	695700e3,
	new BrickColor("Pastel brown").Color
);
const Mercury = new GravityCelestial(
	"Mercury",
	new Vector3D(-2.185835358441481E+10, -3.485005094346408E+09, -6.614625011845423E+10),
	new Vector3D(3.650093369107909E+04, -4.367018609323549E+03, -1.273461833585731E+04),
	new TemporalState(0),
	3.302e23,
	2439.4e3,
	new BrickColor("Smoky grey").Color,
	Sun
);
const Venus = new GravityCelestial(
	"Venus",
	new Vector3D(-1.075385106364918E+11, 6.160527557804195E+09, -2.057163683439167E+09),
	new Vector3D(4.611733871187763E+02, -5.279208622663791E+02, -3.516748102702129E+04),
	new TemporalState(0),
	48.685e23,
	6051.84e3,
	new BrickColor("Bronze").Color,
	Sun
);
const Earth = new GravityCelestial(
	"Earth",
	new Vector3D(-2.344796397128329E+10, -1.638736262440681E+07, 1.452213061233350E+11),
	new Vector3D(-2.989434743673573E+04, 9.000105203986752E-01, -4.853641762746061E+03),
	new TemporalState(0),
	5.97219e24,
	6371.01e3,
	new BrickColor("Steel blue").Color,
	Sun
);
const Mars = new GravityCelestial(
	"Mars",
	new Vector3D(2.079413286219068E+11, -5.180248494584806E+09, -5.677471461403446E+09),
	// eslint-disable-next-line no-loss-of-precision
	new Vector3D(1.615287420127653E+03, 5.160202387037263E+02, 2.627674229888704E+04),
	new TemporalState(0),
	6.4171e23,
	3389.92e3,
	new BrickColor("Br. reddish orange").Color,
	Sun
);
const Moon = new GravityCelestial(
	"Moon",
	new Vector3D(-3.205398330266103E+08, 3.658599781326822E+07, -2.380401614217560E+08),
	// eslint-disable-next-line no-loss-of-precision
	new Vector3D(5.511228197116279E+02, -1.568395408118706E+00, -8.066150606766933E+02),
	new TemporalState(0),
	7.349e22,
	1737.53e3,
	new BrickColor("Dark stone grey").Color,
	Earth
);

const satellite = new PhysicsCelestial(
	"Satellite",
	new Vector3D(0, 0, -1e7),
	new Vector3D(920, 300, 150), // new Vector3D(920, 300, 100), // moon SOI contact is nearly tangential (SOI entry/exit are very close together)
	new TemporalState(0),[Sun],
	Moon
);

const satPart: Part = new Instance("Part");

satPart.Shape = Enum.PartType.Block;
satPart.Anchored = true;
satPart.Material = Enum.Material.Neon;
satPart.Name = "satPart";
satPart.Color = new BrickColor("Fire Yellow").Color;
satPart.Size = new Vector3(1, 2, 1);

satPart.Parent = game.Workspace;


// Solar system complete

const universe: UniverseInstance = new UniverseInstance(
	new TemporalState(0),
	[Sun],
	[satellite]
);

const startScale = 1 / Earth.radius;//1 / Mercury.radius;//1 / 500_000_000;

// debug.profilebegin("Init Solar System")

const view: AstronomicalView = new AstronomicalView(
	universe, 360, undefined,
	startScale,
	Earth.calculateState(universe.globalTime).trajectoryState.getKinematic().getAbsolutePosition().negate()
);
view.draw();
view.viewFolder.Parent = game.Workspace;

// debug.profileend();

class DisplayAnimation {
	public readonly duration: number;
	
	private readonly transitoryCelestial: GravityCelestial | undefined;
	private readonly transitoryScale: number;
	private readonly targetScale: number;

	private lastScale: number = 0;

	constructor(
		public readonly astronomicalView: AstronomicalView,
		public readonly startTime: TemporalState,
		public readonly endTime: TemporalState,
		public readonly startCelestial: GravityCelestial,
		public readonly endCelestial: GravityCelestial,
		private readonly originalScale: number
	) {
		this.duration = endTime.sub(startTime).relativeTime;
		this.transitoryCelestial = startCelestial.calculateState(startTime)
			.convergenceItem(endCelestial.calculateState(startTime)) as unknown as GravityCelestial | undefined;
		this.transitoryScale = 1 / (this.transitoryCelestial?.radius ?? 5e8);
		this.targetScale = 1 / this.endCelestial.radius;
	}

	/**
	 * Displays a map view transition between different planets
	 */
	public draw(time?: TemporalState): [Vector3D, number] {
		if (!time) time = this.astronomicalView.universe.globalTime;
		const progress = (time.relativeTime - this.startTime.relativeTime) / this.duration;
		let scale = this.lastScale;
		let offset;
		if (progress < 1/3) {
			// print("a")
			scale = interp2(this.originalScale, this.transitoryScale, progress * 3);
			offset = this.startCelestial.calculateState(time)
				.trajectoryState.getKinematic().getAbsolutePosition().negate();
		} else if (progress >= 2/3) {
			// print("c")
			scale = interp2(this.originalScale, this.transitoryScale, (1 - (progress - 2/3) * 3));
			offset = this.endCelestial.calculateState(time)
				.trajectoryState.getKinematic().getAbsolutePosition().negate();
		}
		if (math.clamp(progress, 1/5, 4/5) === progress) {
			// print("b")
			offset = interpVector3D(
				this.startCelestial.calculateState(time)
					.trajectoryState.getKinematic().getAbsolutePosition().negate(),
				this.endCelestial.calculateState(time)
					.trajectoryState.getKinematic().getAbsolutePosition().negate(),
					(progress - 1/5) * (5/3)
			);
		}

		this.astronomicalView.draw(scale, offset, time);
		this.lastScale = scale;
		return [offset!, scale!];
	}
}

function interp1(a: number, b: number, t: number): number {
	return a + (b - a) * t ** (1/30);
}

function interp2(a: number, b: number, t: number): number {
	return a + (b - a) * (
		(math.sin(math.pi * (t - 1/2)) + 1) / 2
	);
}

function interpVector3D(a: Vector3D, b: Vector3D, t: number): Vector3D {
	return new Vector3D(
		interp2(a.X, b.X, t),
		interp2(a.Y, b.Y, t),
		interp2(a.Z, b.Z, t),
	)
}

const anim = new DisplayAnimation(
	view, new TemporalState(100_000),
	new TemporalState(300_000),
	Mercury, Earth, startScale
)



// let p="[" // points to test
// for(let i=0;i<500;i++){
// 	const o=new TemporalState(i*100_000)
// 	p+="("+o.relativeTime+"x,"+(
// 		satellite.trajectory.nextTrajectory().currentTrajectory.calculateStateFromTime(o).getKinematic().getPosition().sub(
// 		Moon.trajectory.calculateStateFromTime(o).getKinematic().getPosition()).magnitude()
// 		- Moon.SOIRadius
// 	)+"),"
// }p+="]"
// print(p.gsub(",]","]")[0])

const timeWarpMultiplier = 200_000//120_000//20_000;

game.GetService("RunService").PreSimulation.Connect((deltaTime: number) => {
	universe.globalTime = universe.globalTime.withIncrementTime(deltaTime * timeWarpMultiplier);
	debug.profilebegin("Draw Solar System")
	// if (math.clamp(universe.globalTime.relativeTime, 100_000, 300_000) !== universe.globalTime.relativeTime) {
	// 	const offset = (
	// 		(universe.globalTime.relativeTime < 200_000) ?
	// 			Mercury.calculateState(universe.globalTime).trajectoryState
	// 				.getKinematic().getAbsolutePosition().negate()
	// 		:
	// 			Earth.calculateState(universe.globalTime).trajectoryState
	// 				.getKinematic().getAbsolutePosition().negate()
	// 	);
		view.draw(
			undefined,
			Earth.calculateState(universe.globalTime).trajectoryState
					.getKinematic().getAbsolutePosition().negate(),// offset,
			universe.globalTime
			// ( // zoom animation testing
			// 	math.sin(universe.globalTime.relativeTime / timeWarpMultiplier / (2 * math.pi) * 4)
			// 	/ 4 + 1
			// ) * scale
		);
satPart.Position = satellite.trajectory.calculateStateFromTime(universe.globalTime)
	.getKinematic().getAbsolutePosition().add(Earth.calculateState(universe.globalTime)
	.trajectoryState.getKinematic().getAbsolutePosition().negate()).mul(startScale).toVector3();

// 	} else {
// 		const offsetAndScale = anim.draw(universe.globalTime);
// satPart.Position = satellite.trajectory.calculateStateFromTime(universe.globalTime)
// 	.getKinematic().getAbsolutePosition().add(offsetAndScale[0]).mul(offsetAndScale[1]).toVector3();
// 	}
	debug.profileend();
});

/*
 =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
======================================================= Old Rendering Loop =======================================================
 = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
*/

// const player: Player = game.GetService("Players").LocalPlayer;
// // const satellitePart: Part = makeRootPartFor("Satellite", 1e6, BrickColor.Yellow());
// // Moon._testpart(
// // 	"real start of moon",
// // 	new BrickColor("Brick yellow").Color,
// // 	0.4,
// // 	Moon.state.getKinematic().getAbsolutePosition(),
// // 	game.Workspace
// // )
// // satellite._testpart(
// // 	"real start of satellite",
// // 	new BrickColor("Brick yellow").Color,
// // 	0.4,
// // 	satellite.state.getKinematic().getAbsolutePosition(),
// // 	game.Workspace
// // )
// let trajectoryDisplayDuration = 1e6;
// let sTrajectory!: Folder;// = satellite.trajectory.displayTrajectory(trajectoryDisplayDuration / (OrbitLineResolution - 1), OrbitLineResolution, 1);
// // sTrajectory.Parent = game.Workspace.WaitForChild("Orbits");

// const Frame = player.WaitForChild("PlayerGui").WaitForChild("ScreenGui").WaitForChild("Frame");
// let lastdVX = -1;
// let lastdVY = -1;
// let lastdVZ = -1;
// let lastTimeRange = -1;

// // run with physics loop

// let scaledTimePassed: TemporalState = new TemporalState(0);
// const timeWarpMultiplier = 20000;

// const GBParts: Part[] = [SunPart,MercuryPart,VenusPart,MarsPart,EarthPart,MoonPart]
// const GBSOIParts: Part[] = [SunSOI,MercurySOI,VenusSOI,MarsSOI,EarthSOI,MoonSOI]

// function updateUniverseState(scaledTimePassed: TemporalState) {
// 	// print(scaledTimePassed.relativeTime)

// 	// (Solar System)
// 	for (let i = 0; i < GBs.size(); i++) {
// 		const gb = GBs[i];
// 		const gbPart = GBParts[i];
// 		const gbSOIPart = GBSOIParts[i];
// 		gb.updateState(scaledTimePassed);
// 		gbPart.Position = gb.state.getKinematic().getAbsolutePosition().mul(Globals.solarSystemScale).toVector3();
// 		gbSOIPart.Position = gbPart.Position;
// 	}

// 	// (earth-moon system)

// 	// // print("Moon")
// 	// Moon.updateState(scaledTimePassed);
// 	// MoonPart.Position = Moon.state.getKinematic().getAbsolutePosition().toVector3().mul(Globals.solarSystemScale);
// 	// MoonSOI.Position = MoonPart.Position;
// 	// print("Satellite")
// 	satellite.updateState(scaledTimePassed);
// 	satellitePart.Position = satellite.state.getKinematic().getPosition()
// 		.add(satellite.orbiting?.state.getKinematic().getPosition() ?? Vector3D.zero).toVector3().mul(Globals.solarSystemScale);
// }

// // main game loop

// updateUniverseState(scaledTimePassed);

// let tn = 1
// let tr = satellite.trajectory
// while (tr.hasNextTrajectory()) {
// 	tn++
// 	tr = tr.nextTrajectory()
// }

// // let displayTrajectoryTask: thread | undefined;
// game.GetService("RunService").PreSimulation.Connect((deltaTime: number) => {
// 	const newdVX = Frame.GetAttribute("dVX") as number;
// 	const newdVY = Frame.GetAttribute("dVY") as number;
// 	const newdVZ = Frame.GetAttribute("dVZ") as number;
// 	trajectoryDisplayDuration = Frame.GetAttribute("timeRange") as number;
// 	if (lastdVX !== newdVX || lastdVY !== newdVY || lastdVZ !== newdVZ || lastTimeRange !== trajectoryDisplayDuration) {
// 		// redo trajectory lines
// 		if (sTrajectory) sTrajectory.Destroy();

// 		if (lastdVX !== newdVX || lastdVY !== newdVY || lastdVZ !== newdVZ) {
// 			satellite = new PhysicsCelestial(
// 				"satellite",
// 				new Vector3D(0, 0, 1e7),
// 				new Vector3D(newdVX, newdVY, newdVZ),
// 				universe.globalTime,
// 				Moon
// 			);
// 		}
// 		// if (displayTrajectoryTask) task.cancel(displayTrajectoryTask);
// 		// displayTrajectoryTask = task.defer(() => {
// 			sTrajectory = satellite.trajectory.displayTrajectory(trajectoryDisplayDuration / OrbitLineResolution, OrbitLineResolution, 1)//.expect();
// 		// });

// 		lastdVX = newdVX;
// 		lastdVY = newdVY;
// 		lastdVZ = newdVZ;
// 		lastTimeRange = trajectoryDisplayDuration;
// 	}

// 	if (Frame.GetAttribute("timeRunning") as boolean) {
// 		scaledTimePassed = scaledTimePassed.withIncrementTime(deltaTime * timeWarpMultiplier);
// 		updateUniverseState(scaledTimePassed);
// 	}
// })

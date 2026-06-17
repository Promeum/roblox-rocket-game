// import Vector3D from "shared/Modules/Libraries/Vector3D";

// import Chrono from "shared/Modules/BaseModule/Chrono";
// import GravityCelestial from "shared/Modules/BaseModule/Celestial/GravityCelestial";
// import PhysicsCelestial from "shared/Modules/BaseModule/Celestial/PhysicsCelestial";
// import UniverseInstance from "shared/Modules/BaseModule/Universe/UniverseInstance";
// import AstronomicalView from "shared/Modules/BaseModule/View/AstronomicalView";
// import Craft from "shared/Modules/BaseModule/Craft";
// import CraftPart from "shared/Modules/BaseModule/CraftPart";
// import RigidBody from "shared/Modules/BaseModule/RigidBody";

// import Datamap from "shared/Modules/BaseModule/Datamap";

// // Initialize Celestials

// // // (Verifying correctness)

// // const Moon = new GravityCelestial(
// // 	"Sun",
// // 	new Vector3D(0, 0, 0),
// // 	new Vector3D(0, 0, 0),
// // 	Chrono.zero,
// // 	5.97216187e15,
// // 	695700e3,
// // 	new BrickColor("Pastel brown").Color,
// //     undefined as unknown as Datamap
// // );
// // const satellite = new PhysicsCelestial(
// // 	"Satellite",
// // 	new Vector3D(1_000, 7_000, 5_000),
// // 	new Vector3D(3.0, 5.0, 4.0),
// // 	// new Vector3D(920, 300, 150), // 2nd trajectory orbit line is overdrawn
// // 	Chrono.zero,
// // [],
// // 	Moon
// // );

// // (Solar System)

// const Sun = new GravityCelestial(
// 	"Sun",
// 	new Vector3D(0, 0, 0),
// 	new Vector3D(0, 0, 0),
// 	Chrono.zero,
// 	1.9885e30,
// 	695700e3,
// 	new BrickColor("Pastel brown").Color,
//     undefined as unknown as Datamap
// );
// const Mercury = new GravityCelestial(
// 	"Mercury",
// 	new Vector3D(-2.185835358441481E+10, -3.485005094346408E+09, -6.614625011845423E+10),
// 	new Vector3D(3.650093369107909E+04, -4.367018609323549E+03, -1.273461833585731E+04),
// 	Chrono.zero,
// 	3.302e23,
// 	2439.4e3,
// 	new BrickColor("Smoky grey").Color,
//     undefined as unknown as Datamap,
// 	Sun
// );
// const Venus = new GravityCelestial(
// 	"Venus",
// 	new Vector3D(-1.075385106364918E+11, 6.160527557804195E+09, -2.057163683439167E+09),
// 	new Vector3D(4.611733871187763E+02, -5.279208622663791E+02, -3.516748102702129E+04),
// 	Chrono.zero,
// 	48.685e23,
// 	6051.84e3,
// 	new BrickColor("Bronze").Color,
//     undefined as unknown as Datamap,
// 	Sun
// );
// const Earth = new GravityCelestial(
// 	"Earth",
// 	new Vector3D(-2.344796397128329E+10, -1.638736262440681E+07, 1.452213061233350E+11),
// 	new Vector3D(-2.989434743673573E+04, 9.000105203986752E-01, -4.853641762746061E+03),
// 	Chrono.zero,
// 	5.97219e24,
// 	6371.01e3,
// 	new BrickColor("Steel blue").Color,
//     undefined as unknown as Datamap,
// 	Sun
// );
// const Mars = new GravityCelestial(
// 	"Mars",
// 	new Vector3D(2.079413286219068E+11, -5.180248494584806E+09, -5.677471461403446E+09),
// 	// eslint-disable-next-line no-loss-of-precision
// 	new Vector3D(1.615287420127653E+03, 5.160202387037263E+02, 2.627674229888704E+04),
// 	Chrono.zero,
// 	6.4171e23,
// 	3389.92e3,
// 	new BrickColor("Br. reddish orange").Color,
//     undefined as unknown as Datamap,
// 	Sun
// );
// const Moon = new GravityCelestial(
// 	"Moon",
// 	new Vector3D(-3.205398330266103E+08, 3.658599781326822E+07, -2.380401614217560E+08),
// 	// eslint-disable-next-line no-loss-of-precision
// 	new Vector3D(5.511228197116279E+02, -1.568395408118706E+00, -8.066150606766933E+02),
// 	Chrono.zero,
// 	7.349e22,
// 	1737.53e3,
// 	new BrickColor("Dark stone grey").Color,
//     undefined as unknown as Datamap,
// 	Earth
// );

// game.Workspace.Gravity = 0;

// // Satellite Setup
// // PhysicsCelestials needs manual setup for now
// // They are planned to use 3D-placed UI elements in AstronomicalView
// // and Craft instances to be displayed in WorldView

// const satCollisionModel = new Instance("Model");
// satCollisionModel.Name = "Satellite RigidBody";

// const satPart: Part = new Instance("Part");

// satPart.Shape = Enum.PartType.Block;
// // satPart.Anchored = true;
// satPart.Material = Enum.Material.Neon;
// satPart.Name = "satPart";
// satPart.Color = new BrickColor("Fire Yellow").Color;
// satPart.Size = new Vector3(1, 2, 1);

// // satPart.Parent = game.Workspace;
// satPart.Parent = satCollisionModel;
// satCollisionModel.PrimaryPart = satPart;

// satCollisionModel.Parent = game.Workspace;

// const satellite = new PhysicsCelestial(
// 	"Satellite",
// 	new Vector3D(0, 0, -1e7),
// 	new Vector3D(920, 300, 100),
// 	// new Vector3D(920, 300, 150), // 2nd trajectory orbit line is overdrawn
// 	Chrono.zero,
// [Sun],
// 	new Craft(new CraftPart(undefined, [], new RigidBody(satCollisionModel))),
// 	Moon
// );

// // velocity of satellite

// const velPart: Part = new Instance("Part");

// velPart.Shape = Enum.PartType.Block;
// velPart.Anchored = true;
// velPart.Material = Enum.Material.Neon;
// velPart.Name = "velPart";
// velPart.Color = new BrickColor("Carnation pink").Color;
// velPart.Size = new Vector3(1, 1, 1);

// velPart.Parent = game.Workspace;

// // Solar System Setup Complete

// const universe: UniverseInstance = new UniverseInstance(
// 	Chrono.zero,
// 	[Sun],
// 	[satellite]
// );

// const startScale = 1 / Earth.radius;//1 / Mercury.radius;//1 / 500_000_000;

// // debug.profilebegin("Init Solar System")

// const view: AstronomicalView = new AstronomicalView(
// 	universe, 360, undefined,
// 	startScale,
// 	Earth.calculateState(universe.time).physics.getKinematic().absolutePosition().negate()
// );
// view.draw();
// view.viewFolder.Parent = game.Workspace;

// // debug.profileend();

// // /*
// //  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
// // ================================================= DisplayAnimation class testing =================================================
// //  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
// //   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// // */

// // class DisplayAnimation {
// // 	public readonly duration: number;
	
// // 	private readonly transitoryCelestial: GravityCelestial | undefined;
// // 	private readonly transitoryScale: number;
// // 	private readonly targetScale: number;

// // 	private lastScale: number = 0;

// // 	constructor(
// // 		public readonly astronomicalView: AstronomicalView,
// // 		public readonly startTime: Chrono,
// // 		public readonly endTime: Chrono,
// // 		public readonly startCelestial: GravityCelestial,
// // 		public readonly endCelestial: GravityCelestial,
// // 		private readonly originalScale: number
// // 	) {
// // 		this.duration = endTime.sub(startTime).relativeTime;
// // 		this.transitoryCelestial = startCelestial.calculateState(startTime)
// // 			.convergenceItem(endCelestial.calculateState(startTime)) as unknown as GravityCelestial | undefined;
// // 		this.transitoryScale = 1 / (this.transitoryCelestial?.radius ?? 5e8);
// // 		this.targetScale = 1 / this.endCelestial.radius;
// // 	}

// // 	/**
// // 	 * Displays a map view transition between different planets
// // 	 */
// // 	public draw(time?: Chrono): [Vector3D, number] {
// // 		if (!time) time = this.astronomicalView.universe.time;
// // 		const progress = (time.relativeTime - this.startTime.relativeTime) / this.duration;
// // 		let scale = this.lastScale;
// // 		let offset;
// // 		if (progress < 1/3) {
// // 			// print("a")
// // 			scale = interp2(this.originalScale, this.transitoryScale, progress * 3);
// // 			offset = this.startCelestial.calculateState(time)
// // 				.physics.getKinematic().getAbsolutePosition().negate();
// // 		} else if (progress >= 2/3) {
// // 			// print("c")
// // 			scale = interp2(this.targetScale, this.transitoryScale, (1 - (progress - 2/3) * 3));
// // 			offset = this.endCelestial.calculateState(time)
// // 				.physics.getKinematic().getAbsolutePosition().negate();
// // 		}
// // 		if (math.clamp(progress, 1/5, 4/5) === progress) {
// // 			// print("b")
// // 			offset = interp2Vector3D(
// // 				this.startCelestial.calculateState(time)
// // 					.physics.getKinematic().getAbsolutePosition().negate(),
// // 				this.endCelestial.calculateState(time)
// // 					.physics.getKinematic().getAbsolutePosition().negate(),
// // 					(progress - 1/5) * (5/3)
// // 			);
// // 		}

// // 		this.astronomicalView.draw(scale, offset, time);
// // 		this.lastScale = scale;
// // 		return [offset!, scale!];
// // 	}
// // }

// // function interp1(a: number, b: number, t: number): number {
// // 	return a + (b - a) * t ** (1/30);
// // }

// // function interp2(a: number, b: number, t: number): number {
// // 	return a + (b - a) * (
// // 		(math.sin(math.pi * (t - 1/2)) + 1) / 2
// // 	);
// // }

// // function interp2Vector3D(a: Vector3D, b: Vector3D, t: number): Vector3D {
// // 	return new Vector3D(
// // 		interp2(a.X, b.X, t),
// // 		interp2(a.Y, b.Y, t),
// // 		interp2(a.Z, b.Z, t),
// // 	)
// // }

// // const anim = new DisplayAnimation(
// // 	view, new Chrono(100_000),
// // 	new Chrono(300_000),
// // 	Mercury, Earth, startScale
// // )

// /*
//  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
// ========================================================= Rendering Loop =========================================================
//  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
//   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// */

// // let p="[" // points to test
// // for(let i=0;i<500;i++){
// // 	const o=new Chrono(i*100_000)
// // 	p+="("+o.relativeTime+"x,"+(
// // 		satellite.trajectory.nextTrajectory().currentTrajectory.calculateStateFromTime(o).getKinematic().getPosition().sub(
// // 		Moon.trajectory.calculateStateFromTime(o).getKinematic().getPosition()).magnitude()
// // 		- Moon.SOIRadius
// // 	)+"),"
// // }p+="]"
// // print(p.gsub(",]","]")[0])
// // ##################################################################################################################################
// const timeWarpMultiplier = 120_000//20_000//200_000;

// game.GetService("RunService").PreSimulation.Connect((deltaTime: number) => {
//     universe.advanceGlobalTime(deltaTime * timeWarpMultiplier);
// 	debug.profilebegin("Draw Solar System")
// 	// if (math.clamp(universe.time.relativeTime, 100_000, 300_000) !== universe.time.relativeTime) {
// 	// 	const offset = (
// 	// 		(universe.time.relativeTime < 200_000) ?
// 	// 			Mercury.calculateState(universe.time).physics
// 	// 				.getKinematic().getAbsolutePosition().negate()
// 	// 		:
// 	// 			Earth.calculateState(universe.time).physics
// 	// 				.getKinematic().getAbsolutePosition().negate()
// 	// 	);
// 		view.draw(
// 			undefined,
// 			Earth.calculateState(universe.time).physics
// 					.getKinematic().absolutePosition().negate(),// offset,
// 			universe.time
// 			// ( // zoom animation testing
// 			// 	math.sin(universe.time.relativeTime / timeWarpMultiplier / (2 * math.pi) * 4)
// 			// 	/ 4 + 1
// 			// ) * scale
// 		);
// satPart.Position = satellite.trajectory.calculateStateFromTime(universe.time)
// 	.getKinematic().absolutePosition().add(Earth.calculateState(universe.time)
// 	.physics.getKinematic().absolutePosition().negate()).mul(startScale).toVector3();
// velPart.Position = satPart.Position.add(satellite.trajectory.calculateStateFromTime(universe.time)
// 	.getKinematic().absoluteVelocity().add(Earth.calculateState(universe.time)
// 	.physics.getKinematic().absoluteVelocity().negate()).mul(startScale*10000).toVector3());

// // 	} else {
// // 		const offsetAndScale = anim.draw(universe.time);
// // satPart.Position = satellite.trajectory.calculateStateFromTime(universe.time)
// // 	.getKinematic().absolutePosition().add(offsetAndScale[0]).mul(offsetAndScale[1]).toVector3();
// // 	}
// 	debug.profileend();
// });

// /*
//  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
// ======================================================= Old Rendering Loop =======================================================
//  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
//   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
// */

// // const player: Player = game.GetService("Players").LocalPlayer;

// // const Frame = player.WaitForChild("PlayerGui").WaitForChild("ScreenGui").WaitForChild("Frame");
// // let lastdVX = -1;
// // let lastdVY = -1;
// // let lastdVZ = -1;
// // let lastTimeRange = -1;

// // // main game physics + input loop

// // // let displayTrajectoryTask: thread | undefined;
// // game.GetService("RunService").PreSimulation.Connect((deltaTime: number) => {
// // 	const newdVX = Frame.GetAttribute("dVX") as number;
// // 	const newdVY = Frame.GetAttribute("dVY") as number;
// // 	const newdVZ = Frame.GetAttribute("dVZ") as number;
// // 	trajectoryDisplayDuration = Frame.GetAttribute("timeRange") as number;
// // 	if (lastdVX !== newdVX || lastdVY !== newdVY || lastdVZ !== newdVZ || lastTimeRange !== trajectoryDisplayDuration) {
// // 		// redo trajectory lines
// // 		if (sTrajectory) sTrajectory.Destroy();

// // 		if (lastdVX !== newdVX || lastdVY !== newdVY || lastdVZ !== newdVZ) {
// // 			satellite = new PhysicsCelestial(
// // 				"satellite",
// // 				new Vector3D(0, 0, 1e7),
// // 				new Vector3D(newdVX, newdVY, newdVZ),
// // 				universe.time,
// // 				Moon
// // 			);
// // 		}
// // 		// if (displayTrajectoryTask) task.cancel(displayTrajectoryTask);
// // 		// displayTrajectoryTask = task.defer(() => {
// // 			sTrajectory = satellite.trajectory.displayTrajectory(trajectoryDisplayDuration / OrbitLineResolution, OrbitLineResolution, 1)//.expect();
// // 		// });

// // 		lastdVX = newdVX;
// // 		lastdVY = newdVY;
// // 		lastdVZ = newdVZ;
// // 		lastTimeRange = trajectoryDisplayDuration;
// // 	}

// // 	if (Frame.GetAttribute("timeRunning") as boolean) {
// // 		scaledTimePassed = scaledTimePassed.withIncrementTime(deltaTime * timeWarpMultiplier);
// // 		updateUniverseState(scaledTimePassed);
// // 	}
// // })

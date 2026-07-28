import Vector3D from "shared/Modules/Libraries/Vector3D";

import Datamap from "shared/Modules/BaseModule/Datamap";
import Chrono from "shared/Modules/BaseModule/Chrono";
import GravityCelestial from "shared/Modules/BaseModule/Celestial/GravityCelestial";
import PhysicsCelestial from "shared/Modules/BaseModule/Celestial/PhysicsCelestial";
import UniverseInstance from "shared/Modules/BaseModule/UniverseInstance";
import WorldView from "shared/Modules/BaseModule/View/WorldView";
import Craft from "shared/Modules/BaseModule/Craft";
import CraftPart from "shared/Modules/BaseModule/CraftPart";
import RigidBody from "shared/Modules/BaseModule/RigidBody";
import ViewCamera from "shared/Modules/BaseModule/ViewCamera";
import Serialization from "shared/Modules/BaseModule/Serialization";
import ModuleState from "shared/Modules/BaseModule/CraftModule/ModuleState";

// import PlanetP1Datamaps from "shared/Assets/PlanetP1/datamaps.json";
import EarthDatamaps from "shared/Assets/PlanetData/Earth/datamaps.json";
import Container from "shared/Modules/BaseModule/CraftModule/Container";
import RESOURCES from "shared/Modules/BaseModule/Resource";
import Flow from "shared/Modules/BaseModule/CraftModule/Flow";

print("== setup start ==")
const setupStartTime = os.clock();

// Initialize Celestials

// (Solar System)

const Earth = new GravityCelestial(
	"Earth",
	Vector3D.zero,
	Vector3D.zero,
	// new Vector3D(-2.344796397128329E+10, -1.638736262440681E+07, 1.452213061233350E+11),
	// new Vector3D(-2.989434743673573E+04, 9.000105203986752E-01, -4.853641762746061E+03),
	Chrono.zero,
	5.97219e24,
	6371.01e3,
	new BrickColor("Steel blue").Color,
	new Datamap(
		// PlanetP1Datamaps.heightmap,
		EarthDatamaps.heightmap,
		[1000, 500]
	)
);

game.Workspace.Gravity = 0;

// 43.56 N, 41.15 E, 11790 m above sea level
// const start = new Vector3D(-3482814, 4398475.5, 3043608.75).mul(1.0000)//.mul(0.998423)//.negate()
const start = new Vector3D(-3482814, 4398475.5, 3043608.75).mul(1.016614)//.mul(1.016612)

// Rocketship Setup

const nosecone = CraftPart.make("Probe Nosecone");
const fueltank = CraftPart.make("Fuel Tank");
const rocketengine = CraftPart.make("Rocket Engine");

const rocketship = new PhysicsCelestial(
	"Rocketship",
	// new Vector3D(-3482814, 4398475.5, 3043608.75).mul(0.998423).negate(),
	start,
	new Vector3D(-19, 3, 1.2), // new Vector3D(920, 300, 100),
	Chrono.zero, [Earth],
	new Craft(
		nosecone.addChild(
			nosecone.getConnectionPoint("Bottom"),
			fueltank.getConnectionPoint("Top"),
			fueltank.addChild(
				fueltank.getConnectionPoint("Bottom"),
				rocketengine.getConnectionPoint("Top"),
				rocketengine
			)
		)
	),
	Earth
);

const weldfolder = new Instance("Folder");
weldfolder.Name = "Welds";
rocketship.flyingObject.allParts().map(p => p.getChildWelds()).reduce((a,c) => [...a, ...c])
	.forEach(weld => {
		weld.Parent = weldfolder;
	}
);

const rocketfolder = new Instance("Folder");
rocketfolder.Name = "Rocketship";
for (const model of [nosecone.model, fueltank.model, rocketengine.model])
	model.Parent = rocketfolder;

weldfolder.Parent = rocketfolder;
rocketfolder.Parent = game.Workspace;

// Solar System Setup Complete

const universe: UniverseInstance = new UniverseInstance(
	Chrono.zero,
	[Earth],
	[rocketship]
);

print("instantiate WorldView")
const worldViewInstantiateStartTime = os.clock();

const startScale = 1//1e-4

// Render levels testing
const view: WorldView = new WorldView(
	universe, Earth,
	startScale,
	start.negate()
);

print(`	fin @ ${os.clock() - worldViewInstantiateStartTime} seconds`)

print("parent WorldView to Workspace")
const worldViewParentStartTime = os.clock();

view.viewFolder.Parent = game.Workspace;

print(`	fin @ ${os.clock() - worldViewParentStartTime} seconds`)

// final rendering preparations

const timeWarpMultiplier = 1//200//20_000;
universe.preSimulation(0);
rocketship.setPhysicsMode("physics");

game.GetService("Lighting").OutdoorAmbient = new Color3(.4, .4, .4)
const camera = new ViewCamera(view, nosecone.model.PrimaryPart!);

print("view.draw()")
const worldViewDrawCallStartTime = os.clock();

view.draw(); // Globe Visualization

print(`	fin @ ${os.clock() - worldViewDrawCallStartTime} seconds`)

print(`== fin @ ${os.clock() - setupStartTime} seconds ==`)

/*
 =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
========================================================= Rendering Loop =========================================================
 = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
*/

// Render loop testing
camera.setNormal(Vector3.yAxis);
game.GetService("RunService").BindToRenderStep("After Camera",
				Enum.RenderPriority.Character.Value + 1,
				function(dt) {
	camera.update(dt);
});

game.GetService("RunService").PreSimulation.Connect((deltaTime: number) => {
	debug.profilebegin("Render + Physics loop");

	// Physics loop testing (disable render loop)

	camera.setNormal(rocketship.state.position);
	universe.preSimulation(deltaTime * timeWarpMultiplier);

	// Animation loop testing (disable physics loop)

// 	view.draw(
// // scale
// 		undefined,
// 		// 1,//1e-4,

// // offset
// 		undefined,
// 		// satellite.trajectory.calculateStateFromTime(universe.globalTime)
// 		// 	.getKinematic().getAbsolutePosition().negate(),

// // time
// 		universe.time
// 	);

	debug.profileend();
});

// // RESOURCE MANAGEMENT debug helper functions
// function printResources(cont: Container) {
// 	let result = "Container: ";
// 	for (let i = 0; i < cont.state.resource.length; i++) {
// 		const resource = cont.state.resource.types[i];
// 		result += `\t${resource}: ${cont.state.resources[i]} ${RESOURCES[resource].units}`
// 	}
// 	return result;
// }
// function printFlow(f: Flow) {
// 	let result = "Flow: ";
// 	for (let i = 0; i < f.state.resource.length; i++) {
// 		const resource = f.state.resource.types[i];
// 		result += `\t${resource}: ${f.state.flow[i]} ${RESOURCES[resource].units}`
// 	}
// 	return result;
// }
// // End of debug helpers

// // PHYSICS PIPELINE debug parts
// const rp = satellite._testpart(
// 	"RobloxPhysics", new BrickColor("Really red").Color, new Vector3D(.25,.5,2),
// 	Vector3D.zero, game.Workspace
// );
// const cp = satellite._testpart(
// 	"CelestPhysics", new BrickColor("Bright purple").Color, new Vector3D(.5,.25,2),
// 	Vector3D.zero, game.Workspace
// );
// const d1p = satellite._testpart(
// 	"DiffCalced", new BrickColor("Navy blue").Color, new Vector3D(.7,.1,2),
// 	Vector3D.zero, game.Workspace
// );
// // End of debug parts

game.GetService("RunService").PostSimulation.Connect((deltaTimeSim: number) => {
    universe.postSimulation();

// // RESOURCE MANAGEMENT debug
// print(printResources(rocketship.flyingObject.primaryPart.connections[0].part.state.container!))
// print(printResources(rocketship.flyingObject.primaryPart.state.container!))
// print(printFlow(rocketship.flyingObject.primaryPart.connections[0].part.connections[0].part.state.flows[0]))

// // PHYSICS PIPELINE debug visualization
// // satellite roblox velocity
// const rpV = satPart.AssemblyLinearVelocity
// rp.CFrame = CFrame.lookAlong(satPart.Position.add(rpV.Unit.mul(3 + rpV.Magnitude % 3)), rpV)
// // sattelite orbital mechanics velocity
// const cpV = satellite.state.velocity.toVector3()
// cp.CFrame = CFrame.lookAlong(satPart.Position.add(cpV.Unit.mul(3 + cpV.Magnitude % 3)), cpV)
// // error of orbital mechanics
// const d1pV = rpV.sub(cpV)
// d1p.CFrame = CFrame.lookAlong(satPart.Position.add(d1pV.Unit.mul(3 + d1pV.Magnitude % 3)), d1pV)
// // End of debug script

});

/*
 =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
======================================================= Flat Visualization =======================================================
 = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
*/

// // function changeCenterpoint(x: number, y: number, x0: number, y0: number): [number, number] {
// // 	const [long, lat] = coordsToLongLat(x, y);
// // 	const [longCenter, latCenter] = coordsToLongLat(x0, y0);
// // 	const newLong = long - longCenter;
// // 	// const newLat = lat - latCenter; // Bad
// // 	return longLatToCoords(newLong, newLat);
// // }

// function coordsToLongLat(x: number, y: number): [number, number] {
// 	// Values in radians
// 	const longitude = (x / heightData.dimensionSizes[0] - 0.5) * 2 * math.pi;
// 	const latitude = (0.5 - y / heightData.dimensionSizes[1]) * math.pi;

// 	return [longitude, latitude];
// }

// function longLatToCoords(longitude: number, latitude: number): [number, number] {
// 	const x = (longitude / (2 * math.pi) + 0.5) * heightData.dimensionSizes[0];
// 	const y = (latitude / math.pi - 0.5) * heightData.dimensionSizes[1];

// 	return [x, y];
// }

// const flatMapResolution = 4
// const waterLevel = 12//128

// const basePart = new Instance("Part")
// basePart.Anchored = true
// basePart.Size = new Vector3(1,1,1).mul(1)
// const partFolder = new Instance("Folder")
// partFolder.Name = "partFolder"
// partFolder.Parent = game.Workspace

// const heightData = new Datamap(EarthDatamaps.heightmap, [1000, 500]);
// for (let y = 0; y<500; y+=flatMapResolution) {task.wait(0)
// 	for (let x = 0; x<1000; x+=flatMapResolution) {
// 		const p = basePart.Clone()
// 		const height = heightData.bilinearInterp(
// 			x, y
// 		);
// 		p.CFrame = new CFrame(
// 			x/flatMapResolution,
// 			(height > waterLevel) ? (height-waterLevel) / (255-waterLevel) * 4 : 0,
// 			y/flatMapResolution
// 		)
// 		p.Color = Color3.fromHSV(.33, .75, (height-waterLevel)/(255-waterLevel))
// 		if (height <= waterLevel) {
// 			p.Color = Color3.fromRGB(0, 0, 255)
// 		}
// 		p.Parent = partFolder
// 	}
// }

/*
 =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
========================================================= Utility Methods =========================================================
 = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
*/

/* Code to run in Roblox Studio command bar (because special privileges)
-- Visualizes map data in a 2D array of parts

imageFile = game:GetService("StudioService"):PromptImportFileAsync({"data"})
imageString = imageFile:GetBinaryContents()
imageDimensions = {500, 1000}
-- get red color channel
imageData = {}
for i = 1, imageFile.Size / 3, 2 do
	b1, b2 = imageString:byte(i, i+1)
	imageData[math.floor((i + 1) / 2)] = b1 + b2
end
basePart = Instance.new("Part")
basePart.Anchored = true
basePart.Size = Vector3.new(1,1,1) * 4
partFolder = Instance.new("Folder")
partFolder.Name = "partFolder"
partFolder.Parent = game.Workspace

for y = 1, imageDimensions[2], 2 do
	for x = 1, imageDimensions[1], 4 do
		local i = (y - 1) * imageDimensions[1] + x -- map (x,y) to data index
		local p = basePart:Clone()
		p.CFrame = CFrame.new(x, imageData[i]/64, y)
		p.Color = Color3.fromHSV(.33, .75, imageData[i]/255)
		if imageData[i] == 0 then
			p.Color = Color3.fromRGB(0, 0, 255)
		end
		p.Parent = game.Workspace.partFolder
	end
end

-- delete generated parts

game.Workspace.partFolder:Destroy()

*/
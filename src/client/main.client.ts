import Vector3D from "shared/Modules/Libraries/Vector3D";

// import PlanetP1Datamaps from "shared/Assets/PlanetP1/datamaps.json";
import EarthDatamaps from "shared/Assets/Earth/datamaps.json";

import Datamap from "shared/Modules/BaseModule/Datamap";
import TemporalState from "shared/Modules/BaseModule/Relative/State/TemporalState";
import GravityCelestial from "shared/Modules/BaseModule/Celestial/GravityCelestial";
import UniverseInstance from "shared/Modules/BaseModule/Universe/UniverseInstance";
import WorldView from "shared/Modules/BaseModule/View/WorldView";

// Initialize Celestials

// (Solar System)

const Earth = new GravityCelestial(
	"Earth",
	Vector3D.zero,
	Vector3D.zero,
	// new Vector3D(-2.344796397128329E+10, -1.638736262440681E+07, 1.452213061233350E+11),
	// new Vector3D(-2.989434743673573E+04, 9.000105203986752E-01, -4.853641762746061E+03),
	new TemporalState(0),
	5.97219e24,
	6371.01e3,
	new BrickColor("Steel blue").Color,
	new Datamap(
		// PlanetP1Datamaps.heightmap,
		EarthDatamaps.heightmap,
		[1000, 500]
	)
);

// Solar System Setup Complete

const universe: UniverseInstance = new UniverseInstance(
	new TemporalState(0),
	[Earth],
	[]
);

// Globe Visualization

print("instantiate WorldView")
const startTime = os.clock();

// 1:1 scale
// const view: WorldView = new WorldView(
// 	universe, Earth,
// 	1,
// 	// 43.56 N, 41.15 E, 11790 m above sea level
// 	new Vector3D(-3482814, 4398475.5, 3043608.75).negate()
// );

// Render levels testing
const view: WorldView = new WorldView(
	universe, Earth,
	1e-4,
	// 43.56 N, 41.15 E, 11790 m above sea level
	new Vector3D(-3482814, 4398475.5, 3043608.75).negate()
);

print(`fin @ ${os.clock() - startTime} seconds`)

view.viewFolder.Parent = game.Workspace;

print("view.draw()")
const startTime2 = os.clock();

view.draw();

print(`fin @ ${os.clock() - startTime2} seconds`)

// // Flat Visualization

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

/*
 =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
========================================================= Rendering Loop =========================================================
 = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
*/

// const timeWarpMultiplier = 20_000//200_000//120_000;

// game.GetService("RunService").PreSimulation.Connect((deltaTime: number) => {
// 	universe.globalTime = universe.globalTime.withIncrementTime(deltaTime * timeWarpMultiplier);

// 	debug.profilebegin("Draw Terrain");

// 	view.draw(
// 		undefined,
// 		undefined
// 	);

// 	debug.profileend();
// });

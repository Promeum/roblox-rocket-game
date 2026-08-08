import Vector3D from "shared/Modules/Libraries/Vector3D";
import Datamap from "shared/Modules/BaseModule/Datamap";
import Chrono from "shared/Modules/BaseModule/Chrono";
import GravityCelestial from "shared/Modules/BaseModule/Celestial/GravityCelestial";
import UniverseInstance from "shared/Modules/BaseModule/UniverseInstance";
import EarthDatamaps from "shared/Assets/PlanetData/Earth/datamaps.json";
import View from "shared/Modules/BaseModule/View";

game.Workspace.Gravity = 0;
game.GetService("Lighting").OutdoorAmbient = new Color3(.4, .4, .4);
const RunService = game.GetService("RunService");

task.wait(5)

print('5 secs left')

task.wait(2)
print('3')
task.wait(1)
print('2')
task.wait(1)
print('1')
task.wait(1)

print("== setup start ==")
const setupStartTime = os.clock();

import WorldView from "shared/Modules/BaseModule/View/WorldView";
// WorldView
// print(`== fin @ ${os.clock() - setupStartTime} seconds ==`)

/*
 =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
===================================================== Universe Initialization =====================================================
 = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
*/

const Earth = new GravityCelestial(
    "Earth",
    Vector3D.zero,
    Vector3D.zero,
    Chrono.zero,
    5.97219e24,
    6371.01e3,
    new BrickColor("Steel blue").Color,
    new Datamap(
        EarthDatamaps.heightmap,
        [1000, 500],
        EarthDatamaps.maxHeight
    )
);

// Initial kinematics and stuff

const startpos = new Vector3D(-3482814, 4398475.5, 3043608.75).mul(1.016614);
const startRootGravCels = [Earth];

// Final universe setup

const universe = new UniverseInstance(Chrono.zero, startRootGravCels, []);

/*
 =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
=========================================================== View Setup ===========================================================
 = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
  =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =   =
*/

print("instantiate View")

const viewInstantiateStartTime = os.clock();

let scale = 1e-5//1;
let view: View = new WorldView(
    universe, Earth, startpos,
    scale, startpos.negate()
);

print(`	fin @ ${os.clock() - viewInstantiateStartTime} seconds`)

print("parent View folder to Workspace")
const viewFolderParentStartTime = os.clock();
view.viewFolder.Parent = game.Workspace; // TODO: Test inserting before vs after view.draw()
print(`	fin @ ${os.clock() - viewFolderParentStartTime} seconds`)

// final rendering preparations

universe.preSimulation(0); // Needed?

print("view.draw()")
const worldViewDrawCallStartTime = os.clock();

view.draw();

print(`	fin @ ${os.clock() - worldViewDrawCallStartTime} seconds`)

print(`== fin @ ${os.clock() - setupStartTime} seconds ==`)


task.wait(5)

print('5 secs left')

task.wait(2)
print('3')
task.wait(1)
print('2')
task.wait(1)
print('1')
task.wait(1)

// TODO: Implement caching of WedgeData to prevent unnecessary Instance.Parent and Instance.Clone()

print("view.draw() #2")
const worldViewDrawCallStartTime2 = os.clock();

view.draw(undefined, startpos.negate().add(new Vector3D(1,0,0)));

print(`	fin @ ${os.clock() - worldViewDrawCallStartTime2} seconds`)

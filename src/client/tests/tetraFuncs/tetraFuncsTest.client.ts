import Datamap from "shared/Modules/BaseModule/Datamap";
import FastV3D, { Vector } from "shared/Modules/Libraries/FastVector3D";
import EarthDatamaps from "shared/Assets/PlanetData/Earth/datamaps.json";
import * as OLD from "./oldTetraFuncs";
import * as NEW from "./newTetraFuncs";
import Vector3D from "shared/Modules/Libraries/Vector3D";

/* Main */

math.randomseed(1234);

function vecEquals(v1: Vector, v2: Vector): boolean {
    return v1.X === v2.X && v1.Y === v2.Y && v1.Z === v2.Z;
}

const testDatamap = new Datamap(EarthDatamaps.heightmap, [1000, 500], EarthDatamaps.maxHeight);

const benchmarkCount = 50_000;

const arrayNew: Vector[] = [];
const arrayOld: Vector3D[] = [];
const [rlong, rlat] = [[0], [0]];

for (let i = 0; i < benchmarkCount * 3; i++) {
    arrayNew[i] = FastV3D.create(math.random(), math.random(), math.random());
    arrayOld[i] = FastV3D.toVector3D(arrayNew[i]);
}
task.wait()
for (let i = benchmarkCount * 3; i < benchmarkCount * 7; i++) {
    arrayNew[i] = FastV3D.create(math.random(), math.random(), math.random());
    arrayOld[i] = FastV3D.toVector3D(arrayNew[i]);
}
task.wait()
for (let i = benchmarkCount * 7; i < benchmarkCount * 10; i++) {
    arrayNew[i] = FastV3D.create(math.random(), math.random(), math.random());
    arrayOld[i] = FastV3D.toVector3D(arrayNew[i]);
}
task.wait()
for (let i = benchmarkCount * 10; i < benchmarkCount * 14; i++) {
    arrayNew[i] = FastV3D.create(math.random(), math.random(), math.random());
    arrayOld[i] = FastV3D.toVector3D(arrayNew[i]);
}
task.wait()
for (let i = 1; i < benchmarkCount; i++) {
    rlong[i] = math.random(-180, 180);
    rlat[i] = math.random(-90, 90);
}

let indexO = 0;
function newVector3D(): Vector3D { return arrayOld[indexO++]; }

let indexN = 0;
function newVector(): Vector { return arrayNew[indexN++]; }

let ilong = 0;
function randLong(): number { return rlong[ilong++]; }

let ilat = 0;
function randLat(): number { return rlat[ilat++]; }



print('5 secs left')

task.wait(2)
print('3')
task.wait(1)
print('2')
task.wait(1)
print('1')
task.wait(1)



// tests here

// Benchmark midpoint
for (let i = 0; i < benchmarkCount; i++) {
    const p1O = newVector3D();
    const p2O = newVector3D();
    const resultOld = OLD.midpoint(p1O, p2O);
    const p1N = newVector();
    const p2N = newVector();
    const resultNew = NEW.midpoint(p1N, p2N);
    assert(vecEquals(resultOld, resultNew))
}

// Benchmark centerpoint
for (let i = 0; i < benchmarkCount; i++) {
    const p1O = newVector3D();
    const p2O = newVector3D();
    const p3O = newVector3D();
    const resultOld = OLD.centerpoint(p1O, p2O, p3O);
    const p1N = newVector();
    const p2N = newVector();
    const p3N = newVector();
    const resultNew = NEW.centerpoint(p1N, p2N, p3N);
    assert(vecEquals(resultOld, resultNew))
}

// Benchmark centerpointTri
for (let i = 0; i < benchmarkCount; i++) {
    const triangleO = { top: newVector3D(), left: newVector3D(), right: newVector3D() };
    const resultOld = OLD.centerpointTri(triangleO);
    const triangleN = { top: newVector(), left: newVector(), right: newVector(), center: undefined };
    const resultNew = NEW.centerpointTri(triangleN);
    assert(vecEquals(resultOld, resultNew.center))
}


task.wait()

// Benchmark pointToLongLat
for (let i = 0; i < benchmarkCount; i++) {
    const posO = newVector3D();
    const resultOld = OLD.pointToLongLat(posO);
    const posN = newVector();
    const resultNew = NEW.pointToLongLat(posN);
    assert(resultOld[0] === resultNew[0] && resultOld[1] === resultNew[1])
}

// Benchmark projectLongLat
for (let i = 0; i < benchmarkCount; i++) {
    const rLn = randLong()
    const rLa = randLat()
    const resultOld = OLD.projectLongLat(1, rLn, rLa);
    const resultNew = NEW.projectLongLat(1, rLn, rLa);
    assert(vecEquals(resultOld, resultNew))
}

// Benchmark reproject
for (let i = 0; i < benchmarkCount; i++) {
    const pointO = newVector3D();
    const resultOld = OLD.reproject(pointO, 3);
    const pointN = newVector();
    const resultNew = NEW.reproject(pointN, 3);
    assert(vecEquals(resultOld, resultNew))
}


task.wait()

// Benchmark reprojectPoint (using a mock Datamap)
for (let i = 0; i < benchmarkCount; i++) {
    const pointO = newVector3D();
    const resultOld = OLD.reprojectPoint(pointO, testDatamap);
    const pointN = newVector();
    const resultNew = NEW.reprojectPoint(pointN, testDatamap);
    assert(vecEquals(resultOld, resultNew))
}


task.wait()

// Benchmark generatePolygon (using placeholder WedgePart objects)
const wedge1O = new Instance("WedgePart");
const wedge2O = new Instance("WedgePart");
const wedge1N = new Instance("WedgePart");
const wedge2N = new Instance("WedgePart");
for (let i = 0; i < benchmarkCount; i++) {
    const aO = newVector3D();
    const bO = newVector3D();
    const cO = newVector3D();
    const oldResult = OLD.generatePolygon(wedge1O, wedge2O, aO, bO, cO);
    const aN = newVector();
    const bN = newVector();
    const cN = newVector();
    const newResult = NEW.generatePolygon(wedge1N, wedge2N, aN, bN, cN);

    assert(vecEquals(oldResult[0].part.CFrame.XVector, newResult[0].part.CFrame.XVector))
    assert(vecEquals(oldResult[0].part.CFrame.YVector, newResult[0].part.CFrame.YVector))
    assert(vecEquals(oldResult[0].part.CFrame.ZVector, newResult[0].part.CFrame.ZVector),
           `\n\nold: ${oldResult[0].part.CFrame.ZVector}\nnew: ${newResult[0].part.CFrame.ZVector}`)
    assert(vecEquals(oldResult[0].part.CFrame.Position, newResult[0].part.CFrame.Position))

    assert(vecEquals(oldResult[1].part.CFrame.XVector, newResult[1].part.CFrame.XVector))
    assert(vecEquals(oldResult[1].part.CFrame.YVector, newResult[1].part.CFrame.YVector))
    assert(vecEquals(oldResult[1].part.CFrame.ZVector, newResult[1].part.CFrame.ZVector))
    assert(vecEquals(oldResult[1].part.CFrame.Position, newResult[1].part.CFrame.Position))


    assert(vecEquals(oldResult[0].position, newResult[0].position))
    // print("old rotation")
    // print(oldResult[0].rotation)
    // print("\n\nnew rotation")
    // print(newResult[0].rotation)
    assert(vecEquals(oldResult[0].rotation.left, newResult[0].rotation.left))
    assert(vecEquals(oldResult[0].rotation.right, newResult[0].rotation.right))
    assert(vecEquals(oldResult[0].rotation.top, newResult[0].rotation.top))
    assert(vecEquals(oldResult[0].size, newResult[0].size))

    assert(vecEquals(oldResult[1].position, newResult[1].position))
    assert(vecEquals(oldResult[1].rotation.left, newResult[1].rotation.left))
    assert(vecEquals(oldResult[1].rotation.right, newResult[1].rotation.right))
    assert(vecEquals(oldResult[1].rotation.top, newResult[1].rotation.top))
    assert(vecEquals(oldResult[1].size, newResult[1].size))
}

print("all tests pass")
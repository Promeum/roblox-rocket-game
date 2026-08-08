// import { WedgeData } from "shared/Modules/BaseModule/Display/TerrainDisplay/Tetra";
// import FastV3D, { Vector } from "shared/Modules/Libraries/FastVector3D";
// import Vector3D from "shared/Modules/Libraries/Vector3D";

// /* Main */

// function vecEquals(v1: Vector, v2: Vector): boolean {
//     return v1.X === v2.X && v1.Y === v2.Y && v1.Z === v2.Z;
// }

// const benchmarkCount = 300_000;

// task.wait()
// math.randomseed(1234);
// const arrayOld: Vector3D[] = [];
// const arrayNew: Vector[] = [];
// for (let i = 0; i < benchmarkCount * 3; i++) {
//     arrayOld[i] = new Vector3D(math.random(), math.random(), math.random());
//     arrayNew[i] = FastV3D.clone(arrayOld[i]);
// }

// let indexOld = 0;
// function newVector3D(): Vector3D { return arrayOld[indexOld++]; }

// let indexNew = 0;
// function newVector(): Vector { return arrayNew[indexNew++]; }


// // tests here

// let start = math.nan;

// print('5 secs left')

// task.wait(2)
// print('3')
// task.wait(1)
// print('2')
// task.wait(1)
// print('1')
// task.wait(1)

// // Old generatePolygon
// const wedge1O = new Instance("WedgePart");
// const wedge2O = new Instance("WedgePart");
// const wedge1N = new Instance("WedgePart");
// const wedge2N = new Instance("WedgePart");
// start = os.clock();
// for (let i = 0; i < benchmarkCount; i++) {
//     const aO = newVector3D();
//     const bO = newVector3D();
//     const cO = newVector3D();
//     const oldResult = generatePolygonOld(wedge1O, wedge2O, aO, bO, cO);

//     // assert(vecEquals(oldResult[1].part.CFrame.XVector, newResult[1].part.CFrame.XVector))
//     // assert(vecEquals(oldResult[1].part.CFrame.YVector, newResult[1].part.CFrame.YVector))
//     // assert(vecEquals(oldResult[1].part.CFrame.ZVector, newResult[1].part.CFrame.ZVector))
//     // assert(vecEquals(oldResult[1].part.CFrame.Position, newResult[1].part.CFrame.Position))
// }
// print(`generatePolygonOld: ${(os.clock() - start)}s`);



// // print('5 secs left')

// // task.wait(2)
// print('3')
// task.wait(1)
// print('2')
// task.wait(1)
// print('1')
// task.wait(1)

// // New generatePolygon
// start = os.clock();
// for (let i = 0; i < benchmarkCount; i++) {
//     const aN = newVector();
//     const bN = newVector();
//     const cN = newVector();
//     const newResult = generatePolygonNew(wedge1N, wedge2N, aN, bN, cN);
// }
// print(`generatePolygonNew: ${(os.clock() - start)}s`);

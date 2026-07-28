import BaseModule from ".";

export default class Datamap extends BaseModule {
	public readonly data: number[][];
	public readonly dimensionSizes: number[];

	public constructor(
		data: number[][],
		dimensionSizes: [number, number] // [x, y]
	) {
		super();
		this.data = data;
		this.dimensionSizes = dimensionSizes;
	}

	/**
	 * Loops back coordinates when accessing one out of range.
	 * Parameters assumed to be integers.
	 */
	public access(x: number, y: number): number {
		// assert(0 <= x && x < this.dimensionSizes[1] && 0 <= y && y < this.dimensionSizes[0],
		// 	`Coordinates (${x}, ${y}) out of range [${this.dimensionSizes[1]-1}, ${this.dimensionSizes[0]-1}]`);

		const yParam = (y / (2 * (this.dimensionSizes[1] - 1))) % 1;
		const yOverflow = yParam > 1 / 2;
		const newY = yParam === 1 / 2 ?
			this.dimensionSizes[1] - 1
			: ((yOverflow ? -1 : 1) * y) % (this.dimensionSizes[1] - 1);
		const newX = (
			yOverflow ? x + math.round(this.dimensionSizes[0] / 2) : x
		) % this.dimensionSizes[0];
		return this.data[newY][newX];
	}

	public nearestNeighborInterp(x: number, y: number): number {
		return this.access(math.round(x), math.round(y));
	}

	public bilinearInterp(x: number, y: number): number {
		const xFloor = math.floor(x);
		const xCeil = math.ceil(x);
		const yFloor = math.floor(y);
		const yCeil = math.ceil(y);
		const values = [
			this.access(xFloor, yFloor), this.access(xCeil, yFloor),
			this.access(xFloor, yCeil), this.access(xCeil, yCeil)
		];
		const xPortion = x - xFloor;
		const yPortion = y - yFloor;

		// x-axis interpolation
		const x1 = (values[1] - values[0]) * xPortion + values[0];
		const x2 = (values[3] - values[2]) * xPortion + values[2];

		// y-axis interpolation
		return (x2 - x1) * yPortion + x1;
	}

	public bicubicInterp(x: number, y: number): number {
		const xFloor = math.floor(x);
		const xCeil = math.ceil(x);
		const yFloor = math.floor(y);
		const yCeil = math.ceil(y);

		// Get 16 surrounding points (4x4 grid)
		const values = [
			this.access(xFloor - 1, yFloor - 1), this.access(xFloor, yFloor - 1),
			this.access(xCeil, yFloor - 1), this.access(xFloor + 1, yFloor - 1),

			this.access(xFloor - 1, yFloor), this.access(xFloor, yFloor),
			this.access(xCeil, yFloor), this.access(xFloor + 1, yFloor),

			this.access(xFloor - 1, yCeil), this.access(xFloor, yCeil),
			this.access(xCeil, yCeil), this.access(xFloor + 1, yCeil),

			this.access(xFloor - 1, yFloor + 1), this.access(xFloor, yFloor + 1),
			this.access(xCeil, yFloor + 1), this.access(xFloor + 1, yFloor + 1),
		];

		const xPortion = x - xFloor;
		const yPortion = y - yFloor;

		// Catmull-Rom cubic interpolation
		function catmullRom(t: number, p0: number, p1: number, p2: number, p3: number): number {
			const t2 = t ** 2;
			return 0.5 * (
				(2*p1) +
				(-p0 + p2) * t +
				(2*p0 - 5*p1 + 4*p2 - p3) * t2 +
				(-p0 + 3*p1 - 3*p2 + p3) * (t2 * t)
			);
		}

		// x-axis interpolation
		const xInterpRows = [
			catmullRom(xPortion, values[0], values[1], values[2], values[3]),
			catmullRom(xPortion, values[4], values[5], values[6], values[7]),
			catmullRom(xPortion, values[8], values[9], values[10], values[11]),
			catmullRom(xPortion, values[12], values[13], values[14], values[15])
		];

		// y-axis interpolation
		return catmullRom(yPortion, xInterpRows[0], xInterpRows[1],
						  xInterpRows[2], xInterpRows[3]);
	}
}


// function customNonlinearInterp(a: number, b: number, t: number): number {
// 	return a + (b - a) * t ** (1/30);
// }

// function customSinInterp(a: number, b: number, t: number): number {
// 	return a + (b - a) * (
// 		(math.sin(math.pi * (t - 1/2)) + 1) / 2
// 	);
// }

// function customNonlinearVector3DInterp(a: Vector3D, b: Vector3D, t: number): Vector3D {
// 	return new Vector3D(
// 		interp2(a.X, b.X, t),
// 		interp2(a.Y, b.Y, t),
// 		interp2(a.Z, b.Z, t),
// 	)
// }

import Vector3D from "../Libraries/Vector3D";

import BaseModule from ".";


export default class Orientation extends BaseModule {
	private constructor() {super();}
	
	/**
	 * Converts 2D polar coordinates to cartesian coordinates.
	 * @returns An (x,y) coordinate
	 */
	public static polarToCartesian(magnitude: number, angle: number): [number, number] {
		return [
			magnitude * math.cos(angle),
			magnitude * math.sin(angle)
		];
	}
	
	/**
	 * Converts 2D cartesian coordinates to polar coordinates.
	 * @returns An array containing a magnitude and angle, respectively.
	 */
	public static cartesianToPolar(x: number, y: number): [number, number] {
		return [
			math.sqrt(x ** 2 + y ** 2),
			math.atan2(y, x)
		];
	}
	
	/**
	 * Given a vector in the standard basis, compute the vector in the basis {i,j,k}.
	 * All vectors are assumed to be in math basis.
	 * @returns A vector in math basis.
	 */
	public static changeBasis(toTransform: Vector3D, i: Vector3D, j: Vector3D, k: Vector3D): Vector3D {
		// math change of basis formula via martix multiplication
		// https://stemandmusic.in/maths/mvt-algebra/vectorCB.php
		return new Vector3D(
			i.dot(toTransform),
			j.dot(toTransform),
			k.dot(toTransform)
		);
	}
	
	/**
	 * Given a vector in the basis {i,j,k}, compute the vector in the standard basis.
	 * i, j, and k must all be perpendicular unit vectors.
	 * All vectors are assumed to be in math basis.
	 * @returns A vector in math basis.
	 */
	public static inverseChangeBasis(toTransform: Vector3D, i: Vector3D, j: Vector3D, k: Vector3D): Vector3D {
		// math change of basis formula via martix multiplication
		return new Vector3D(
			i.X * toTransform.X + j.X * toTransform.Y + k.X * toTransform.Z,
			i.Y * toTransform.X + j.Y * toTransform.Y + k.Y * toTransform.Z,
			i.Z * toTransform.X + j.Z * toTransform.Y + k.Z * toTransform.Z
		);
	}
	
	/**
	 * Rotates a vector counterclockwise relative to an axis.
	 * All vectors are assumed to be in math basis.
	 * https://stackoverflow.com/questions/6721544/circular-rotation-around-an-arbitrary-axis
	 * @param vector The vector to be rotated.
	 * @param axis The axis of rotation. Assumed to be a unit vector.
	 * @param angle The angle of rotation.
	 * @returns A vector in math basis.
	 */
	public static axisRotation(vector: Vector3D, axis: Vector3D, angle: number): Vector3D {
		// Quaternion method
		const q0 = math.cos(angle / 2);
		const q1 = math.sin(angle / 2) * axis.X;
		const q2 = math.sin(angle / 2) * axis.Y;
		const q3 = math.sin(angle / 2) * axis.Z;
	
		return new Vector3D(
			(q0*q0 + q1*q1 - q2*q2 - q3*q3) * vector.X + 2*(q1*q2 - q0*q3) * vector.Y + 2*(q1*q3 + q0*q2) * vector.Z,
			2*(q1*q2 + q0*q3) * vector.X + (q0*q0 - q1*q1 + q2*q2 - q3*q3) * vector.Y + 2*(q2*q3 - q0*q1) * vector.Z,
			2*(q1*q3 - q0*q2) * vector.X + 2*(q2*q3 + q0*q1) * vector.Y + (q0*q0 - q1*q1 - q2*q2 + q3*q3) * vector.Z
		);
	
		// // Rotation matrix method
		// const c = math.cos(angle);
		// const s = math.sin(angle);
		// const oneMinusC = 1 - c;
		// const matrix = [
		// 	[
		// 		axis.X * axis.X * oneMinusC + c,
		// 		axis.X * axis.Y * oneMinusC - axis.Z * s,
		// 		axis.X * axis.Z * oneMinusC + axis.Y * s
		// 	],
		// 	[
		// 		axis.Y * axis.X * oneMinusC + axis.Z * s,
		// 		axis.Y * axis.Y * oneMinusC + c,
		// 		axis.Y * axis.Z * oneMinusC - axis.X * s
		// 	],
		// 	[
		// 		axis.Z * axis.X * oneMinusC - axis.Y * s,
		// 		axis.Z * axis.Y * oneMinusC + axis.X * s,
		// 		axis.Z * axis.Z * oneMinusC + c
		// 	]
		// ];
	
		// return new Vector3D(
		// 	matrix[0][0] * vector.X + matrix[0][1] * vector.Y + matrix[0][2] * vector.Z,
		// 	matrix[1][0] * vector.X + matrix[1][1] * vector.Y + matrix[1][2] * vector.Z,
		// 	matrix[2][0] * vector.X + matrix[2][1] * vector.Y + matrix[2][2] * vector.Z
		// )
	}

	public deepClone(): Orientation {
		error("Orientation deepClone() Method disabled");
	}
	
}
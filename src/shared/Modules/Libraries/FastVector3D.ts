import Vector3D from "./Vector3D";

export interface Vector {
	X: number;
	Y: number;
	Z: number;
}

/**
 * Uses static methods and in-place modifications
 * to eliminate the overhead of a constructor.
 * 
 * **In all methods which return a `Vector`, `vec` is mutated.**
 */
export default class FastV3D {
	static create(x: number, y: number, z: number): Vector {
		return { X: x, Y: y, Z: z };
	}
	
	static clone(vec: Vector): Vector {
		return { X: vec.X, Y: vec.Y, Z: vec.Z };
	}

	static negate(vec: Vector): Vector {
		vec.X = -vec.X;
		vec.Y = -vec.Y;
		vec.Z = -vec.Z;
		return vec;
	}

	static add(vec: Vector, other: Vector | number): Vector {
		if (typeIs(other, "number")) {
			vec.X += other;
			vec.Y += other;
			vec.Z += other;
			return vec;
		} else {
			vec.X += other.X;
			vec.Y += other.Y;
			vec.Z += other.Z;
			return vec;
		}
	}

	static setAdd(dst: Vector, src: Vector, other: Vector | number): Vector {
		if (typeIs(other, "number")) {
			dst.X = src.X + other;
			dst.Y = src.Y + other;
			dst.Z = src.Z + other;
			return dst;
		} else {
			dst.X = src.X + other.X;
			dst.Y = src.Y + other.Y;
			dst.Z = src.Z + other.Z;
			return dst;
		}
	}

	static sub(vec: Vector, other: Vector | number): Vector {
		if (typeIs(other, "number")) {
			vec.X -= other;
			vec.Y -= other;
			vec.Z -= other;
			return vec;
		} else {
			vec.X -= other.X;
			vec.Y -= other.Y;
			vec.Z -= other.Z;
			return vec;
		}
	}

	static setSub(dst: Vector, src: Vector, other: Vector | number): Vector {
		if (typeIs(other, "number")) {
			dst.X = src.X - other;
			dst.Y = src.Y - other;
			dst.Z = src.Z - other;
			return dst;
		} else {
			dst.X = src.X - other.X;
			dst.Y = src.Y - other.Y;
			dst.Z = src.Z - other.Z;
			return dst;
		}
	}

	static mul(vec: Vector, other: Vector | number): Vector {
		if (typeIs(other, "number")) {
			vec.X *= other;
			vec.Y *= other;
			vec.Z *= other;
			return vec;
		} else {
			vec.X *= other.X;
			vec.Y *= other.Y;
			vec.Z *= other.Z;
			return vec;
		}
	}

	static div(vec: Vector, other: Vector | number): Vector {
		if (typeIs(other, "number")) {
			vec.X /= other;
			vec.Y /= other;
			vec.Z /= other;
			return vec;
		} else {
			vec.X /= other.X;
			vec.Y /= other.Y;
			vec.Z /= other.Z;
			return vec;
		}
	}

	static idiv(vec: Vector, other: Vector | number): Vector {
		if (typeIs(other, "number")) {
			vec.X = math.floor(vec.X / other);
			vec.Y = math.floor(vec.Y / other);
			vec.Z = math.floor(vec.Z / other);
			return vec;
		} else {
			vec.X = math.floor(vec.X / other.X);
			vec.Y = math.floor(vec.Y / other.Y);
			vec.Z = math.floor(vec.Z / other.Z);
			return vec;
		}
	}

	static distance(vec: Vector, other: Vector): number {
		return math.sqrt(math.abs(
			(vec.X - other.X)
			+ (vec.Y - other.Y)
			+ (vec.Z - other.Z)
		));
	}

	static equals(vec: Vector, other: Vector): boolean {
		return vec.X === other.X && vec.Y === other.Y && vec.Z === other.Z;
	}

	static magnitude(vec: Vector): number {
		return math.sqrt(vec.X ** 2 + vec.Y ** 2 + vec.Z ** 2);
	}

	static unit(vec: Vector): Vector {
		return FastV3D.div(vec, FastV3D.magnitude(vec));
	}

	static abs(vec: Vector): Vector {
		vec.X = math.abs(vec.X);
		vec.Y = math.abs(vec.Y);
		vec.Z = math.abs(vec.Z);
		return vec;
	}

	static ceil(vec: Vector): Vector {
		vec.X = math.ceil(vec.X);
		vec.Y = math.ceil(vec.Y);
		vec.Z = math.ceil(vec.Z);
		return vec;
	}

	static floor(vec: Vector): Vector {
		vec.X = math.floor(vec.X);
		vec.Y = math.floor(vec.Y);
		vec.Z = math.floor(vec.Z);
		return vec;
	}

	static sign(vec: Vector): Vector {
		vec.X = math.sign(vec.X);
		vec.Y = math.sign(vec.Y);
		vec.Z = math.sign(vec.Z);
		return vec;
	}

	static cross(vec: Vector, other: Vector): Vector {
		vec.X = vec.Z * other.Y - vec.Y * other.Z;
		vec.Y = vec.X * other.Z - vec.Z * other.X;
		vec.Z = vec.Y * other.X - vec.X * other.Y;
		return vec;
	}

	static setCross(dst: Vector, src: Vector, other: Vector): Vector {
		dst.X = src.Z * other.Y - src.Y * other.Z;
		dst.Y = src.X * other.Z - src.Z * other.X;
		dst.Z = src.Y * other.X - src.X * other.Y;
		return dst;
	}

	static angle(vec: Vector, other: Vector, axis?: Vector): number {
		const result = math.acos(FastV3D.dot(FastV3D.unit(vec), FastV3D.unit(other)));
		if (axis) {
			const vecClone = FastV3D.create(vec.X, vec.Y, vec.Z);
			return result * math.sign(FastV3D.dot(FastV3D.cross(vecClone, other), axis));
		}
		return result;
	}

	static dot(vec: Vector, other: Vector): number {
		return vec.X * other.X + vec.Y * other.Y + vec.Z * other.Z;
	}

	static fuzzyEq(vec: Vector, other: Vector, epsilon = 1e-5): boolean {
		return math.abs(FastV3D.magnitude(vec) ** 2 - FastV3D.magnitude(other) ** 2) < epsilon;
	}

	static lerp(vec: Vector, other: Vector, alpha: number): Vector {
		const otherClone = FastV3D.create(other.X, other.Y, other.Z);
		const toOther = FastV3D.sub(otherClone, vec);
		return FastV3D.add(vec, FastV3D.mul(toOther, alpha));
	}

	static max(vec: Vector): Vector {
		const maxVal = math.max(vec.X, vec.Y, vec.Z);
		vec.X = maxVal;
		vec.Y = maxVal;
		vec.Z = maxVal;
		return vec;
	}

	static min(vec: Vector): Vector {
		const minVal = math.min(vec.X, vec.Y, vec.Z);
		vec.X = minVal;
		vec.Y = minVal;
		vec.Z = minVal;
		return vec;
	}

	static toVector3(vec: Vector): Vector3 {
		return new Vector3(vec.X, vec.Y, vec.Z);
	}

	static toVector3D(vec: Vector): Vector3D {
		return new Vector3D(vec.X, vec.Y, vec.Z);
	}
}

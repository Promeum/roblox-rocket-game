
export default class Vector3D {
	public readonly X: number;
	public readonly Y: number;
	public readonly Z: number;

	constructor(x: number, y: number, z: number) {
		this.X = x;
		this.Y = y;
		this.Z = z;
	}

	// --- Static constructors ---

	static fromNormalId(normal: number): Vector3D {
		if (normal >= 0 && normal <= 5) {
			if (normal < 3) {
				return Vector3D.fromAxis(normal);
			} else {
				return Vector3D.fromAxis(normal - 3).negate();
			}
		} else {
			throw `bad argument: expected number from 0 to 5, got ${normal}`;
		}
	}

	static fromAxis(axis: number): Vector3D {
		switch (axis) {
			case 0:
				return Vector3D.xAxis;
			case 1:
				return Vector3D.yAxis;
			case 2:
				return Vector3D.zAxis;
			default:
				throw `bad argument: expected number from 0 to 2, got ${axis}`;
		}
	}

	static fromVector3(vector: Vector3): Vector3D {
		return new Vector3D(vector.X, vector.Y, vector.Z);
	}

	// --- Constants ---
	static readonly zero = new Vector3D(0, 0, 0);
	static readonly one = new Vector3D(1, 1, 1);
	static readonly xAxis = new Vector3D(1, 0, 0);
	static readonly yAxis = new Vector3D(0, 1, 0);
	static readonly zAxis = new Vector3D(0, 0, 1);

	// --- String representation ---
	toString(): string {
		return `Vector3D(${this.X}, ${this.Y}, ${this.Z})`;
	}

	// --- Unary operations ---
	negate(): Vector3D {
		return new Vector3D(-this.X, -this.Y, -this.Z);
	}

	// --- Binary arithmetic with overloads ---

	add(other: Vector3D | number): Vector3D {
		if (typeIs(other, "number")) {
			return new Vector3D(this.X + other, this.Y + other, this.Z + other);
		} else {
			return new Vector3D(this.X + other.X, this.Y + other.Y, this.Z + other.Z);
		}
	}

	sub(other: Vector3D | number): Vector3D {
		if (typeIs(other, "number")) {
			return new Vector3D(this.X - other, this.Y - other, this.Z - other);
		} else {
			return new Vector3D(this.X - other.X, this.Y - other.Y, this.Z - other.Z);
		}
	}

	mul(other: Vector3D | number): Vector3D {
		if (typeIs(other, "number")) {
			return new Vector3D(this.X * other, this.Y * other, this.Z * other);
		} else {
			return new Vector3D(this.X * other.X, this.Y * other.Y, this.Z * other.Z);
		}
	}

	div(other: Vector3D | number): Vector3D {
		if (typeIs(other, "number")) {
			return new Vector3D(this.X / other, this.Y / other, this.Z / other);
		} else {
			return new Vector3D(this.X / other.X, this.Y / other.Y, this.Z / other.Z);
		}
	}

	idiv(other: Vector3D | number): Vector3D {
		if (typeIs(other, "number")) {
			return new Vector3D(math.floor(this.X / other), math.floor(this.Y / other), math.floor(this.Z / other));
		} else {
			return new Vector3D(math.floor(this.X / other.X), math.floor(this.Y / other.Y), math.floor(this.Z / other.Z));
		}
	}

	equals(other: Vector3D): boolean {
		return this.X === other.X && this.Y === other.Y && this.Z === other.Z;
	}

	// --- Vector math methods ---

	magnitude(): number {
		return math.sqrt(this.X ** 2 + this.Y ** 2 + this.Z ** 2);
	}

	unit(): Vector3D {
		return this.div(this.magnitude());
	}

	abs(): Vector3D {
		return new Vector3D(math.abs(this.X), math.abs(this.Y), math.abs(this.Z));
	}

	ceil(): Vector3D {
		return new Vector3D(math.ceil(this.X), math.ceil(this.Y), math.ceil(this.Z));
	}

	floor(): Vector3D {
		return new Vector3D(math.floor(this.X), math.floor(this.Y), math.floor(this.Z));
	}

	sign(): Vector3D {
		return new Vector3D(math.sign(this.X), math.sign(this.Y), math.sign(this.Z));
	}

	cross(other: Vector3D): Vector3D {
		// return new Vector3D( // math notation of X forward, Y right, and Z up
		// 	this.Y * other.Z - this.Z * other.Y,
		// 	this.Z * other.X - this.X * other.Z,
		// 	this.X * other.Y - this.Y * other.X,
		// );
		return new Vector3D( // game notation of Z forward, X right, and Y up (the subtraction order is reversed)
			this.Z * other.Y - this.Y * other.Z,
			this.X * other.Z - this.Z * other.X,
			this.Y * other.X - this.X * other.Y,
		);
		// In practice: use Vector3D with Y and Z swapped before cross product!
		// cross product result: math = (x, y, z) -> game = (-x, -y, -z)
	}

	angle(other: Vector3D, axis?: Vector3D): number {
		const result = math.acos(this.unit().dot(other.unit()));
		if (axis) {
			return result * math.sign(this.cross(other).dot(axis));
		}
		return result;
	}

	dot(other: Vector3D): number {
		return this.X * other.X + this.Y * other.Y + this.Z * other.Z;
	}

	fuzzyEq(other: Vector3D, epsilon = 1e-5): boolean {
		return math.abs(this.magnitude() ** 2 - other.magnitude() ** 2) < epsilon;
	}

	lerp(other: Vector3D, alpha: number): Vector3D {
		const toOther = other.sub(this);
		return this.add(toOther.mul(alpha));
	}

	max(): Vector3D {
		const maxVal = math.max(this.X, this.Y, this.Z);
		return new Vector3D(maxVal, maxVal, maxVal);
	}

	min(): Vector3D {
		const minVal = math.min(this.X, this.Y, this.Z);
		return new Vector3D(minVal, minVal, minVal);
	}

	toVector3(): Vector3 {
		return new Vector3(this.X, this.Y, this.Z);
	}
}

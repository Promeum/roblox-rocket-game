import Vector3D from "../Libraries/Vector3D";
import { SOLAR_SYSTEM_SCALE } from "shared/Constants";

/**
 * Base module (class) for all other modules.
 * Immutable. Abstract. Non-instantiatable.
 */
export default class BaseModule {
    public equals(other: BaseModule | undefined): boolean {
        return other instanceof BaseModule
    }

	public deepClone(): BaseModule {
        return this
    }

    /**
     * DEBUG ONLY
     */
    public _testpart(name: string, color: Color3, size: number, position: Vector3D, parent: Instance) {
        const startpart: Part = new Instance("Part");
        startpart.Name = name;
        startpart.Anchored = true;
        startpart.Size = Vector3.one.mul(size);
        startpart.Material = Enum.Material.Neon;
        startpart.Color = color;
        startpart.Position = position.mul(SOLAR_SYSTEM_SCALE).toVector3();
        startpart.Parent = parent;
    }
}

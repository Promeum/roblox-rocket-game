import Vector3D from "../Libraries/Vector3D";

/**
 * Base module (class) for all other modules.
 * Immutable. Abstract. Non-instantiatable.
 */
export default abstract class BaseModule {
    public equals(other?: BaseModule): other is BaseModule {
        return other instanceof BaseModule
    }

	public abstract deepClone(): BaseModule

    /**
     * DEBUG ONLY
     */
    public _testpart(name: string, color: Color3, size: Vector3D, position: Vector3D, parent: Instance, shape?: Enum.PartType) {
        const startpart: Part = new Instance("Part");
        startpart.Name = name;
        startpart.Anchored = true;
        startpart.Size = size.toVector3();
        startpart.Shape = shape ?? Enum.PartType.Block;
        startpart.Material = Enum.Material.Neon;
        startpart.Color = color;
        startpart.Position = position.toVector3();
        startpart.Parent = parent;
    }
}

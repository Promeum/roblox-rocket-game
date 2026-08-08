import Vector3D from "shared/Modules/Libraries/Vector3D";
import GravityCelestial from "../../Celestial/GravityCelestial";
import Display from "..";
import Tetrahedron from "./Tetrahedron";
import { MAX_LOD_DEPTH, RENDER_DEPTH_FN } from "./Tetra";

type displayFolder = Folder & { TerrainFolder: Model }

/**
 * Interface between global rendering and terrain rendering system
 */
export default class TerrainDisplay extends Display {
    static readonly displayFolderBase: displayFolder = new Instance("Folder") as displayFolder;
    static tetrahedronBase: Tetrahedron;

    // Initialize displayFolderBase
    static {
        this.setMaxLOD(MAX_LOD_DEPTH);
        this.displayFolderBase.Name = "TerrainDisplay";
        const model = new Instance("Model");
        model.Name = "TerrainFolder";
        // const primaryPart = new Instance("Part");
        // primaryPart.Name = "PrimaryPart";
        // primaryPart.Anchored = true;
        // primaryPart.Parent = model;
        // model.PrimaryPart = primaryPart;
        model.Parent = this.displayFolderBase;
    }

    declare readonly displayFolder: displayFolder;

    // Settings
    private scale!: number;// = 1 / 500_000_000; // 1 / 5_000_000;
    private offset!: Vector3D;

    // Data
    private terrain: Tetrahedron;
    private firstDraw = true;

    // Constructor

    constructor(
        gravityCelestial: GravityCelestial,
        scale: number = 1 / 500_000_000, offset: Vector3D = Vector3D.zero,
        renderPosition: Vector3D = new Vector3D(gravityCelestial.radius,0,0)
    ) {
        super();

        this.displayFolder = TerrainDisplay.displayFolderBase.Clone();
        this.scale = scale;
        this.offset = offset;
        this.terrain = TerrainDisplay.tetrahedronBase.duplicate(
            gravityCelestial.heightmap,
            this.displayFolder.TerrainFolder
        );
    }

    /** TODO: Add a LOD calculation object type that makes this function obsolete? */
    static setMaxLOD(maxDepth: number): void {
        this.tetrahedronBase = Tetrahedron.instantiate(maxDepth);
    }

    // Public methods

    /**
     * @param offset Relative to global space
     * @param renderDistance Maximum distance to render terrain
     * @param renderPosition Relative to center of this GravityCelestial
     */
    override draw(
        scale?: number, offset?: Vector3D
    ): Folder {
        if (scale !== undefined && scale !== this.scale) {
            this.scale = scale;
        } else scale = undefined;
        if (offset !== undefined && !offset.equals(this.offset)) {
            this.offset = offset;
        } else offset = undefined;

        if (offset || scale) {
            this.terrain.probeLOD(Vector3D.zero, RENDER_DEPTH_FN);
            this.terrain.reproject();
            this.terrain.draw(this.scale, this.offset, scale !== undefined);
        } else if (this.firstDraw) {
            this.terrain.probeLOD(Vector3D.zero, RENDER_DEPTH_FN);
            this.terrain.reproject();
            this.terrain.draw(this.scale, this.offset, true);
            this.firstDraw = false;
        }

        return this.displayFolder;
    }
}


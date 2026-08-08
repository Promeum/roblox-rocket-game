import Vector3D from "shared/Modules/Libraries/Vector3D";
import { centerpointTri, Tetra, WedgeData } from "./Tetra";
import Datamap from "../../Datamap";
import FastV3D from "shared/Modules/Libraries/FastVector3D";

/** Root instance for Tetra quadtree */
export default class Tetrahedron {
    private toDraw: Tetra[] = [];
    private wedges: WedgeData[] = [];

    private constructor(
        private front: Tetra[],
        private bottom: Tetra[],
        private left: Tetra[],
        private right: Tetra[],
        private datamap?: Datamap,
        private terrainParent?: Model
    ) {}

    /** Projects sphere at preliminary probe depth */
    static instantiate(maxDepth: number): Tetrahedron {
        // vertices
        const back = new Vector3D(-1, 0, 0);
        const top = new Vector3D(1 / 3, 2 * math.sqrt(2) / 3, 0);
        const left = new Vector3D(1 / 3, -math.sqrt(2) / 3, -math.sqrt(6) / 3);
        const right = new Vector3D(1 / 3, -math.sqrt(2) / 3, math.sqrt(6) / 3);

        // faces
        const frontTri = centerpointTri({
            top: top, left: left, right: right, center: undefined
        });
        const bottomTri = centerpointTri({
            top: back, left: right, right: left, center: undefined
        });
        const leftTri = centerpointTri({
            top: back, left: left, right: top, center: undefined
        });
        const rightTri = centerpointTri({
            top: back, left: top, right: right, center: undefined
        });

        // instantiate tetras
        const tetrahedron = new Tetrahedron(
            Tetra.instantiate(maxDepth, frontTri),
            Tetra.instantiate(maxDepth, bottomTri),
            Tetra.instantiate(maxDepth, leftTri),
            Tetra.instantiate(maxDepth, rightTri)
        );
        return tetrahedron;
    }

    /**
     * Deep-clones a universe-wide template with `maxDepth` already set
     */
    duplicate(datamap?: Datamap, terrainParent?: Model): Tetrahedron {
        return new Tetrahedron(
            Tetra.duplicate(this.front),
            Tetra.duplicate(this.bottom),
            Tetra.duplicate(this.left),
            Tetra.duplicate(this.right),
            datamap ?? this.datamap,
            terrainParent ?? this.terrainParent
        );
    }

    /**
     * Calculates which Tetra are leaves.
     * @param renderPosition Camera location
     * @param renderDepth Quadtree depth as a function of distance
     */
    probeLOD(
        renderPosition: Vector3D,
        renderDepth: (renderDistance: number) => number
    ): void {
        this.toDraw = Tetra.probeLOD(this.front, renderPosition, renderDepth);
        this.toDraw = [...this.toDraw, ...Tetra.probeLOD(this.bottom, renderPosition, renderDepth)];
        this.toDraw = [...this.toDraw, ...Tetra.probeLOD(this.left, renderPosition, renderDepth)];
        this.toDraw = [...this.toDraw, ...Tetra.probeLOD(this.right, renderPosition, renderDepth)];
    }

    /**
     * Project points to proper terrain altitude
     */
    reproject(): void {
        Tetra.reproject(this.toDraw, this.datamap!);
    }
    
//     // Variation without BulkMoveTo()
//     // TODO: Compare strategies when redraw is done
//     // * Try scale-only, offset-only, and both and compare efficiency

//     private update(scale: number, offset: Vector3D, updateScale: boolean) {
//         if (updateScale) {
//             this.terrain.terrainFolder.ScaleTo(scale); // Scale positions
// debug.profilebegin("Manual resizing")
//             for (const data of this.terrain.wedges) {
//                 // Scale sizes (since they may have been maxxed out at 2048)
//                 data.part.Size = data.size.mul(scale);//.toVector3();
//             }
// debug.profileend()
//         }

//         this.terrain.terrainFolder.PivotTo(
//             new CFrame(offset.mul(scale).toVector3())
//         );
//     }

    private update(scale: number, offset: Vector3D, updateScale: boolean) {
// debug.profilebegin("Manual terrain resizing")
        const bulkMoveData: [WedgePart[], CFrame[]] = [[], []];
        for (const data of this.wedges) {
            bulkMoveData[0].push(data.part);
            bulkMoveData[1].push(CFrame.fromMatrix(
                FastV3D.toVector3(
                    FastV3D.mul(
                        FastV3D.add(
                            FastV3D.clone(data.position),
                            offset
                        ),
                        scale
                    )
                ),
                data.rotation.XVector,
                data.rotation.YVector,
                data.rotation.ZVector
            ));
            // Scale sizes (since they may have been maxxed out at 2048)
            if (updateScale) data.part.Size = data.size.mul(scale);
        }
// debug.profileend()

        game.Workspace.BulkMoveTo(
            bulkMoveData[0], bulkMoveData[1],
            Enum.BulkMoveMode.FireCFrameChanged
        );
    }

    /**
     * This method is very expensive
     * (uses `Instance.Parent()`, `Instance.Clone()` in `Tetra.draw()`)
     */
    draw(scale: number, offset: Vector3D, updateScale: boolean) {
        for (const tetra of this.toDraw) if (tetra.wedges) tetra.wedges[0].part.Parent = tetra.wedges[1].part.Parent = undefined;

        this.wedges = Tetra.draw(this.toDraw/*, this.datamap! */);
        this.update(scale, offset, updateScale);

        for (const tetra of this.toDraw) tetra.wedges![0].part.Parent = tetra.wedges![1].part.Parent = this.terrainParent!;
    }
}

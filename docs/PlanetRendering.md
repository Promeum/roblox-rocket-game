# Planet rendering

- Generate terrain based on planet-wide heightmap, stored in either an image or hardcoded data
- Relevant modules:
  - `src/shared/Modules/BaseModule/Display/TerrainDisplay/`
  - `src/shared/Modules/BaseModule/Display/Datamap.ts`
  - `src/shared/Modules/BaseModule/View/WorldView.ts`

## Datamap module

- Stores a heightmap, provides accessors

## Terrain

Triangular Quadtree tesselation

## Level Of Detail (LOD)

- Implementation: Naive distance-based density algorithm
- TODO: Implement 'stitching' (cover terrain gaps)
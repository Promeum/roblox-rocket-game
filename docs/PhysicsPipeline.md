# Physics pipeline

- The relationship between orbital calculations and craft motion.
- Relevant modules:
  - `src/shared/Modules/BaseModule/Universe/UniverseInstance.ts`
  - `src/shared/Modules/BaseModule/Celestial/PhysicsCelestial.ts`
  - `src/shared/Modules/BaseModule/Craft.ts`
  - `src/shared/Modules/BaseModule/CraftPart.ts`
  - `src/shared/Modules/BaseModule/RigidBody.ts`

## Physics modes

```TypeScript
(method) PhysicsCelestial.setPhysicsMode(physicsMode: "rails" | "physics")
```

### "rails"

Orbital simulation only, Roblox physics paused

### "physics"

Hybrid of orbital mechanics and Roblox physics

- `PreSimulation()` → Propogate downstream to Roblox simulation
- `PostSimulation()` → Update upstream orbital physics simulation
  - `CompositeTrajectory` instance rebuilt
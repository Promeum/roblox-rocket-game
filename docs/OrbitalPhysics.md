# Orbital physics

- Keplerian two-body physics with patched conics.
- Relevant modules:
  - `src/shared/Modules/BaseModule/Relative/Trajectory/`
  - `src/shared/Modules/BaseModule/Relative/TrajectoryState/`
  - `src/shared/Modules/BaseModule/Relative/CelestialState/`

## Trajectory modules

- `LinearTrajectory`: Constant velocity (no gravity).
- `OrbitalTrajectory`: Keplerian two-body physics.
- `CompositeTrajectory`: Linked-list style composite of `LinearTrajectory` and `OrbitalTrajectory`. Handles patched conics.

## Celestial modules

| Type | Trajectory | Gravity Source |
|------|------------|----------------|
| `Celestial` | (Trajectory abstract class) | N/A |
| `GravityCelestial` | Orbital/Linear | Self-gravity + parent orbit |
| `PhysicsCelestial` | Composite | Two-body simulation (massless satellite) |
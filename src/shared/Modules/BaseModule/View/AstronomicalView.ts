import Vector3D from "shared/Modules/Libraries/Vector3D";

import Chrono from "../Chrono";
import LinearTrajectory from "../Relative/Trajectory/LinearTrajectory";
import OrbitalTrajectory from "../Relative/Trajectory/OrbitalTrajectory";
import GravityCelestial from "../Celestial/GravityCelestial";
import PhysicsCelestial from "../Celestial/PhysicsCelestial";
import UniverseInstance from "../UniverseInstance";
import GravityDisplay from "../Display/GravityDisplay";
import TrajectoryDisplay from "../Display/TrajectoryDisplay";
import CompositeTrajectoryDisplay from "../Display/CompositeTrajectoryDisplay";
import View from ".";
import MapCraftDisplay from "../Display/MapCraftDisplay";

type viewFolder = Folder & {
    Planets: Folder;
    Crafts: Folder;
    PlanetaryTrajectories: Folder;
    CompositeTrajectories: Folder;
};

export default class AstronomicalView extends View {
    private static readonly viewFolderBase: viewFolder = new Instance("Folder") as viewFolder;

    // Initialize viewFolderBase
    static {
        this.viewFolderBase.Name = "AstronomicalView";
        const planets: Folder = new Instance("Folder");
        const crafts: Folder = new Instance("Folder");
        const planetaryTrajectories: Folder = new Instance("Folder");
        const compositeTrajectories: Folder = new Instance("Folder");
        planets.Name = "Planets";
        crafts.Name = "Crafts";
        planetaryTrajectories.Name = "PlanetaryTrajectories";
        compositeTrajectories.Name = "CompositeTrajectories";
        planets.Parent = crafts.Parent = planetaryTrajectories.Parent = 
            compositeTrajectories.Parent = this.viewFolderBase;
    }

    declare readonly viewFolder: viewFolder;

    // Settings
    // private time: Chrono;
    // private scale: number; // 1 / 500_000_000 // 1 / 5_000_000;
    private offset: Vector3D;
    /** Number of Beams an orbit line should have */
    private orbitResolution: number;
    private trajectoryWidth: number;

    // Display data
    private readonly gravityDisplays: GravityDisplay[] = [];
    private readonly mapCraftDisplays: MapCraftDisplay[] = [];
    private readonly trajectoryDisplays: TrajectoryDisplay<LinearTrajectory | OrbitalTrajectory>[] = [];
    private readonly compositeTrajectoryDisplays: CompositeTrajectoryDisplay[] = [];
    // Draw optimization
    private displayIndex = 0;
    private displayAmt: number;

    // Constructor

    constructor(
        universe: UniverseInstance, orbitResolution: number = 380,
        scale: number = 1 / 500_000_000, offset: Vector3D = Vector3D.zero,
        trajectoryWidth: number = 0.5
    ) {
		const time = universe.time;

        super(universe);

        this.viewFolder = AstronomicalView.viewFolderBase.Clone();
        this.orbitResolution = orbitResolution;
        this.trajectoryWidth = trajectoryWidth;
        // this.time = time;
        // this.scale = scale;
        this.offset = offset;

        // Setup GravityCelestials and their Trajectories
        for (const celestial of this.allGravityCelestials()) {
            // GravityDisplay
            const gravityDisplay = new GravityDisplay(celestial, celestial.color);
            gravityDisplay.draw(scale, offset, time);
            gravityDisplay.displayFolder.Parent = this.viewFolder.Planets;
            this.gravityDisplays.push(gravityDisplay);

            // TrajectoryDisplay
            const startTime = celestial.trajectory.start.time.toSeconds()
            const endTime = (celestial.trajectory instanceof OrbitalTrajectory ?
                    celestial.trajectory.getPeriod() : 1e12) + startTime
            const trajectoryDisplay = new TrajectoryDisplay(
                celestial.trajectory, celestial.trajectory.start.time,
                Chrono.fromSeconds(endTime + (endTime - startTime) / orbitResolution) // hotfix for gap in line
            );
            trajectoryDisplay.draw(
                scale, offset, time, undefined, undefined,
                celestial.color, trajectoryWidth, orbitResolution
            );
            trajectoryDisplay.displayFolder.Parent = this.viewFolder.PlanetaryTrajectories
            this.trajectoryDisplays.push(trajectoryDisplay);
        }

        // Setup PhysicsCelestials and their CompositeTrajectories
        for (const celestial of this.allPhysicsCelestials()) {
            // MapCraftDisplay
            const mapCraftDisplay = new MapCraftDisplay(
                celestial, new BrickColor("Fire Yellow").Color, 1);
            mapCraftDisplay.draw(scale, offset, time);
            mapCraftDisplay.displayFolder.Parent = this.viewFolder.Crafts;
            this.mapCraftDisplays.push(mapCraftDisplay);

            // CompositeTrajectoryDisplay
            const compositeDisplay = new CompositeTrajectoryDisplay(celestial.trajectory);
            compositeDisplay.draw(
                scale, offset, time, undefined, undefined,
                new BrickColor("Really red").Color, trajectoryWidth,
                orbitResolution
            );
            compositeDisplay.displayFolder.Parent = this.viewFolder.CompositeTrajectories;
            this.compositeTrajectoryDisplays.push(compositeDisplay);
        }

        this.displayAmt = this.gravityDisplays.size() + this.trajectoryDisplays.size()
            + this.mapCraftDisplays.size() + this.compositeTrajectoryDisplays.size();
    }

    // Private methods

    private getDisplay(index: number) {
        const lists = [
            this.gravityDisplays, this.trajectoryDisplays,
            this.mapCraftDisplays, this.compositeTrajectoryDisplays];
        for (const list of lists) {
            const size = list.size();
            if (index < size)
                return list[index];
            else index -= size;
        }
        error(`getDisplay() index out of range: index = ${index}`);
    }

    /** Uses breadth-first search */
    private allGravityCelestials(): GravityCelestial[] {
        const result: GravityCelestial[] = [];
        const queue: GravityCelestial[] = [...this.universe.rootGravityCelestials];

        while (queue.size() > 0) {
            const celestial: GravityCelestial = queue.remove(0)!;
            for (const childCelestial of celestial.childGravityCelestials)
                queue.push(childCelestial);
            result.push(celestial);
        }

        return result;
    }

    private allPhysicsCelestials(): PhysicsCelestial[] {
        return this.universe.allPhysicsCelestials;
    }

    // Public methods

    override draw(
        scale?: number, offset?: Vector3D, time?: Chrono, orbitResolution?: number
    ): viewFolder {
        const startTime = os.clock();

        const endDisplayIndex = (this.displayIndex - 1) % this.displayAmt;
        do { // around 25 ms per frame maximum
            const display = this.getDisplay(this.displayIndex);
            if (display instanceof GravityDisplay || display instanceof MapCraftDisplay) {
                display.draw(scale, offset, time);
            } else {
                // Update trajectory if physics mode
                if (display instanceof CompositeTrajectoryDisplay) {
                    for (let i = 0; i < this.compositeTrajectoryDisplays.size(); i++) {
                        const celestial = this.allPhysicsCelestials()[i];
                        if (celestial.physicsMode === "physics") {
                            this.compositeTrajectoryDisplays[i].destroy();
                            const compositeDisplay = new CompositeTrajectoryDisplay(celestial.trajectory);
                            compositeDisplay.draw(
                                scale, offset, time, undefined, undefined,
                                new BrickColor("Really red").Color, this.trajectoryWidth,
                                orbitResolution ?? this.orbitResolution
                            );
                            compositeDisplay.displayFolder.Parent = this.viewFolder.CompositeTrajectories;
                            this.compositeTrajectoryDisplays[i] = compositeDisplay;

                            // compositeDisplay.draw(scale, offset ?? this.offset, time, undefined, undefined,
                            //             undefined, undefined, orbitResolution);
                        }
                    }
                }
                this.getDisplay(this.displayIndex).draw(scale, offset ?? this.offset, time, undefined, undefined,
                             undefined, undefined, orbitResolution);
            }
            this.displayIndex = (this.displayIndex + 1) % this.displayAmt;
        } while (os.clock() - startTime <= 0.025 && this.displayIndex !== endDisplayIndex);

        return this.viewFolder;
    }
}

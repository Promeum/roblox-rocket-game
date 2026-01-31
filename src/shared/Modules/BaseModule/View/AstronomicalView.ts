import Vector3D from "shared/Modules/Libraries/Vector3D";

import TemporalState from "../Relative/State/TemporalState";
import LinearTrajectory from "../Relative/Trajectory/LinearTrajectory";
import OrbitalTrajectory from "../Relative/Trajectory/OrbitalTrajectory";
import GravityCelestial from "../Celestial/GravityCelestial";
import PhysicsCelestial from "../Celestial/PhysicsCelestial";
import Universe from "../Universe";
import GravityDisplay from "../Display/GravityDisplay";
import TrajectoryDisplay from "../Display/TrajectoryDisplay";
import CompositeTrajectoryDisplay from "../Display/CompositeTrajectoryDisplay";
import View from ".";

type viewFolder = Folder & {
		Planets: Folder
		PlanetaryTrajectories: Folder,
		CompositeTrajectories: Folder
	};

export default class AstronomicalView extends View {
	private static readonly viewFolderBase: viewFolder = new Instance("Folder") as viewFolder;

	// Initialize viewFolderBase
	static {
		this.viewFolderBase.Name = "AstronomicalView";
		const planetsFolder: Folder = new Instance("Folder");
		planetsFolder.Name = "Planets"
		planetsFolder.Parent = this.viewFolderBase;
		const trajectoriesFolder: Folder = new Instance("Folder");
		trajectoriesFolder.Name = "PlanetaryTrajectories"
		trajectoriesFolder.Parent = this.viewFolderBase;
		const compositeTrajectoriesFolder: Folder = new Instance("Folder");
		compositeTrajectoriesFolder.Name = "CompositeTrajectories"
		compositeTrajectoriesFolder.Parent = this.viewFolderBase;
	}

	declare readonly viewFolder: viewFolder;

	// Settings
	private time: TemporalState;
	private scale: number;// = 1 / 500_000_000; // 1 / 5_000_000;
	private offset: Vector3D;
	/** Number of Beams an orbit line should have */
	private orbitResolution: number;

	// Display data
	private readonly gravityDisplays: GravityDisplay[] = [];
	private readonly trajectoryDisplays: TrajectoryDisplay<LinearTrajectory | OrbitalTrajectory>[] = [];
	private readonly compositeTrajectoryDisplays: CompositeTrajectoryDisplay[] = [];

	// Draw optimization
	private displayIndex = 0;
	private displayAmt: number;
	private allDisplays;

	// Constructor

	public constructor(
		universe: Universe, orbitResolution: number = 380,
		time?: TemporalState, scale: number = 1 / 500_000_000,
		offset: Vector3D = Vector3D.zero, trajectoryWidth: number = 0.5
	) {
		super(universe);

		this.viewFolder = AstronomicalView.viewFolderBase.Clone();
		this.orbitResolution = orbitResolution;
		this.time = time ?? universe.globalTime;
		this.scale = scale;
		this.offset = offset;

		// Setup GravityCelestials and their Trajectories
		for (const celestial of this.allGravityCelestials()) {
			// GravityDisplay
			const gravityDisplay = new GravityDisplay(
				celestial, celestial.color, new TemporalState(0),
				this.scale, this.offset
			);
			gravityDisplay.displayFolder.Parent = this.viewFolder.Planets;
			this.gravityDisplays.push(gravityDisplay);

			// TrajectoryDisplay
			const startTime = celestial.trajectory.start.time.relativeTime
			const endTime = (celestial.trajectory instanceof OrbitalTrajectory ?
					celestial.trajectory.getPeriod() : 1e12) + startTime
			const trajectoryDisplay = new TrajectoryDisplay(
				celestial.trajectory, this.orbitResolution,
				this.time, celestial.trajectory.start.time,
				new TemporalState(
					endTime + (endTime - startTime) / this.orbitResolution),
				this.scale, this.offset, celestial.color, trajectoryWidth
			);
			trajectoryDisplay.displayFolder.Parent = this.viewFolder.PlanetaryTrajectories
			this.trajectoryDisplays.push(trajectoryDisplay);
		}

		// Setup PhysicsCelestials and their CompositeTrajectories
		for (const celestial of this.allPhysicsCelestials()) {
			// CompositeTrajectoryDisplay
			const compositeDisplay = new CompositeTrajectoryDisplay(
				celestial.trajectory, this.orbitResolution,
				this.time, celestial.trajectory.start.time,
				celestial.trajectory.timeRangesBase().pop()![1]!,
				this.scale, this.offset, new BrickColor("Really red").Color, trajectoryWidth
			);
			compositeDisplay.displayFolder.Parent = this.viewFolder.CompositeTrajectories;
			this.compositeTrajectoryDisplays.push(compositeDisplay);
		}

		this.allDisplays = [
			...this.gravityDisplays, ...this.trajectoryDisplays,
			...this.compositeTrajectoryDisplays];
		this.displayAmt = this.allDisplays.size();
	}

	// Draw
	override draw(
		scale?: number, offset?: Vector3D, time?: TemporalState
	): void {
		this.updateSettings(time, scale, offset);

		const startTime = os.clock();
		const endDisplayIndex = (this.displayIndex - 1) % this.displayAmt;
		do { // around 25 ms per frame maximum
			this.allDisplays[this.displayIndex].draw(scale, offset, time);
			this.displayIndex = (this.displayIndex + 1) % this.displayAmt;
		} while (os.clock() - startTime <= 0.025 && this.displayIndex !== endDisplayIndex);
	}

	// Methods
	
	public updateSettings(
		time?: TemporalState, scale?: number, offset?: Vector3D
	): void {
		if (scale !== undefined && scale <= 0)
			error("GravityDisplay updateSettings() invalid argument(s)");

		if (time) this.time = time;
		if (scale !== undefined) this.scale = scale;
		if (offset) this.offset = offset;
	}

	// Utility methods

	/** Uses breadth-first search */
	private allGravityCelestials(): GravityCelestial[] {
		const result: GravityCelestial[] = [];
		const stack: GravityCelestial[] = [...this.universe.rootGravityCelestials];

		while (stack.size() > 0) {
			const celestial: GravityCelestial = stack.remove(0)!;
			for (const childCelestial of celestial.childGravityCelestials)
				stack.push(childCelestial);
			result.push(celestial);
		}

		return result;
	}

	private allPhysicsCelestials(): PhysicsCelestial[] {
		return this.universe.allPhysicsCelestials;
	}

	override deepClone(): AstronomicalView {
		error("AstronomicalView deepClone() method disabled")
	}
}

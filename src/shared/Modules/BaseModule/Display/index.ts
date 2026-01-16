import BaseModule from "..";

export default abstract class Display extends BaseModule {
    public displayFolder: Folder = new Instance("Folder");

    protected constructor() {
        super();
        this.displayFolder.Name = "Display";
    }

    /**
     * Generates the 3D component to display in the Workspace.
     * @param scale Multiplier for all distances
     */
    public abstract draw(scale?: number): Folder

    override equals(other?: Display): other is Display {
        return this === other;
    }

    override deepClone(): Display {
        return this;
    }
}

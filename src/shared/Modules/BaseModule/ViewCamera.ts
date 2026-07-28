// import Vector3D from "shared/Modules/Libraries/Vector3D";
import Controller from "shared/Modules/Libraries/ArbitraryUp";

import BaseModule from ".";
import View from "./View";
import Vector3D from "../Libraries/Vector3D";

export default class ViewCamera extends BaseModule {
    readonly controller = new Controller(game.GetService("Players").LocalPlayer);
    readonly view: View;
    readonly camera: Camera;

    private connections;

    // Constructor

    public constructor(
        view: View, subject: BasePart
    ) {
        super();
        assert(game.Workspace.CurrentCamera,
               "ViewCamera cannot be instantiated without an active Camera");

        this.view = view;
        this.camera = game.Workspace.CurrentCamera;

        this.connections = [
            this.camera.GetPropertyChangedSignal("CameraType").Connect(() => {
                if (this.camera.CameraType !== Enum.CameraType.Track)
                    this.camera.CameraType = Enum.CameraType.Track;
            }),
            this.camera.GetPropertyChangedSignal("CameraSubject").Connect(() => {
                if (this.camera.CameraSubject !== subject)
                    this.camera.CameraSubject = subject;
            }),
        ];

        this.camera.CameraType = Enum.CameraType.Track;
        this.camera.CameraSubject = subject;

        task.delay(7, () => this.connections.forEach(c => c.Disconnect()));
    }

    public setNormal(normal: Vector3D | Vector3) {
        this.controller.SetNormal(
            typeIs(normal, "Vector3") ? normal : normal.toVector3()
        );
    }

    public update(deltaTime: number) {
        this.controller.Update(deltaTime);
    }
}

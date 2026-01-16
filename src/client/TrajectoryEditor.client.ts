// resources

const Player = game.GetService("Players").LocalPlayer
const UserInputService = game.GetService("UserInputService")
const RunService = game.GetService("RunService")

const TrajectoryEditorFrame: Frame = Player.WaitForChild("PlayerGui").WaitForChild("ScreenGui").WaitForChild("Frame") as Frame

// functions

function snap(value: number, delta: number): number {
	if (delta === 0)
		return value;
	return math.round(value / delta) * delta;
}

function setupSlider(dVSlider: Frame, range: NumberRange, step: number, textOut: TextLabel, attributeToChange: string, textFormat?: string) {
	const Slider: Frame = dVSlider.WaitForChild("Slider") as Frame;
	const SliderButton: TextButton = Slider.WaitForChild("SliderAdjust") as TextButton;

	let buttonDown: boolean = false

	Slider.MouseMoved.Connect(() => {
		buttonDown = UserInputService.IsMouseButtonPressed(Enum.UserInputType.MouseButton1);
	});

	SliderButton.MouseButton1Down.Connect(() => {
		buttonDown = true;
	});

	RunService.Heartbeat.Connect(() => {
		if (buttonDown) {
			const mouseX: number = UserInputService.GetMouseLocation().X
			let scaledValue: number = math.clamp((mouseX - Slider.AbsolutePosition.X) / Slider.AbsoluteSize.X, 0, 1)//math.clamp((mouseX - Slider.AbsolutePosition.X) / Slider.AbsoluteSize.X, 0, 1)
			scaledValue = snap(scaledValue, step / (range.Max - range.Min))

			TrajectoryEditorFrame.SetAttribute(attributeToChange, math.round(scaledValue * (range.Max - range.Min) + range.Min));
			SliderButton.Position = new UDim2(
				scaledValue,
				0,
				SliderButton.Position.Y.Scale,
				SliderButton.Position.Y.Offset
			)

			textOut.Text = (textFormat ?? "%d").format(TrajectoryEditorFrame.GetAttribute(attributeToChange) as number);
			
			if (!UserInputService.IsMouseButtonPressed(Enum.UserInputType.MouseButton1)) {
				buttonDown = false
			}
		}
	});
}

function setupToggleButton(button: GuiButton, attributeToChange: string) {
	button.Activated.Connect(() => {
		const newState: boolean = !(TrajectoryEditorFrame.GetAttribute(attributeToChange) as boolean);
		button.BackgroundColor3 = newState ? Color3.fromHex("#63FF5B") : Color3.fromHex("#FF5B5B");
		TrajectoryEditorFrame.SetAttribute(attributeToChange, newState);
	});
}

// main

const DVRANGE: NumberRange = new NumberRange(-3000, 3000)
const DVSTEP: number = 10

const frameX: Frame = TrajectoryEditorFrame.WaitForChild("X") as Frame;
setupSlider(frameX, DVRANGE, DVSTEP, frameX.WaitForChild("DeltaVLabel") as TextLabel, "dVX");
const frameY: Frame = TrajectoryEditorFrame.WaitForChild("Y") as Frame;
setupSlider(frameY, DVRANGE, DVSTEP, frameY.WaitForChild("DeltaVLabel") as TextLabel, "dVY");
const frameZ: Frame = TrajectoryEditorFrame.WaitForChild("Z") as Frame;
setupSlider(frameZ, DVRANGE, DVSTEP, frameZ.WaitForChild("DeltaVLabel") as TextLabel, "dVZ");

const frameTimeRange: Frame = TrajectoryEditorFrame.WaitForChild("TimeRange") as Frame;
setupSlider(frameTimeRange, new NumberRange(1e3, 1e6), 1e3, frameTimeRange.WaitForChild("TimeLabel") as TextLabel, "timeRange", "%e");
const frameGlobalTime: Frame = TrajectoryEditorFrame.WaitForChild("GlobalTime") as Frame;
setupSlider(frameGlobalTime, new NumberRange(0, 1e7), 1e3, frameGlobalTime.WaitForChild("TimeLabel") as TextLabel, "time", "%e");
setupToggleButton(frameGlobalTime.WaitForChild("ToggleTime") as TextButton, "timeRunning");

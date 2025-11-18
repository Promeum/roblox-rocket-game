local Player = game:GetService("Players").LocalPlayer
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")

local StarterGui = game:GetService("StarterGui")
local TrajectoryEditorFrame = StarterGui.ScreenGui.Frame
local DeltaVSliders = {TrajectoryEditorFrame.X, TrajectoryEditorFrame.Y}

local RANGE: NumberRange = NumberRange.new(-3000, 3000)
local STEP: number = 20

local buttonDown: boolean = false

local function snap(value: number, delta: number): number
	if delta == 0 then
		return value
	end
	return math.round(value / delta) * delta
end

for _, DeltaVSlider in DeltaVSliders do
	local Slider: Frame = DeltaVSlider.Slider
	local SliderButton: TextButton = Slider.SliderAdjust
	local TextOut: TextLabel = DeltaVSlider.DeltaVLabel

	Slider.MouseMoved:Connect(function()
		buttonDown = UserInputService:IsMouseButtonPressed(Enum.UserInputType.MouseButton1)
	end)

	SliderButton.MouseButton1Down:Connect(function()
		buttonDown = true
	end)

	RunService.PreSimulation:Connect(function()
		if buttonDown then
			local DeltaVValue: NumberValue = script.Parent:GetChildren()["Dv" .. DeltaVSlider.Name]
			local mouseX: number = UserInputService:GetMouseLocation().X
			local scaledValue: number = math.clamp((mouseX - Slider.AbsolutePosition.X) / Slider.AbsoluteSize.X, 0, 1)
			scaledValue = snap(scaledValue, STEP / (RANGE.Max - RANGE.Min))

			DeltaVValue.Value = math.round(scaledValue * (RANGE.Max - RANGE.Min) + RANGE.Min)
			SliderButton.Position = UDim2.new(
				scaledValue,
				SliderButton.AbsoluteSize.X / -2,
				SliderButton.Position.Y.Scale,
				SliderButton.Position.Y.Offset
			)

			TextOut.Text = DeltaVValue.Value
			
			if not UserInputService:IsMouseButtonPressed(Enum.UserInputType.MouseButton1) then
				buttonDown = false
			end
		end
	end)
end

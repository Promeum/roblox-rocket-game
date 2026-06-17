--[[
	A local module for setting an arbitrary up vector 
	based on the module of EgoMoose and Goldenstein64, updated by Temeraire149
	later updated by ppoopeefart
	
	How to use:
		[1] Insert PLayerModule into StarterPlayerScripts
		[2] Create a LocalScript to call the ArbitraryUp module (see ExampleOfLocalUsage)
	
	Quick Notes:
	- Place the PlayerModule under game.StarterPlayer.StarterPlayerScripts
	
	Properties:
		Controller.Enabled 
			> Whether or not the controller is active.
		Controller.NormalUpdateTick
			> The last tick() when the :SetNormal method was successfully called and updated.
			> This is useful for doing thing like debounces between transitioning normals.
	
	Methods:
	Controller:SetNormal(normal Vector3)
		> Sets normal as "up".
	Controller:Update(dt Float, speed Float)
		> Must be called after camera updates every frame.
		> dt is delta time, speed is the interpolation speed.
		> Omit speed for no interpolation.
]]


local CAMERA = game.Workspace.CurrentCamera

local Controller = {}
Controller.__index = Controller

function Controller.new(player: Player)
	local self = setmetatable({}, Controller)

	self.Enabled = true
	
	self.CameraModule = require(player.PlayerScripts:WaitForChild("PlayerModule")):GetCameras()
	self.Axis = Vector3.yAxis
	self:SetNormal(Vector3.yAxis)
	
	self.CameraDifference = CFrame.new()
	
	return self
end



-- [PUBLIC METHODS] --
function Controller:SetNormal(normal)
	--Rotates Camera to new normal--
	normal = normal.Unit

	local dot = Vector3.yAxis:Dot(normal)
	local cross = Vector3.yAxis:Cross(normal)

	if cross:Dot(cross) > 0 then
		-- Normal is not parallel to UP: rotate from UP to normal around the cross product axis
		cross = cross.Unit
		self.CameraDirection = CFrame.fromAxisAngle(cross, -math.acos(dot))
	elseif dot < 0 then
		-- Normal is opposite to UP (upside-down): 180° rotation around the stored axis
		self.CameraDirection = CFrame.fromAxisAngle(self.Axis, -math.pi)
	else
		-- Normal is parallel to UP: no rotation needed
		self.CameraDirection = CFrame.new()
	end

	self.Axis = cross:Dot(cross) > 0 and cross.Unit or self.Axis
	self.NormalUpdateTick = tick()
end

function Controller:Update(dt, speed)
	if (self.Enabled) then
		--update camera
		local diff = self.CameraDirection:Inverse()
		if speed then
			diff = self.CameraDifference:Lerp(diff, 0.1*60*dt*speed)
		end
		self.CameraDifference = diff
		
		local focusCF = CFrame.new(self.CameraModule.activeCameraController:GetSubjectPosition())
		local camCF = focusCF * diff * focusCF:ToObjectSpace(CAMERA.CFrame)
		if (self.CameraModule.activeOcclusionModule) then
			camCF,  focusCF = self.CameraModule.activeOcclusionModule:Update(dt, camCF, focusCF)
		end
		if (self.CameraModule.activeTrasnparencyController) then
			self.CameraModule.activeTrasnparencyController:Update()
		end
		CAMERA.CFrame = camCF
		CAMERA.Focus = focusCF
	else
		-- if disabled update the camera as usual
		local camCF, focusCF = CAMERA.CFrame, CAMERA.Focus
		if (self.CameraModule.activeOcclusionModule) then
			camCF, focusCF = self.CameraModule.activeOcclusionModule:Update(dt, camCF, focusCF)
		end
		if (self.CameraModule.activeTransparencyController) then
			self.CameraModule.activeTransparencyController:Update()
		end
		CAMERA.CFrame = camCF
		CAMERA.Focus = focusCF
	end
end

return Controller

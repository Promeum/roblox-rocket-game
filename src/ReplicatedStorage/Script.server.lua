local RunService = game:GetService("RunService")

print(`ReplicatedStorage`)

--[[

Notes

Units: (nvm)
	1 stud = 10 Mm
	1 stud/s = 10 Mm/s
	1 unit of mass = 10 Mg
	1 unit of density = 0.01 Mg / Mm^3 (10^(-20) g / cm^3)
	1 unit of force = 1000 Mg * Mm / s^2 (1 GN)

]]

-- set global variables
local Modules = require(game.ReplicatedStorage.Modules.Modules)
local Constants = require(game.ReplicatedStorage.Modules.Constants)
local BigNum = require(game.ReplicatedStorage.Modules.Libraries.BigNum)
local BigMath = require(game.ReplicatedStorage.Modules.BigMath)
local Vector3B = require(game.ReplicatedStorage.Modules.BaseModuleFolder.Vector3B)
local SolarSystemObject = require(game.ReplicatedStorage.Modules.BaseModuleFolder.MovingObjectFolder.SolarSystemObject)
local SolarSystemPhysicsBody = require(
	game.ReplicatedStorage.Modules.BaseModuleFolder.MovingObjectFolder.SolarSystemObjectFolder.SolarSystemPhysicsBody
)
local GravityBody = require(
	game.ReplicatedStorage.Modules.BaseModuleFolder.MovingObjectFolder.SolarSystemObjectFolder.SolarSystemPhysicsBodyFolder.GravityBody
)
local TrajectoryObject =
	require(game.ReplicatedStorage.Modules.BaseModuleFolder.MovingObjectFolder.SolarSystemObjectFolder.TrajectoryObject)

-- print("start")

-- bigmath performance test

-- local t1 = os.clock()
-- local points = {}
-- for i = 0, math.pi * 100, 1 do -- 100 iterations
-- 	table.insert(points, {
-- 		BigNum.newFraction(i, 100),
-- 		BigMath.pow(Constants.PI, BigNum.newFraction(i, 100)):Reduce()
-- 	})
-- end
-- local t2 = os.clock()

-- print(`time to execute: {t2 - t1}`)

-- local strlist = {}
-- local str = "["
-- for _, pt in points do
-- 	local n = tostring(pt[2].Numerator)
-- 	local d = tostring(pt[2].Denominator)

-- 	table.insert(strlist, `({pt[1]},{n} / {d}),`)
-- end
-- str = str .. table.concat(strlist):sub(1, -2) .. "]"

-- print(str)

-- vector3b performance test

-- local t1 = os.clock()

-- local l = Vector3B.new(9, 6, 4)
-- local result = l:Dot(Vector3B.new(2, 5, 7))
-- -- local points = {}
-- -- for i = 1, math.pi * 100, 1 do -- 100 iterations
-- -- 	table.insert(points, {
-- -- 		BigNum.newFraction(i, 100),
-- -- 		BigMath.log10(BigNum.newFraction(i, 100)):Reduce()
-- -- 	})
-- -- end

-- local t2 = os.clock()

-- print(`time to execute: {t2 - t1}`)

-- print(result)

print("range: " .. BigNum.GetRange())

-- error("end test area")

-- initialize Planets (only earth and moon for now...?)

 --[[
  TODO: fix TrajectoryObject before anything else
--]]
local Earth = GravityBody.new(Vector3B.new(0, 6e8, 0), Vector3B.new(0, 0, 0), Instance.new("Part"), "5.972168e24", 1.5e9)
local Moon = GravityBody.new(
	Vector3B.new(0, "36372000", "-403964992"),
	Vector3B.new(-967, 0, 0),
	Instance.new("Part"),
	"7.346e22",
	66e6,
	Earth
)
local MoonSat =
	SolarSystemPhysicsBody.new(Vector3B.new(0, 0, 1e7), Vector3B.new(-1010, 0, 0), Instance.new("Part"), Moon)

table.insert(Earth.ChildGravityBodies, Moon)
Moon.ParentGravityBody = Earth
table.insert(Moon.ChildSolarSystemPhysicsBodies, MoonSat)

local rootGravityBodies: { Modules.GravityBody } = {
	Earth,
}

-- set up the RootParts

Earth.RootPart.Shape, Moon.RootPart.Shape = Enum.PartType.Ball, Enum.PartType.Ball

Earth.RootPart.Size = Vector3.one * (6371e3 * Constants.SOLAR_SYSTEM_SCALE)
Moon.RootPart.Size = Vector3.one * (1737.4e3 * Constants.SOLAR_SYSTEM_SCALE)
MoonSat.RootPart.Size = Vector3.new(1, 4, 1.5) * (500000 * Constants.SOLAR_SYSTEM_SCALE)

Earth.RootPart.Anchored, Moon.RootPart.Anchored = true, true
MoonSat.RootPart.Anchored = true

Earth.RootPart.Material = Enum.Material.Neon
Earth.RootPart.BrickColor = BrickColor.new("Steel blue")

Moon.RootPart.Material = Enum.Material.Neon
Moon.RootPart.BrickColor = BrickColor.new("Dark stone grey")

MoonSat.RootPart.Material = Enum.Material.Neon
MoonSat.RootPart.BrickColor = BrickColor.new("Bright yellow")

Earth.RootPart.Position = Earth.Position * Constants.SOLAR_SYSTEM_SCALE
Moon.RootPart.Position = Moon.Position * Constants.SOLAR_SYSTEM_SCALE + Earth.RootPart.Position
MoonSat.RootPart.Position = MoonSat.Position * Constants.SOLAR_SYSTEM_SCALE + Moon.RootPart.Position

Earth.RootPart.Parent = workspace.Planets
Moon.RootPart.Parent = workspace.Planets
MoonSat.RootPart.Parent = workspace.Planets

local SOI = Earth.RootPart:Clone()
SOI.Transparency = 0.8
SOI.Material = Enum.Material.ForceField
SOI.Anchored = true
SOI.Parent = nil

local EarthSOI = SOI:Clone()
EarthSOI.Size = Vector3.one * (Earth.SOIRadius * 1 * Constants.SOLAR_SYSTEM_SCALE)
EarthSOI.Parent = Earth.RootPart

local MoonSOI = SOI:Clone()
MoonSOI.Size = Vector3.one * (Moon.SOIRadius * 1 * Constants.SOLAR_SYSTEM_SCALE)
MoonSOI.Parent = Moon.RootPart

-- print(`Period: {MoonSat.TrajectoryHolder:OrbitalPeriod(0)}`)
-- print(`Ecc: {MoonSat.TrajectoryHolder:Eccentricity(0)}`)
-- print(`SMAxis: {MoonSat.TrajectoryHolder:SemiMajorAxis(0)}`)
-- print(`SmAxis: {MoonSat.TrajectoryHolder:SemiMinorAxis(0)}`)
-- if MoonSat.TrajectoryHolder:Eccentricity(0) < 1 then
-- 	print(`Ap: {MoonSat.TrajectoryHolder:CurrentApoapsis(0).Position}`)
-- end
-- print(`Pe: {MoonSat.TrajectoryHolder:CurrentPeriapsis(0).Position}`)

-- print(MoonSat.TrajectoryHolder:CalculateNextTrajectory().OrbitingBody.Mass)
-- print(MoonSat.TrajectoryHolder:CalculateNextTrajectory().OrbitingBody)

local OrbitLineResolution: number = 600

-- useful vector methods

function Magnitude(v: Vector3): number
	return math.sqrt(v.X ^ 2 + v.Y ^ 2 + v.Z ^ 2)
end

function Dot(v1: Vector3, v2: Vector3): number
	return (v1.X * v2.X) + (v1.Y * v2.Y) + (v1.Z * v2.Z)
end

------------ Currently cross-checking [ CalculateTrueAnomalyFromPoint ] function with the desmos results / sanity check ----------------
-- make sure, if hyperbolic, time does not go out of bounds of hyperbola and go on the other part of the hyperbola
print("check function")
local test = MoonSat.TrajectoryHolder:CurrentTrajectory(0)
-- print(test.Position)
-- print(Magnitude(test:CalculatePointFromTrueAnomaly(2.25704569009).Position)) -- 66000000 ✅🆒
-- print(test:CalculateTrueAnomalyFromMagnitude(66000000)) -- 2.25704569009 ✅🆒

-- print(test:RecursiveTrueAnomalyHelper(8, 96314.4962456)) -- close enough to blame error on floating point ✅🆒
--[[
0.752429841902 -- 0
0.789476637075
0.788042884825
0.788040649107 -- 3
0.788040649102 -- same -- 4
0.788040649102 -- same
0.788040649102 -- same
0.788040649102 -- same
0.788040649102 -- same -- 8
]]

-- print(test:CalculateTimeFromPeriapsis(2.25704569009)) -- 125484.25408 ✅🆒

-- print(test:CalculateTrueAnomalyFromMagnitude(Magnitude(test.Position))) -- 0 ✅🆒

--[[
Note: CalculateTrueAnomalyFromPoint wont work since floating point is too inaccurate

Failure Case
	Hyperbolic orbit makes upper / lower bounds very large
	-> Causes target point and middle point to be equal due to relative size of bounds
]]

print(test:CalculateTrueAnomalyFromPoint(test.Position)) -- 0?? ⚠️❌‼️⁉️

local soibreak = test:CalculatePointFromTrueAnomaly(2.25704569009).Position

print(test:CalculateTrueAnomalyFromPoint(soibreak)) -- 2.25704569009?? ⚠️❌‼️⁉️

-- print(test:CalculateTimeFromTrueAnomaly(2.25704569009)) -- 125484.25408 ✅🆒

-- print(test:CalculateTimeFromPoint(soibreak)) -- 96314.4962456?? ⚠️❌‼️⁉️

-- --[[
-- Dependencies of CalculateTrueAnomalyFromTime:
-- 	RecursiveTrueAnomalyHelper ✅🆒
-- 	TimeToPeriapsis ✅🆒
-- 	-> CalculateTimeFromPoint
-- 		-> CalculateTrueAnomalyFromPoint ✅🆒
-- 		-> CalculateTimeFromTrueAnomaly ✅🆒
-- ]]
-- print(test:CalculateTrueAnomalyFromTime(96314.4962456)) -- 2.25704569009?? ⚠️❌‼️⁉️

error("check fin")

-- later

-- print(test:CalculateTimeFromMagnitude(66000000)) -- 96314.4962456?? ⚠️❌‼️⁉️
error("check fin")

local MoonPeriod: number = Moon.Trajectory:OrbitalPeriod()
Moon.Trajectory:DisplayTrajectory(MoonPeriod / OrbitLineResolution, OrbitLineResolution)

print("generate trajectories")
local f = MoonSat.TrajectoryHolder:DisplayTrajectory(OrbitLineResolution)
-- error("trajectories generated")
local timePassed = 0
local timeWarpMultiplier = 9000

-- run with physics loop
RunService.PreSimulation:Connect(function(deltaTime)
	local scaledTimePassed: number = timePassed * timeWarpMultiplier
	-- print("Earth")
	-- Earth:Update(scaledTimePassed)
	-- EarthSOI.Position = Earth.RootPart.Position
	print("Moon")
	Moon:Update(scaledTimePassed)
	-- print(Moon.Position) -- <- MOON IS BLINKING PROBLEM FIX PLS -> Problem in CalculateTrueAnomalyFromTime()!
	MoonSOI.Position = Moon.RootPart.Position
	-- print("MoonSat")
	-- MoonSat:Update(scaledTimePassed)
	-- for i, trajectoryLineFolder in ipairs(f:GetChildren()) do
	-- 	if MoonSat.TrajectoryHolder.allTrajectories[i].trajectory.OrbitingBody then
	-- 		trajectoryLineFolder.Attachments.Position = SolarSystemObject.CalculateWorkspacePosition(
	-- 			Vector3.zero,
	-- 			MoonSat.TrajectoryHolder.allTrajectories[i].trajectory.OrbitingBody
	-- 		)
	-- 		-- print(trajectoryLineFolder.Attachments.Position)
	-- 	end
	-- end

	-- for v in allGravityBodies do
	-- 	v:Update(scaledTimePassed)
	-- end
	timePassed += deltaTime
end)

-- print(allGravityBodies)

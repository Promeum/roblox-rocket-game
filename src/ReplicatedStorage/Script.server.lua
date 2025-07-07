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
local SolarSystemPhysicsBody = require(
	game.ReplicatedStorage.Modules.BaseModuleFolder.MovingObjectFolder.SolarSystemObjectFolder.SolarSystemPhysicsBody
)
local GravityBody = require(
	game.ReplicatedStorage.Modules.BaseModuleFolder.MovingObjectFolder.SolarSystemObjectFolder.SolarSystemBodyFolder.GravityBody
)

-- initialize Planets (only earth and moon for now...?)

local Earth = GravityBody.new(Vector3.new(0, 6e8, 0), Vector3.new(0, 0, 0), Instance.new("Part"), 5.972168e24, 1.5e9)
local Moon = GravityBody.new(
	Vector3.new(0, 36372e3, -403965e3),
	Vector3.new(-967, 0, 0),
	Instance.new("Part"),
	7.346e22,
	66e3,
	Earth
)
local MoonSat =
	SolarSystemPhysicsBody.new(Vector3.new(0, 0, 100e3), Vector3.new(-100, 0, 0), Instance.new("Part"), Moon)

table.insert(Earth.ChildGravityBodies, Moon)
Moon.ParentGravityBody = Earth
table.insert(Moon.ChildSolarSystemPhysicsBodies, MoonSat)

local allGravityBodies: { Modules.GravityBody } = {
	Earth,
	Moon,
}

-- set up the RootParts

Earth.RootPart.Shape, Moon.RootPart.Shape = Enum.PartType.Ball, Enum.PartType.Ball

Earth.RootPart.Size = Vector3.one * (6371e3 * Constants.SOLAR_SYSTEM_SCALE)
Moon.RootPart.Size = Vector3.one * (1737.4e3 * Constants.SOLAR_SYSTEM_SCALE)
MoonSat.RootPart.Size *= (6000000 * Constants.SOLAR_SYSTEM_SCALE)

Earth.RootPart.Anchored, Moon.RootPart.Anchored = true, true
MoonSat.RootPart.Anchored = true

Earth.RootPart.Material = Enum.Material.Neon
Earth.RootPart.BrickColor = BrickColor.new("Steel blue")

Moon.RootPart.Material = Enum.Material.Neon
Moon.RootPart.BrickColor = BrickColor.new("Dark stone grey")

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
EarthSOI.Size = Vector3.one * (1.5e9 * Constants.SOLAR_SYSTEM_SCALE)
EarthSOI.Parent = Earth.RootPart

local MoonSOI = SOI:Clone()
MoonSOI.Size = Vector3.one * (66e6 * Constants.SOLAR_SYSTEM_SCALE)
MoonSOI.Parent = Moon.RootPart

print(MoonSat.Trajectory.OrbitalPeriod)
print(MoonSat.Trajectory.Eccentricity)
print(MoonSat.Trajectory.SemiMajorAxis)
print(MoonSat.Trajectory.SemiMinorAxis)
print(MoonSat.Trajectory.Apoapsis)
print(MoonSat.Trajectory.Periapsis)

local MoonPeriod = Moon.Trajectory.OrbitalPeriod
local MoonSatPeriod = Moon.Trajectory.OrbitalPeriod
local OrbitLineResolution = 600

Moon.Trajectory:DisplayTrajectory(MoonPeriod / OrbitLineResolution, OrbitLineResolution)
local f = MoonSat.Trajectory:DisplayTrajectory(MoonSatPeriod / OrbitLineResolution, OrbitLineResolution)

while true do
	print("Earth")
	Earth:Update(10)
	EarthSOI.Position = Earth.RootPart.Position
	print("Moon")
	Moon:Update(10)
	MoonSOI.Position = Moon.RootPart.Position
	print("MoonSat")
	MoonSat:Update(10)
	f.Attachments.Position = Moon.RootPart.Position

	-- for v in allGravityBodies do
	-- 	v:Update(0.01)
	-- end
	task.wait(0.01)
end

-- print(allGravityBodies)

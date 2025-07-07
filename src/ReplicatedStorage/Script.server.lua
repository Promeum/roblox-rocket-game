print(`ReplicatedStorage`)

--[[

Notes

Units:
	1 stud = 10 Mm
	1 stud/s = 10 Mm/s
	1 unit of mass = 10 Mg
	1 unit of density = 0.01 Mg / Mm^3 (10^(-20) g / cm^3)
	1 unit of force = 1000 Mg * Mm / s^2 (1 GN)

Earth stats:
	Density: 5.513 x 10^18 Mg / Mm^3

]]

local GravityBody = require(game.ReplicatedStorage.Modules.BaseModule.OrbitObject.SolarSystemBody.GravityBody)
local Constructors = require(game.ReplicatedStorage.Modules.BaseModule.Constructors)

-- initialize Planets

local allGravityBodies: GravityBody = {}

for i, v in ipairs(workspace.Planets:GetChildren()) do
	print(`thingy {i}: {v}`)
	table.insert(allGravityBodies, Constructors:GravityBodyConstructor(v))
	print(allGravityBodies)
end

while true do
	for i, v in ipairs(allGravityBodies) do
		v:ApplyGravity(allGravityBodies)
	end
	task.wait(0.01)
end

print(allGravityBodies)

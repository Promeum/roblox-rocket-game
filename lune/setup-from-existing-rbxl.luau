local process = require("@lune/process")
-- local stdio = require("@lune/stdio")
local roblox = require("@lune/roblox")
local fs = require("@lune/fs")

-- "./roblox-rocket-game-backup.rbxl"
local filePath = process.args[1] -- "./roblox-rocket-game-backup.rbxl"
print(`Setting up from {filePath}`)

local content = fs.readFile(filePath)
-- assert(stdio.prompt("confirm", "Set up this file?"), "canceled")

local game = roblox.deserializePlace(content)

if not fs.isDir("./src") then
	fs.writeDir("./src")
end

if not fs.isDir("./src/ReplicatedStorage") then
	fs.writeDir("./src/ReplicatedStorage")
end

if not fs.isDir("./src/ServerScriptService") then
	fs.writeDir("./src/ServerScriptService")
end

if not fs.isDir("./src/StarterPlayer") then
	fs.writeDir("./src/StarterPlayer")
end

if not fs.isDir("./src/StarterPlayer/StarterPlayerScripts") then
	fs.writeDir("./src/StarterPlayer/StarterPlayerScripts")
end

if not fs.isDir("./map") then
	fs.writeDir("./map")
end

if not fs.isDir("./assets") then
	fs.writeDir("./assets")
end

local modules = game.ReplicatedStorage.modules

fs.writeFile("./src/StarterPlayer/StarterPlayerScripts", roblox.serializeModel(game.StarterPlayer.StarterPlayerScripts))
fs.writeFile("./map/Workspace.rbxm", roblox.serializeModel(game.Workspace))
fs.writeFile("./map/Lighting.rbxm", roblox.serializeModel(game.Lighting))
fs.writeFile(`./assets/Models.rbxm`, roblox.serializeModel(game.ReplicatedStorage.Assets))

fs.writeFile("./game.rbxl", roblox.serializePlace(game))

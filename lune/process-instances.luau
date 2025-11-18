--[[
    TODO:
    Make a script that converts any Instance
    (ScreenGui, NumberValue, TextButton, etc.)
    to Rojo-readable files
]]

local process = require("@lune/process")
local roblox = require("@lune/roblox")
local fs = require("@lune/fs")
local serde = require("@lune/serde")
local DumpParser = require("./DumpParser")

print(1)

local file = fs.readFile("lune/APIDump.json")
local dump = DumpParser.new(serde.decode("json", file))
local jsonData = serde.decode("json", file)

-- print(dump:GetMembers("StyleSheet"))
print(dump:GetProperties("BasePart"))

local function processInstances(path: string, instance)
    -- Get properties of the thing and make into JSON txt. serializeModel is only good for .rbxm/.rbxmx files...
    print(2)
    local className: string = instance.ClassName
    print(className .. " containing " .. #instance:GetChildren() .. " objects")

    -- all Instances
    jsonData = dump:GetProperties(className)
    
    -- script files
    if table.find({"Script", "LocalScript", "ModuleScript"}, className) then
        
    end

    local fileExtension: string

    -- Check the className property to handle cases (specified at https://rojo.space/docs/v7/sync-details/)
    if className == "Folder" then
        fileExtension = ""
    elseif className == "Script" then
        fileExtension = ".server.lua"
    elseif className == "LocalScript" then
        fileExtension = ".client.lua"
    elseif className == "ModuleScript" then
        fileExtension = ".lua"
    elseif className == "StringValue" then
        fileExtension = ".txt"
    end

    print(3)

    -- Change the way file is written depending on if has children
    if #instance:GetChildren() > 0 then
        local nextPath = path .. "/" .. instance.Name
        fs.writeDir(nextPath)

         print("wrote directory: " .. nextPath .. "")

        if fileExtension == nil then
            fileExtension = ".meta.json"
        end

        if className ~= "Folder" then
            print("wrote to: " .. nextPath .. "/" .. "init" .. fileExtension)
            fs.writeFile(nextPath .. "/" .. "init" .. fileExtension, jsonData)
        end

        for _, childInstance in instance:GetChildren() do
            processInstances(nextPath, childInstance)
        end
    else
        if fileExtension == nil then -- Is init.model.json a thing??
            fileExtension = ".model.json"
        end

        if className ~= "Folder" then
            print("wrote to: " .. path .. "/" .. instance.Name .. fileExtension)
            fs.writeFile(path .. "/" .. instance.Name .. fileExtension, jsonData)
        else
            print("wrote directory: " .. path .. "/" .. instance.Name)
            fs.writeDir(path .. "/" .. instance.Name)
        end
    end
end

-- run the thingy

-- lune run process-instances ./roblox-rocket-game-backup.rbxl ./TEMPfolder ReplicatedStorage

assert(#process.args == 3, "Need 3 arguments")
local filePath = process.args[1] -- ./roblox-rocket-game-backup.rbxl
local destinationfilePath = process.args[2] -- ./TEMPfolder
local gamePath = process.args[3] -- ReplicatedStorage
print(`Setting up from rbxl/rbxlx file: "{filePath}"`)

local content = fs.readFile(filePath)
local game = roblox.deserializePlace(content)

-- verify gameService is valid
local gameChildrenNames = {}
for _,child in game:GetChildren() do table.insert(gameChildrenNames, child.Name) end
local serviceIndex = table.find(gameChildrenNames, gamePath)
assert(serviceIndex, `Game service "{gamePath}" does not exist`)
print(`Building filepath from game service: "{gamePath}"`)

-- confirm to run thing
-- assert(stdio.prompt("confirm", "Set up this file into \"" .. destinationfilePath .. "\"?"), "canceled")

for _, instance in game:GetChildren()[serviceIndex]:GetChildren() do
    processInstances(destinationfilePath, instance)
end

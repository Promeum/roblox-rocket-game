--[[
    Original freemodel by [@TheTeslaModelXFan](https://www.roblox.com/users/2484047761/profile)
	https://devforum.roblox.com/t/simple-and-fast-xml-parser/2913813
]]
function parseXML(xmlString)
	local t = {}
	local pattern = "<([%w_]+)>(.-)</%1>"
	for tag, content in string.gmatch(xmlString, pattern) do
		if string.match(content, pattern) then
			content = parseXML(content)
		end
		if t[tag] then
			if type(t[tag]) == "table" and type(t[tag][1]) == "table" then
				table.insert(t[tag], content)
			else
				t[tag] = {t[tag], content}
			end
		else
			t[tag] = content
		end
	end
	return t
end

return parseXML

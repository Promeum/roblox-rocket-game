--!strict


local SolarSystemBody = {__index={}}


--[=[
	Applies the gravity of other planets to the this planet, modifying its velocity.
]=]
function SolarSystemBody.__index:ApplyGravity(otherGravityBodies: {GravityBody}): Vector3
	local position: Vector3 = self.Part.AssemblyCenterOfMass
	local totalGravityForce: Vector3 = Vector3.zero

	for _, gravityBody in ipairs(otherGravityBodies) do
		if (gravityBody == self) then
			continue
		end
		local otherPosition: Vector3 = gravityBody.Part.AssemblyCenterOfMass
		local direction: Vector3 = (otherPosition - position).Unit
		local distance: number = (otherPosition - position).Magnitude
		local gravityForce: Vector3 = direction * ( ((gravityBody.Part.Mass * self.Part.Mass) / (distance ^ 2)) * GRAVITATIONAL_CONSTANT )
		totalGravityForce += gravityForce
	end

	--self.Part.GravityVectorForce.Force = totalGravityForce
	self.Part:ApplyImpulse(totalGravityForce * 0.01)

	print(`applied gravity to {self}\n  Vector3({totalGravityForce})\n  Magnitude: {totalGravityForce.Magnitude}`)
	return totalGravityForce
end


return SolarSystemBody

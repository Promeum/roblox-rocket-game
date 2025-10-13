--!strict

--[[
	Performace enhancements:
	Make a cache for repeated calcs
	Find out exactly what operations/methods are computationally expensive
]]

local Type = require("../../Type")
local Constructor = require("../../Constructor")
local Trajectory = require(".")
local Constants = require("../../Constants")
local KinematicState = require("../Relative/State/KinematicState")
local TemporalState = require("../Relative/State/TemporalState")
local KinematicTemporalState = require("../KinematicTemporalState")

local OrbitalTrajectory = { __type = "OrbitalTrajectory" :: "OrbitalTrajectory" }

--[=[
	Creates a new OrbitalTrajectory instance.
]=]
function OrbitalTrajectory.new(position: Modules.Vector3D, velocity: Modules.Vector3D, orbitingBody: Modules.GravityBody): Modules.OrbitalTrajectory
	return OrbitalTrajectory.fromMovingObject(MovingObject.new(position, velocity), orbitingBody)
end

--[=[
	Creates a new OrbitalTrajectory instance, with a given SolarSystemObject super-instance.
	This effectively links this instance with other objects with the same super-instance.
]=]
function OrbitalTrajectory.fromMovingObject(movingObject: Modules.MovingObject, orbitingBody: Modules.GravityBody): Modules.OrbitalTrajectory
	local newOrbitalTrajectory = table.clone(OrbitalTrajectory)

	newOrbitalTrajectory.OrbitingBody = orbitingBody

	local metatable = {
		__index = movingObject,
	}

	setmetatable(newOrbitalTrajectory, metatable)

	local mu: number = orbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3D = movingObject.Position -- Position vector
	local rM: number = r:Magnitude() -- Position magnitude
	local v: Modules.Vector3D = movingObject.Velocity -- Velocity vector
	local vM: number = v:Magnitude() -- Velocity magnitude

	local visVivaSubParameter: number = 2 * mu * (rM ^ -1) - vM ^ 2

	metatable["OrbitalPeriod"] = 2 * math.pi * mu * (visVivaSubParameter ^ -1.5)

	metatable["SemiMajorAxis"] = mu / visVivaSubParameter

	metatable["SemiMinorAxis"] = r:Cross(v):Magnitude() / math.sqrt(math.abs(visVivaSubParameter))

	metatable["Eccentricity"] = (mu * r + (rM * r:Cross(v):Cross(v))):Magnitude() / (mu * rM)

	metatable["IsBound"] = newOrbitalTrajectory:Eccentricity() <= 1

	metatable["IsClosed"] = newOrbitalTrajectory:Eccentricity() < 1

	metatable["TimeToPeriapsis"] = 0

	metatable["Periapsis"] = newOrbitalTrajectory:CalculatePointFromTrueAnomaly(0)
	assert(metatable["Periapsis"], `periapsis is nil ({metatable["Periapsis"]})`)

	metatable["Apoapsis"] = if newOrbitalTrajectory:IsBound()
		then newOrbitalTrajectory:CalculatePointFromTrueAnomaly(math.pi)
		else nil

	if newOrbitalTrajectory:OrbitalPeriod() == newOrbitalTrajectory:OrbitalPeriod() then
		metatable["TimeSincePeriapsis"] = newOrbitalTrajectory:CalculateTimeFromPoint(movingObject.Position, 0)
		metatable["TimeToPeriapsis"] = newOrbitalTrajectory:OrbitalPeriod() - metatable["TimeSincePeriapsis"]
	else
		metatable["TimeSincePeriapsis"] = newOrbitalTrajectory:CalculateTimeFromPoint(movingObject.Position, 0)
		metatable["TimeToPeriapsis"] = -metatable["TimeSincePeriapsis"]
	end

	newOrbitalTrajectory.SpecificOrbitalEnergy = (vM ^ 2 / 2) - (mu / rM)

	return newOrbitalTrajectory
end

--[=[
	Returns the orbital period.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function OrbitalTrajectory:OrbitalPeriod(): number
	return getmetatable(self)["OrbitalPeriod"]
end

--[=[
	Returns the time (in seconds) to the next periapsis.
	Should always be positive if orbit is bound. Otherwise, may be negative if past the periapsis (since the orbit is a hyperbola).
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function OrbitalTrajectory:TimeToPeriapsis(): number
	return getmetatable(self)["TimeToPeriapsis"]
end

--[=[
	Returns the time (in seconds) since the last periapsis.
	Should always be positive if orbit is bound. Otherwise, may be negative if not past the periapsis (since the orbit is a hyperbola).
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function OrbitalTrajectory:TimeSincePeriapsis(): number
	return getmetatable(self)["TimeSincePeriapsis"]
end

--[=[
	Returns the apoapsis.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function OrbitalTrajectory:Apoapsis(): Modules.MovingObject
	return getmetatable(self)["Apoapsis"]
end

--[=[
	Returns the periapsis.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function OrbitalTrajectory:Periapsis(): Modules.MovingObject
	return getmetatable(self)["Periapsis"]
end

--[=[
	Returns the semi major axis.
	https://en.wikipedia.org/wiki/Vis-viva_equation
]=]
function OrbitalTrajectory:SemiMajorAxis(): number
	return getmetatable(self)["SemiMajorAxis"]
end

--[=[
	Returns the semi minor axis.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function OrbitalTrajectory:SemiMinorAxis(): number
	return getmetatable(self)["SemiMinorAxis"]
end

--[=[
	Returns the eccentricity.
	https://en.wikipedia.org/wiki/Eccentricity_vector
]=]
function OrbitalTrajectory:Eccentricity(): number
	return getmetatable(self)["Eccentricity"]
end

--[=[
	Returns true if this trajectory is a bound orbit (eccentricity <= 1) and false otherwise.
]=]
function OrbitalTrajectory:IsBound(): boolean
	return getmetatable(self)["IsBound"]
end

--[=[
	Returns true if this trajectory is a closed orbit (eccentricity < 1) and false otherwise.
]=]
function OrbitalTrajectory:IsClosed(): boolean
	return getmetatable(self)["IsClosed"]
end

--[=[
	Helper method for CalculateTrueAnomalyFromTime().
	Apparently a calculation for eccentric anomaly using Kepler's Equation solved via the Newton-Raphson Method.
	Returns nil if there is no GravityBody being orbited.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function OrbitalTrajectory:RecursiveTrueAnomalyHelper(recursions: number, periapsisRelativeTime: number): number
	local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3D = self.Position -- Position vector
	local rM: number = r:Magnitude() -- Position magnitude
	local v: Modules.Vector3D = self.Velocity -- Velocity vector
	local vM: number = v:Magnitude() -- Velocity magnitude
	local t: number = periapsisRelativeTime

	if recursions == 0 then -- base case
		if 2 * mu <= rM * vM ^ 2 then
			-- print(1)
			return math.sign(t)
				* math.sqrt(
					(math.log(
								(
									(2 * rM * math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5 * math.abs(t))
									/ (mu * r + rM * r:Cross(v):Cross(v)):Magnitude()
								) + 1
							) + 1)
							^ 2
						- 1
				)
		elseif
			(math.pi - 1 + (mu * r + rM * r:Cross(v):Cross(v)):Magnitude() / (mu * rM))
			<= math.abs((((t / mu) * (2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) % (2 * math.pi)) - math.pi)
		then
			-- print(2)
			return math.pi * (2 * math.round((t / (2 * math.pi * mu)) * math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5))
		elseif
			math.abs((((t / mu) * (2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) % (2 * math.pi)) - math.pi)
			<= (1 + (mu * r + rM * r:Cross(v):Cross(v)):Magnitude() / (mu * rM))
		then
			-- print(3)
			return math.pi
				* (2 * math.floor((t / (2 * math.pi * mu)) * math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) + 1)
		else
			-- print(4)
			return math.pi * (math.floor((t / (math.pi * mu)) * math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) + 0.5)
		end
	else -- non-base case
		local prevRecursion: number = self:RecursiveTrueAnomalyHelper(recursions - 1, periapsisRelativeTime)
		assert(prevRecursion == prevRecursion, `prevRecursion is nan ({prevRecursion})`)

		-- print(`recursion {recursions - 1}`)
		-- print(prevRecursion)

		if 2 * mu <= rM * vM ^ 2 then
			return prevRecursion
				+ (
						rM * (math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) * t
						+ mu * rM * prevRecursion
						- math.sinh(prevRecursion) * (mu * r + rM * r:Cross(v):Cross(v)):Magnitude()
					)
					/ (math.cosh(prevRecursion) * (mu * r + rM * r:Cross(v):Cross(v)):Magnitude() - mu * rM)
		else
			return prevRecursion
				+ (
						rM * ((2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) * t
						- mu * rM * prevRecursion
						+ math.sin(prevRecursion) * (mu * r + rM * r:Cross(v):Cross(v)):Magnitude()
					)
					/ (-math.cos(prevRecursion) * (mu * r + rM * r:Cross(v):Cross(v)):Magnitude() + mu * rM)
		end
	end -- ...should i be concerned about performance issues
end

--[=[
	Calculates the angle of true anomaly at a given point in time on this OrbitalTrajectory.
	Returns nil if there is no GravityBody being orbited.
	https://en.wikipedia.org/wiki/True_anomaly
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function OrbitalTrajectory:CalculateTrueAnomalyFromTime(relativeTime: number): number
	local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3D = self.Position -- Position vector
	local rM: number = r:Magnitude() -- Position magnitude
	local v: Modules.Vector3D = self.Velocity -- Velocity vector
	local vM: number = v:Magnitude() -- Velocity magnitude

	local timeSincePeriapsis: number = self:TimeSincePeriapsis()
	local periapsisRelativeTime: number = timeSincePeriapsis + relativeTime
	local TrueAnomalyHelperResult: number = self:RecursiveTrueAnomalyHelper(8, periapsisRelativeTime)

	if (rM * vM ^ 2) < (2 * mu) then --self:IsClosed() then -- orbit is not hyperbolic, eccentricity < 1
		return (
			2
				* math.pi
				* math.ceil(
					(math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) * (periapsisRelativeTime / (2 * mu * math.pi)) - 0.5
				)
			+ 2
				* math.atan(
					(mu * rM + (mu * r + rM * r:Cross(v):Cross(v)):Magnitude())
						/ (rM * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)) * r:Cross(v):Magnitude())
						* math.tan(0.5 * TrueAnomalyHelperResult)
				)
		) % (2 * math.pi)
	else -- orbit is hyperbolic, eccentricity >= 1
		return 2
			* math.atan(
				(mu * rM + (mu * r + rM * r:Cross(v):Cross(v)):Magnitude())
					/ (rM * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)) * r:Cross(v):Magnitude())
					* math.tanh(0.5 * TrueAnomalyHelperResult)
			)
	end -- ...should i be concerned about performance issues
end

--[=[
	Calculates a new OrbitalTrajectory at a given point on this OrbitalTrajectory, using the angle of true anomaly.
	Returns nil if there is no GravityBody being orbited.
	https://en.wikipedia.org/wiki/True_anomaly
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function OrbitalTrajectory:CalculatePointFromTrueAnomaly(trueAnomaly: number): Modules.MovingObject
	local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3D = self.Position -- Position vector
	local rM: number = r:Magnitude() -- Position magnitude
	local v: Modules.Vector3D = self.Velocity -- Velocity vector
	local vM: number = v:Magnitude() -- Velocity magnitude

	if self:Eccentricity() == 0 then -- orbit is a circle
		return MovingObject.new(
			((math.sin(trueAnomaly) * r:Cross(v):Cross(r)) + (math.cos(trueAnomaly) * r:Cross(v):Magnitude() * r))
				/ r:Cross(v):Magnitude(),
			((math.cos(trueAnomaly) * r:Cross(v):Cross(r)) - (math.sin(trueAnomaly) * r:Cross(v):Magnitude() * r))
				/ (rM * r:Cross(v):Magnitude())
				* vM
		)
	elseif
		self:IsClosed()
		or ( -- check range of true anomaly of hyperbolic orbit
			not self:IsClosed()
			and -math.acos(-(mu * rM) / (mu * r + rM * r:Cross(v):Cross(v)):Magnitude()) < math.abs(trueAnomaly) % (2 * math.pi) * math.sign(
				trueAnomaly
			)
			and math.abs(trueAnomaly) % (2 * math.pi) * math.sign(trueAnomaly)
				< math.acos(-(mu * rM) / (mu * r + rM * r:Cross(v):Cross(v)):Magnitude())
		)
	then -- orbit is any other conic section
		-- note: for velocity, the mu that multiplies with the entire fraction was moved to denominator to counter floating point errors (the big fraction should not end up as (0,0,0))
		-- another note: really think about implementing arbitrary-precision arithmetic
		return MovingObject.new(
			(r:Cross(v):Magnitude() * rM)
				/ (-(mu * r + rM * r:Cross(v):Cross(v)):Magnitude() * (math.cos(trueAnomaly) * (
					mu * r + rM * r:Cross(v):Cross(v)
				):Magnitude() + mu * rM))
				* (
					(math.sin(trueAnomaly) * (mu * r:Cross(v):Cross(r) - rM * r:Cross(v):Magnitude() ^ 2 * v))
					+ (math.cos(trueAnomaly) * r:Cross(v):Magnitude() * (mu * r + rM * r:Cross(v):Cross(v)))
				),
			(
				(
					-(math.cos(trueAnomaly) * (mu * r:Cross(v):Cross(r) - rM * r:Cross(v):Magnitude() ^ 2 * v))
					+ (math.sin(trueAnomaly) * r:Cross(v):Magnitude() * (mu * r + rM * r:Cross(v):Cross(v)))
				) / ((r:Cross(v):Magnitude() ^ 2) * (mu * r + rM * r:Cross(v):Cross(v)):Magnitude() / mu)
			)
				- ((mu * r:Cross(v):Cross(r)) / ((r:Cross(v):Magnitude() ^ 2) * rM))
				+ v
		) -- ...should i be concerned about performance issues
	else -- true anomaly is out of range of hyperbolic orbit
		error(
			`CalculatePointFromTrueAnomaly Invalid angle\n(min: {-math.acos(
				-(mu * rM) / (mu * r + rM * r:Cross(v):Cross(v)):Magnitude()
			)})\n(max: {math.acos(-(mu * rM) / (mu * r + rM * r:Cross(v):Cross(v)):Magnitude())})`
		)
	end
end

--[=[
	Calculates a new MovingObject at a given point in time on this OrbitalTrajectory.
	https://www.desmos.com/3d/rfndgd4ppj

	@param relativeTime The time passed since the location of this OrbitalTrajectory.
]=]
function OrbitalTrajectory:CalculatePointFromTime(relativeTime: number): Modules.MovingObject
	local trueAnomalyAngle: number = self:CalculateTrueAnomalyFromTime(relativeTime)
	assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan ({trueAnomalyAngle})`)
	
	local resultPoint: Modules.MovingObject = self:CalculatePointFromTrueAnomaly(trueAnomalyAngle)

	return resultPoint
end

--[=[
	Calculates the true anomaly at the point on this OrbitalTrajectory closest to a given point.
	https://www.desmos.com/3d/rfndgd4ppj

	@param position The given point. Does not have to be a point on the trajectory.
	@return Returns the true anomaly angle in radians, or nil if there is no GravityBody being orbited.
]=]
function OrbitalTrajectory:CalculateTrueAnomalyFromPoint(position: Modules.Vector3D): number
	local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3D = self.Position -- Position vector
	local rM: number = r:Magnitude() -- Position magnitude
	local v: Modules.Vector3D = self.Velocity -- Velocity vector

	local greaterAnomaly: number
	local lesserAnomaly: number
	local greaterPoint: Modules.Vector3D
	local lesserPoint: Modules.Vector3D

	if self:IsClosed() then -- find the quadrant of the point and get the two points at the axes lines bordering that quadrant (search range: 0 -> 2 * math.pi)
		local up: Modules.Vector3D = self:CalculatePointFromTrueAnomaly(math.pi).Position
		local down: Modules.Vector3D = self:CalculatePointFromTrueAnomaly(0).Position
		local left: Modules.Vector3D = self:CalculatePointFromTrueAnomaly(3 * math.pi / 2).Position
		local right: Modules.Vector3D = self:CalculatePointFromTrueAnomaly(math.pi / 2).Position

		if (up - position):Magnitude() < (down - position):Magnitude() then
			if (left - position):Magnitude() < (right - position):Magnitude() then
				greaterAnomaly = 3 * math.pi / 2
				lesserAnomaly = math.pi
				greaterPoint = left
				lesserPoint = up
			else
				greaterAnomaly = math.pi
				lesserAnomaly = math.pi / 2
				greaterPoint = up
				lesserPoint = right
			end
		else
			lesserAnomaly = 0
			lesserPoint = down
			if (left - position):Magnitude() < (right - position):Magnitude() then
				greaterAnomaly = 3 * math.pi / 2
				greaterPoint = left
			else
				greaterAnomaly = math.pi / 2
				greaterPoint = right
			end
		end
	else -- get the two points defining the range of true anomaly of hyperbolic orbit (search range: -(x < math.pi) -> (x < math.pi))
		greaterAnomaly = math.acos(-(mu * rM) / (mu * r + rM * r:Cross(v):Cross(v)):Magnitude()) - 2.24e-16
		greaterPoint = self:CalculatePointFromTrueAnomaly(greaterAnomaly).Position
		lesserAnomaly = -math.acos(-(mu * rM) / (mu * r + rM * r:Cross(v):Cross(v)):Magnitude()) + 2.24e-16
		lesserPoint = self:CalculatePointFromTrueAnomaly(lesserAnomaly).Position
	end

	-- Bisection search for true anomaly, check distance by converting anomaly to point and compare with position
	local lastMiddleAnomaly: number
	local middleAnomaly: number = (greaterAnomaly + lesserAnomaly) / 2
	local middlePoint: Modules.Vector3D = self:CalculatePointFromTrueAnomaly(middleAnomaly).Position
	local anomalySearchIteration: number = 1

	repeat
		-- account for floating point error in trueAnomaly calculations
		local floatingPointError: boolean = (lastMiddleAnomaly == middleAnomaly) and (greaterAnomaly - lesserAnomaly ~= 0)

		-- Vector math for comparing the target point and middlePoint
		local transformedGreaterPoint: Modules.Vector3D = greaterPoint - lesserPoint -- transformedLesserPoint is (0, 0, 0)
		local transformedTargetPoint: Modules.Vector3D = position - lesserPoint
		local transformedMiddlePoint: Modules.Vector3D = middlePoint - lesserPoint
		local referenceAxis: Modules.Vector3D = transformedGreaterPoint / transformedGreaterPoint:Magnitude() -- get the unit axis vector

		-- Project the two points onto the reference axis with dot product
		local projectedTargetPoint: Modules.Vector3D = referenceAxis * transformedTargetPoint:Dot(referenceAxis)
		local projectedMiddlePoint: Modules.Vector3D = referenceAxis * transformedMiddlePoint:Dot(referenceAxis)

		-- Generate a 'number line' position along the reference axis for the two points
		local targetPointPosition: number = projectedTargetPoint:Dot(referenceAxis)
		local middleAnomalyPosition: number = projectedMiddlePoint:Dot(referenceAxis)

		if targetPointPosition > middleAnomalyPosition then -- move lesser angle up
			lesserAnomaly = if floatingPointError then greaterAnomaly else middleAnomaly
			lesserPoint = self:CalculatePointFromTrueAnomaly(lesserAnomaly).Position
		else --elseif targetPointPosition < middleAnomalyPosition then -- move greater angle down
			greaterAnomaly = if floatingPointError then lesserAnomaly else middleAnomaly
			greaterPoint = self:CalculatePointFromTrueAnomaly(greaterAnomaly).Position
		end
		-- else -- shortcut in case angle of target point is directly in the middle of lesser and greater angles -- doesnt work due to inaccurate floating point
		-- 	return middleAnomaly
		-- end

		lastMiddleAnomaly = middleAnomaly
		middleAnomaly = (greaterAnomaly + lesserAnomaly) / 2
		middlePoint = self:CalculatePointFromTrueAnomaly(middleAnomaly).Position

		-- print(`iteration {anomalySearchIteration}, log10 ≈ {tostring(math.log10(math.abs(greaterAnomaly - lesserAnomaly))):sub(1, 4)}`)
		-- print(greaterAnomaly)
		-- print(middleAnomaly)
		-- print(lesserAnomaly)
		assert(middleAnomaly == middleAnomaly, `middleAnomaly has errored ({middleAnomaly})`)
		-- ...should i be concerned about performance issues

		anomalySearchIteration += 1
	until greaterAnomaly - lesserAnomaly == 0 or (middlePoint - position):Magnitude() < 1e-9 or anomalySearchIteration > 70

	-- print(`trueAnomaly calc finished at {anomalySearchIteration} iterations`)

	-- if greaterAnomaly - lesserAnomaly == 0 then
	-- 	print(`...because anomalies are close enough (difference ≈ 0)`)
	-- 	print(`position error: {(middlePoint - position):Magnitude()}`)
	-- elseif (middlePoint - position):Magnitude() < 1e-9 then
	-- 	print(`...because position is close enough (difference: {(middlePoint - position):Magnitude()})`)
	-- 	print(`anomaly discrepancy: {greaterAnomaly - lesserAnomaly}`)
	-- else
	-- 	print(`...because iterative search taking too long (iteration > 70)`)
	-- 	print(`position error: {(middlePoint - position):Magnitude()}`)
	-- 	print(`anomaly discrepancy: {greaterAnomaly - lesserAnomaly}`)
	-- end

	return middleAnomaly
end

--[=[
	Calculates the length of time from the periapsis to the given true anomaly.
	https://www.desmos.com/3d/rfndgd4ppj

	@param trueAnomaly The angle of true anomaly. Can be any value.
]=]
function OrbitalTrajectory:CalculateTimeFromPeriapsis(trueAnomaly: number): number
	local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3D = self.Position -- Position vector
	local rM: number = r:Magnitude() -- Position magnitude
	local v: Modules.Vector3D = self.Velocity -- Velocity vector
	local vM: number = v:Magnitude() -- Velocity magnitude

	if self:IsClosed() then -- Orbit is circular / elliptic
		return (-r:Cross(v):Magnitude() * (mu * r + rM * r:Cross(v):Cross(v)):Magnitude() * math.sin(trueAnomaly))
				/ ((2 * mu * (rM ^ -1) - vM ^ 2) * ((mu * r + rM * r:Cross(v):Cross(v)):Magnitude() * math.cos(trueAnomaly) + mu * rM))
			+ (mu * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)) ^ -3)
				* (2 * math.pi * math.ceil(trueAnomaly / (2 * math.pi) - 0.5) - 2 * math.atan(
					((mu * r + rM * r:Cross(v):Cross(v)):Magnitude() - mu * rM)
						/ (r:Cross(v):Magnitude() * rM * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)))
						* math.tan(trueAnomaly / 2)
				))
	else -- Orbit is parabolic / hyperbolic
		return (-r:Cross(v):Magnitude() * (mu * r + rM * r:Cross(v):Cross(v)):Magnitude() * math.sin(trueAnomaly))
				/ ((2 * mu * (rM ^ -1) - vM ^ 2) * ((mu * r + rM * r:Cross(v):Cross(v)):Magnitude() * math.cos(trueAnomaly) + mu * rM))
			+ (mu * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)) ^ -3)
				* (-math.log(
					((mu * r + rM * r:Cross(v):Cross(v)):Magnitude() * math.cos(trueAnomaly) + mu * rM)
						/ (
							(mu * r + rM * r:Cross(v):Cross(v)):Magnitude()
							+ mu * rM * math.cos(trueAnomaly)
							- math.sin(trueAnomaly)
								* rM
								* r:Cross(v):Magnitude()
								* math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2))
						)
				))
	end
end

--[=[
	Calculates the length of time seperating two given true anomalies on this OrbitalTrajectory.
	https://www.desmos.com/3d/rfndgd4ppj

	@param trueAnomaly The end angle of true anomaly. Can be any value.
	@param referenceTrueAnomaly The start angle of true anomaly. If not provided, defaults to the current true anomaly (between 0 and 2 * math.pi).
	@return Returns a value, in seconds, representing the length of time to go from referenceTrueAnomaly to trueAnomaly. Can be negative if the current orbit is a hyperbola.
]=]
function OrbitalTrajectory:CalculateTimeFromTrueAnomaly(trueAnomaly: number, referenceTrueAnomaly: number?): number
	local adjustedReferenceTrueAnomaly: number = referenceTrueAnomaly or self:CalculateTrueAnomalyFromPoint(self.Position)

	return self:CalculateTimeFromPeriapsis(trueAnomaly) - self:CalculateTimeFromPeriapsis(adjustedReferenceTrueAnomaly)
end

--[=[
	Calculates the time until the craft reaches a specific point on this OrbitalTrajectory.
	Time may be negative if the current orbit is hyperbolic.
	https://www.desmos.com/3d/rfndgd4ppj

	@param position The position to be reached (may have already been reached if the current orbit is hyperbolic).
	@param referenceTrueAnomaly The refernce angle of true anomaly. If not provided, defaults to the current true anomaly (between 0 and 2 * math.pi).
]=]
function OrbitalTrajectory:CalculateTimeFromPoint(position: Modules.Vector3D, referenceTrueAnomaly: number?): number
	local trueAnomalyAngle: number = self:CalculateTrueAnomalyFromPoint(position)
	assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is invalid ({trueAnomalyAngle})`)

	return self:CalculateTimeFromTrueAnomaly(trueAnomalyAngle, referenceTrueAnomaly)
end

--[=[
	Calculates the true anomaly at a given point closest to a given altitude on this OrbitalTrajectory.
	https://www.desmos.com/3d/rfndgd4ppj

	@param magnitude
	@return Returns the true anomaly angle in radians within 0 and math.pi, or nil if there is no GravityBody being orbited.
]=]
function OrbitalTrajectory:CalculateTrueAnomalyFromMagnitude(magnitude: number): number
	local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3D = self.Position -- Position vector
	local rM: number = r:Magnitude() -- Position magnitude
	local v: Modules.Vector3D = self.Velocity -- Velocity vector

	local greaterAnomaly: number
	local lesserAnomaly: number

	lesserAnomaly = 0

	if self:IsClosed() then -- search range: 0 -> math.pi
		greaterAnomaly = math.pi
	else -- search range: 0 -> (x < math.pi) (the range of true anomaly of hyperbolic orbit)
		greaterAnomaly = math.acos(-(mu * rM) / (mu * r + rM * r:Cross(v):Cross(v)):Magnitude()) - 2.24e-16 -- subtract small number so greaterPoint will work, hopefully
	end

	-- Bisection search for true anomaly, check distance by converting anomaly to point and compare with magnitude
	local lastMiddleAnomaly: number
	local middleAnomaly: number = (greaterAnomaly + lesserAnomaly) / 2
	local middleAnomalyMagnitude: number = self:CalculatePointFromTrueAnomaly(middleAnomaly).Position:Magnitude()
	local anomalySearchIteration: number = 0
	assert(middleAnomalyMagnitude ~= math.huge, `infinite value detected`)
	repeat
		-- account for floating point error in trueAnomaly calculations
		local floatingPointError: boolean = (lastMiddleAnomaly == middleAnomaly) and (greaterAnomaly - lesserAnomaly ~= 0)

		if middleAnomalyMagnitude < magnitude then
			lesserAnomaly = if floatingPointError then greaterAnomaly else middleAnomaly
		else
			greaterAnomaly = if floatingPointError then lesserAnomaly else middleAnomaly
		end

		lastMiddleAnomaly = middleAnomaly
		middleAnomaly = (greaterAnomaly + lesserAnomaly) / 2
		middleAnomalyMagnitude = self:CalculatePointFromTrueAnomaly(middleAnomaly).Position:Magnitude()
		-- ...should i be concerned about performance issues
		
		-- print(`iteration {anomalySearchIteration}, log10 ≈ {tostring(math.log10(math.abs(greaterAnomaly - lesserAnomaly))):sub(1, 4)}`)

		anomalySearchIteration += 1
	until greaterAnomaly - lesserAnomaly == 0 or middleAnomalyMagnitude - magnitude == 0 or anomalySearchIteration > 70

	-- print(`trueAnomaly calc finished at {anomalySearchIteration} iterations`)

	-- if greaterAnomaly - lesserAnomaly == 0 then
	-- 	print(`...because anomalies are close enough (difference ≈ 0)`)
	-- 	print(`magnitude error: {math.abs(middleAnomalyMagnitude - magnitude)}`)
	-- elseif middleAnomalyMagnitude - magnitude == 0 then
	-- 	print(`...because magnitude is close enough (difference ≈ 0)`)
	-- 	print(`anomaly discrepancy: {greaterAnomaly - lesserAnomaly}`)
	-- else
	-- 	print(`...because iterative search taking too long (iteration > 100)`)
	-- 	print(`position error: {math.abs(middleAnomalyMagnitude - magnitude)}`)
	-- 	print(`anomaly discrepancy: {greaterAnomaly - lesserAnomaly}`)
	-- end

	return middleAnomaly
end

--[=[
	Calculates the time the craft reaches a specific altitude on this OrbitalTrajectory.
	Times are relative to this OrbitalTrajectory.
	Time can be either negative or positive if the trajectory is a hyperbola, or only positive if the orbit is closed.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function OrbitalTrajectory:CalculateTimeFromMagnitude(magnitude: number): number
	local trueAnomalyAngle: number = self:CalculateTrueAnomalyFromMagnitude(magnitude)
	assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan`)

	local resultTime: number = self:CalculateTimeFromTrueAnomaly(trueAnomalyAngle)
	assert(resultTime == resultTime, `resultTime is nan`)

	return resultTime
end

--[=[
	Calculates a new MovingObject at a given altitude on this OrbitalTrajectory.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function OrbitalTrajectory:CalculatePointFromMagnitude(magnitude: number): Modules.MovingObject
	local trueAnomalyAngle: number = self:CalculateTrueAnomalyFromMagnitude(magnitude)
	assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan`)

	local resultPoint: Modules.MovingObject = self:CalculatePointFromTrueAnomaly(trueAnomalyAngle)

	return resultPoint
end

return OrbitalTrajectory

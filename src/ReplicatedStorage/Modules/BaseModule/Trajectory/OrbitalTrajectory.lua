--!strict

--[[
	Performace enhancements:
	Make a cache for repeated calcs
	Find out exactly what operations/methods are computationally expensive
]]

local Type = require("../../Type")
local Constructor = require("../../Constructor")
local Trajectory = require(".")
local KinematicState = require("../Relative/State/KinematicState")
local KinematicTemporalState = require("../KinematicTemporalState")

-- Internal type
type OrbitalTrajectory = Type.OrbitalTrajectoryEXTENSIBLE<OrbitalTrajectory,
		Type.TrajectoryEXTENSIBLE<OrbitalTrajectory,
				Type.BaseModuleEXTENSIBLE<OrbitalTrajectory
	>>>
	& Constructor.OrbitalTrajectoryEXTENSIBLE<OrbitalTrajectory>
	& {
	orbitingBody: Type.GravityCelestial,
	cache: {
		nextTrajectory: OrbitalTrajectory | Type.LinearTrajectory | false | nil,
		nextTrajectoryDirection: "in" | "out" | false | nil,
		nextOrbiting: Type.GravityCelestial | false | nil,
		-- Orbital parameters
		period: number,
		timeToPeriapsis: number,
		timeSincePeriapsis: number,
		apoapsis: Type.KinematicState | false,
		periapsis: Type.KinematicState,
		semiMajorAxis: number,
		semiMinorAxis: number,
		eccentricity: number,
		isBound: boolean,
		isClosed: boolean,
		specificOrbitalEnergy: number,
		-- Quick access kinematics
		mu: number, -- Standard gravitational parameter
		r: Type.Vector3D, -- Position vector
		rM: number, -- Position magnitude
		v: Type.Vector3D, -- Velocity vector
		vM: number, -- Velocity magnitude
	},
	recursiveTrueAnomalyHelper: (self: OrbitalTrajectory, recursions: number, periapsisRelativeTime: number) -> number,
}

local OrbitalTrajectory: OrbitalTrajectory = { __type = "OrbitalTrajectory" :: "OrbitalTrajectory" } :: any
local OrbitalTrajectoryMT = {}

--[=[
	Creates a new OrbitalTrajectory instance.
]=]
function OrbitalTrajectory.new(
	kinematicState: Type.KinematicState,
	temporalState: Type.TemporalState,
	orbitingBody: Type.GravityCelestial
): OrbitalTrajectory
	return OrbitalTrajectory.fromPosition(KinematicTemporalState.new(kinematicState, temporalState), orbitingBody)
end

--[=[
	Creates a new OrbitalTrajectory instance.
]=]
function OrbitalTrajectory.fromPosition(
	position: Type.KinematicTemporalState,
	orbitingBody: Type.GravityCelestial
): OrbitalTrajectory
	local self: OrbitalTrajectory = table.clone(OrbitalTrajectory) :: any

	local metatable = table.clone(OrbitalTrajectoryMT)
	metatable.__index = Trajectory.fromPosition(position)

	setmetatable(self, metatable)

	-- Quick access kinematics
	
	self.cache.mu = orbitingBody:mu() -- Standard gravitational parameter
	self.cache.r = position:getPosition() -- Position vector
	self.cache.rM = self.cache.r:Magnitude() -- Position magnitude
	self.cache.v = position:getVelocity() -- Velocity vector
	self.cache.vM = self.cache.v:Magnitude() -- Velocity magnitude

	local mu: number = self.cache.mu
	local r: Type.Vector3D = self.cache.r
	local rM: number = self.cache.rM
	local v: Type.Vector3D = self.cache.v
	local vM: number = self.cache.vM

	local visVivaSubParameter: number = 2 * mu * (rM ^ -1) - vM ^ 2

	-- Orbital parameters

	self.cache.period = 2 * math.pi * mu * (visVivaSubParameter ^ -1.5)

	self.cache.semiMajorAxis = mu / visVivaSubParameter

	self.cache.semiMinorAxis = r:Cross(v):Magnitude() / math.sqrt(math.abs(visVivaSubParameter))

	self.cache.eccentricity = (mu * r + (rM * r:Cross(v):Cross(v))):Magnitude() / (mu * rM)

	self.cache.isBound = self.cache.eccentricity <= 1

	self.cache.isClosed = self.cache.eccentricity < 1

	self.cache.timeToPeriapsis = 0

	self.cache.periapsis = self:calculatePointFromTrueAnomaly(0)
	assert(self.cache.periapsis, `periapsis is nil ({self.cache.periapsis})`)

	self.cache.apoapsis = if self.cache.isBound
		then self:calculatePointFromTrueAnomaly(math.pi)
		else false

	if self.cache.period == self.cache.period then
		self.cache.timeSincePeriapsis = self:calculateTimeFromPoint(r)
		self.cache.timeToPeriapsis = self.cache.period - self.cache.timeSincePeriapsis
	else
		self.cache.timeSincePeriapsis = self:calculateTimeFromPoint(r)
		self.cache.timeToPeriapsis = -self.cache.timeSincePeriapsis
	end

	self.cache.specificOrbitalEnergy = (vM ^ 2 / 2) - (mu / rM)

	return self
end

-- Methods

-- Accessors

--[=[
	OrbitalTrajectory
]=]
function OrbitalTrajectory:orbiting(): Type.GravityCelestial return self.orbitingBody end

--[=[
	Returns the orbital period.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function OrbitalTrajectory:period(): number return self.cache.period end

--[=[
	OrbitalTrajectory
]=]
function OrbitalTrajectory:hasApoapsis(): boolean return self.cache.apoapsis ~= false end

--[=[
	Returns the apoapsis.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function OrbitalTrajectory:apoapsis(): Type.KinematicState
	assert(self.cache.apoapsis ~= false, "OrbitalTrajectory apoapsis() Cannot call apoapsis() on an OrbitalTrajectory with no apoapsis")
	return self.cache.apoapsis
end

--[=[
	Returns the periapsis.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function OrbitalTrajectory:periapsis(): Type.KinematicState return self.cache.periapsis end



--[=[
	Returns the semi major axis.
	https://en.wikipedia.org/wiki/Vis-viva_equation
]=]
function OrbitalTrajectory:semiMajorAxis(): number return self.cache.semiMajorAxis end

--[=[
	Returns the semi minor axis.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function OrbitalTrajectory:semiMinorAxis(): number return self.cache.semiMinorAxis end

--[=[
	Returns the eccentricity.
	https://en.wikipedia.org/wiki/Eccentricity_vector
]=]
function OrbitalTrajectory:eccentricity(): number return self.cache.eccentricity end


--[=[
	Returns true if this trajectory is a bound orbit (eccentricity <= 1) and false otherwise.
]=]
function OrbitalTrajectory:isBound(): boolean return self.cache.isBound end

--[=[
	Returns true if this trajectory is a closed orbit (eccentricity < 1) and false otherwise.
]=]
function OrbitalTrajectory:isClosed(): boolean return self.cache.isClosed end

-- Calculators

--[=[
	Helper method for calculateTrueAnomalyFromTime().
	Apparently a calculation for eccentric anomaly using Kepler's Equation solved via the Newton-Raphson Method.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function OrbitalTrajectory:recursiveTrueAnomalyHelper(recursions: number, periapsisRelativeTime: number): number
	local mu: number = self.cache.mu
	local r: Type.Vector3D = self.cache.r
	local rM: number = self.cache.rM
	local v: Type.Vector3D = self.cache.v
	local vM: number = self.cache.vM
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
		elseif (
			(math.pi - 1 + (mu * r + rM * r:Cross(v):Cross(v)):Magnitude() / (mu * rM))
			<= math.abs((((t / mu) * (2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) % (2 * math.pi)) - math.pi)
		) then
			-- print(2)
			return math.pi * (2 * math.round((t / (2 * math.pi * mu)) * math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5))
		elseif (
			math.abs((((t / mu) * (2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) % (2 * math.pi)) - math.pi)
			<= (1 + (mu * r + rM * r:Cross(v):Cross(v)):Magnitude() / (mu * rM))
		) then
			-- print(3)
			return math.pi
				* (2 * math.floor((t / (2 * math.pi * mu)) * math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) + 1)
		else
			-- print(4)
			return math.pi * (math.floor((t / (math.pi * mu)) * math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) + 0.5)
		end
	else -- non-base case
		local prevRecursion: number = self:recursiveTrueAnomalyHelper(recursions - 1, periapsisRelativeTime)
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
function OrbitalTrajectory:calculateTrueAnomalyFromTime(relativeTime: number): number
	local mu: number = self.cache.mu
	local r: Type.Vector3D = self.cache.r
	local rM: number = self.cache.rM
	local v: Type.Vector3D = self.cache.v
	local vM: number = self.cache.vM

	local timeSincePeriapsis: number = self.cache.timeSincePeriapsis
	local periapsisRelativeTime: number = timeSincePeriapsis + relativeTime
	local TrueAnomalyHelperResult: number = self:recursiveTrueAnomalyHelper(8, periapsisRelativeTime)

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
function OrbitalTrajectory:calculatePointFromTrueAnomaly(trueAnomaly: number): Type.KinematicState
	local mu: number = self.cache.mu
	local r: Type.Vector3D = self.cache.r
	local rM: number = self.cache.rM
	local v: Type.Vector3D = self.cache.v
	local vM: number = self.cache.vM

	if self.cache.eccentricity == 0 then -- orbit is a circle
		return KinematicState.new(
			((math.sin(trueAnomaly) * r:Cross(v):Cross(r)) + (math.cos(trueAnomaly) * r:Cross(v):Magnitude() * r))
				/ r:Cross(v):Magnitude(),
			((math.cos(trueAnomaly) * r:Cross(v):Cross(r)) - (math.sin(trueAnomaly) * r:Cross(v):Magnitude() * r))
				/ (rM * r:Cross(v):Magnitude())
				* vM
		)
	elseif (
		self.cache.isClosed
		or ( -- check range of true anomaly of hyperbolic orbit
			not self.cache.isClosed
			and -math.acos(-(mu * rM) / (mu * r + rM * r:Cross(v):Cross(v)):Magnitude()) < math.abs(trueAnomaly) % (2 * math.pi) * math.sign(
				trueAnomaly
			)
			and math.abs(trueAnomaly) % (2 * math.pi) * math.sign(trueAnomaly)
				< math.acos(-(mu * rM) / (mu * r + rM * r:Cross(v):Cross(v)):Magnitude())
		)
	) then -- orbit is any other conic section
		-- note: for velocity, the mu that multiplies with the entire fraction was moved to denominator to counter floating point errors (the big fraction should not end up as (0,0,0))
		-- another note: really think about implementing arbitrary-precision arithmetic
		return KinematicState.new(
			(r:Cross(v):Magnitude() * rM)
			/ (
				-(mu * r + rM * r:Cross(v):Cross(v)):Magnitude()
				* (math.cos(trueAnomaly) * (mu * r + rM * r:Cross(v):Cross(v)):Magnitude() + mu * rM)
			) * (
				(math.sin(trueAnomaly) * (mu * r:Cross(v):Cross(r) - rM * r:Cross(v):Magnitude() ^ 2 * v))
				+ (math.cos(trueAnomaly) * r:Cross(v):Magnitude() * (mu * r + rM * r:Cross(v):Cross(v)))
			),
			(
				(
					-(math.cos(trueAnomaly) * (mu * r:Cross(v):Cross(r) - rM * r:Cross(v):Magnitude() ^ 2 * v))
					+ (math.sin(trueAnomaly) * r:Cross(v):Magnitude() * (mu * r + rM * r:Cross(v):Cross(v)))
				) / (
					(r:Cross(v):Magnitude() ^ 2) * (mu * r + rM * r:Cross(v):Cross(v)):Magnitude() / mu
				)
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
function OrbitalTrajectory:calculatePointFromTime(relativeTime: number): Type.KinematicState
	local trueAnomalyAngle: number = self:calculateTrueAnomalyFromTime(relativeTime)
	assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan ({trueAnomalyAngle})`)
	
	local resultPoint: Type.KinematicState = self:calculatePointFromTrueAnomaly(trueAnomalyAngle)

	return resultPoint
end

--[=[
	Calculates the true anomaly at the point on this OrbitalTrajectory closest to a given point.
	https://www.desmos.com/3d/rfndgd4ppj

	@param position The given point. Does not have to be a point on the trajectory.
	@return Returns the true anomaly angle in radians, or nil if there is no GravityBody being orbited.
]=]
function OrbitalTrajectory:calculateTrueAnomalyFromPoint(position: Type.Vector3D): number
	local mu: number = self.cache.mu
	local r: Type.Vector3D = self.cache.r
	local rM: number = self.cache.rM
	local v: Type.Vector3D = self.cache.v

	local greaterAnomaly: number
	local lesserAnomaly: number
	local greaterPoint: Type.Vector3D
	local lesserPoint: Type.Vector3D

	if self.cache.isClosed then -- find the quadrant of the point and get the two points at the axes lines bordering that quadrant (search range: 0 -> 2 * math.pi)
		local up: Type.Vector3D = self:calculatePointFromTrueAnomaly(math.pi):getPosition()
		local down: Type.Vector3D = self:calculatePointFromTrueAnomaly(0):getPosition()
		local left: Type.Vector3D = self:calculatePointFromTrueAnomaly(3 * math.pi / 2):getPosition()
		local right: Type.Vector3D = self:calculatePointFromTrueAnomaly(math.pi / 2):getPosition()

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
		greaterPoint = self:calculatePointFromTrueAnomaly(greaterAnomaly):getPosition()
		lesserAnomaly = -math.acos(-(mu * rM) / (mu * r + rM * r:Cross(v):Cross(v)):Magnitude()) + 2.24e-16
		lesserPoint = self:calculatePointFromTrueAnomaly(lesserAnomaly):getPosition()
	end

	-- Bisection search for true anomaly, check distance by converting anomaly to point and compare with position
	local lastMiddleAnomaly: number
	local middleAnomaly: number = (greaterAnomaly + lesserAnomaly) / 2
	local middlePoint: Type.Vector3D = self:calculatePointFromTrueAnomaly(middleAnomaly):getPosition()
	local anomalySearchIteration: number = 1

	repeat
		-- account for floating point error in trueAnomaly calculations
		local floatingPointError: boolean = (lastMiddleAnomaly == middleAnomaly) and (greaterAnomaly - lesserAnomaly ~= 0)

		-- Vector math for comparing the target point and middlePoint
		local transformedGreaterPoint: Type.Vector3D = greaterPoint - lesserPoint -- transformedLesserPoint is (0, 0, 0)
		local transformedTargetPoint: Type.Vector3D = position - lesserPoint
		local transformedMiddlePoint: Type.Vector3D = middlePoint - lesserPoint
		local referenceAxis: Type.Vector3D = transformedGreaterPoint / transformedGreaterPoint:Magnitude() -- get the unit axis vector

		-- Project the two points onto the reference axis with dot product
		local projectedTargetPoint: Type.Vector3D = referenceAxis * transformedTargetPoint:Dot(referenceAxis)
		local projectedMiddlePoint: Type.Vector3D = referenceAxis * transformedMiddlePoint:Dot(referenceAxis)

		-- Generate a 'number line' position along the reference axis for the two points
		local targetPointPosition: number = projectedTargetPoint:Dot(referenceAxis)
		local middleAnomalyPosition: number = projectedMiddlePoint:Dot(referenceAxis)

		if targetPointPosition > middleAnomalyPosition then -- move lesser angle up
			lesserAnomaly = if floatingPointError then greaterAnomaly else middleAnomaly
			lesserPoint = self:calculatePointFromTrueAnomaly(lesserAnomaly):getPosition()
		else --elseif targetPointPosition < middleAnomalyPosition then -- move greater angle down
			greaterAnomaly = if floatingPointError then lesserAnomaly else middleAnomaly
			greaterPoint = self:calculatePointFromTrueAnomaly(greaterAnomaly):getPosition()
		end
		-- else -- shortcut in case angle of target point is directly in the middle of lesser and greater angles -- doesnt work due to inaccurate floating point
		-- 	return middleAnomaly
		-- end

		lastMiddleAnomaly = middleAnomaly
		middleAnomaly = (greaterAnomaly + lesserAnomaly) / 2
		middlePoint = self:calculatePointFromTrueAnomaly(middleAnomaly):getPosition()

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
function OrbitalTrajectory:calculateTimeFromPeriapsis(trueAnomaly: number): number
	local mu: number = self.cache.mu
	local r: Type.Vector3D = self.cache.r
	local rM: number = self.cache.rM
	local v: Type.Vector3D = self.cache.v
	local vM: number = self.cache.vM

	if self.cache.isClosed then -- Orbit is circular / elliptic
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
function OrbitalTrajectory:calculateTimeFromTrueAnomaly(trueAnomaly: number, referenceTrueAnomaly: number?): number
	local adjustedReferenceTrueAnomaly: number = referenceTrueAnomaly or self:calculateTrueAnomalyFromPoint(self:getStartPosition():getPosition())

	return self:calculateTimeFromPeriapsis(trueAnomaly) - self:calculateTimeFromPeriapsis(adjustedReferenceTrueAnomaly)
end

--[=[
	Calculates the time until the craft reaches a specific point on this OrbitalTrajectory.
	Time may be negative if the current orbit is hyperbolic.
	https://www.desmos.com/3d/rfndgd4ppj

	@param position The position to be reached (may have already been reached if the current orbit is hyperbolic).
	@param referenceTrueAnomaly The refernce angle of true anomaly. If not provided, defaults to the current true anomaly (between 0 and 2 * math.pi).
]=]
function OrbitalTrajectory:calculateTimeFromPoint(position: Type.Vector3D, referencePosition: Type.Vector3D?): number
	local trueAnomalyAngle: number = self:calculateTrueAnomalyFromPoint(position)

	if referencePosition ~= nil then
		return self:calculateTimeFromTrueAnomaly(trueAnomalyAngle, self:calculateTrueAnomalyFromPoint(referencePosition))
	else
		return self:calculateTimeFromTrueAnomaly(trueAnomalyAngle)
	end
end

--[=[
	Calculates the true anomaly at a given point closest to a given altitude on this OrbitalTrajectory.
	https://www.desmos.com/3d/rfndgd4ppj

	@param magnitude
	@return Returns the true anomaly angle in radians within 0 and math.pi, or nil if there is no GravityBody being orbited.
]=]
function OrbitalTrajectory:calculateTrueAnomalyFromMagnitude(magnitude: number): number
	local mu: number = self.cache.mu
	local r: Type.Vector3D = self.cache.r
	local rM: number = self.cache.rM
	local v: Type.Vector3D = self.cache.v

	local greaterAnomaly: number
	local lesserAnomaly: number

	lesserAnomaly = 0

	if self.cache.isClosed then -- search range: 0 -> math.pi
		greaterAnomaly = math.pi
	else -- search range: 0 -> (x < math.pi) (the range of true anomaly of hyperbolic orbit)
		greaterAnomaly = math.acos(-(mu * rM) / (mu * r + rM * r:Cross(v):Cross(v)):Magnitude()) - 2.24e-16 -- subtract small number so greaterPoint will work, hopefully
	end

	-- Bisection search for true anomaly, check distance by converting anomaly to point and compare with magnitude
	local lastMiddleAnomaly: number
	local middleAnomaly: number = (greaterAnomaly + lesserAnomaly) / 2
	local middleAnomalyMagnitude: number = self:calculatePointFromTrueAnomaly(middleAnomaly):getPosition():Magnitude()
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
		middleAnomalyMagnitude = self:calculatePointFromTrueAnomaly(middleAnomaly):getPosition():Magnitude()
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
function OrbitalTrajectory:calculateTimeFromMagnitude(magnitude: number): number
	local trueAnomalyAngle: number = self:calculateTrueAnomalyFromMagnitude(magnitude)
	assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan`)

	local resultTime: number = self:calculateTimeFromTrueAnomaly(trueAnomalyAngle)
	assert(resultTime == resultTime, `resultTime is nan`)

	return resultTime
end

--[=[
	Calculates a new MovingObject at a given altitude on this OrbitalTrajectory.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function OrbitalTrajectory:calculatePointFromMagnitude(magnitude: number): Type.KinematicState
	local trueAnomalyAngle: number = self:calculateTrueAnomalyFromMagnitude(magnitude)
	assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan`)

	local resultPoint: Type.KinematicState = self:calculatePointFromTrueAnomaly(trueAnomalyAngle)

	return resultPoint
end

return OrbitalTrajectory :: Constructor.OrbitalTrajectory

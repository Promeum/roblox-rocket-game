--!strict

--[[
	Performace enhancements:

	Have subparameters to calculate repeated calcs only once, then substitute redundant calcs w/ the variable
	Find out exactly what operations/methods are computationally expensive

	TODO:
	CalculateTimeFromPoint - Need to implement looking in the past for hyperbolic orbits! (time = negative)
	Is the vector multiplication correct? Convert everything to dot products?
]]

function Magnitude(v: Vector3): number
	return math.sqrt(v.X ^ 2 + v.Y ^ 2 + v.Z ^ 2)
end

function Dot(v1: Vector3, v2: Vector3): number
	return (v1.X * v2.X) + (v1.Y * v2.Y) + (v1.Z * v2.Z)
end

local Modules = require(game.ReplicatedStorage.Modules.Modules)
-- local Constants = require(game.ReplicatedStorage.Modules.Constants)
local MovingObject = require(script.Parent.Parent.Parent.MovingObject)
local SolarSystemObject = require(script.Parent.Parent.SolarSystemObject)

local TrajectoryObject = {}

--[=[
	Creates a new TrajectoryObject instance.
]=]
function TrajectoryObject.new(
	position: Vector3,
	velocity: Vector3,
	orbitingBody: Modules.GravityBody?
): Modules.TrajectoryObject
	return TrajectoryObject.from(SolarSystemObject.new(position, velocity), orbitingBody)
end

--[=[
	Creates a new TrajectoryObject instance, with a given SolarSystemObject super-instance.
	This effectively links this instance with other objects with the same super-instance.
]=]
function TrajectoryObject.from(
	solarSystemObject: Modules.SolarSystemObject,
	orbitingBody: Modules.GravityBody?
): Modules.TrajectoryObject
	local newTrajectoryObject = table.clone(TrajectoryObject)

	newTrajectoryObject.OrbitingBody = orbitingBody

	local metatable = {
		__index = solarSystemObject,
		__type = "TrajectoryObject",
	}

	setmetatable(newTrajectoryObject, metatable)

	if newTrajectoryObject.OrbitingBody then
		local mu: number = newTrajectoryObject.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
		local r: Vector3 = newTrajectoryObject.Position -- Position vector
		local rM: number = r.Magnitude -- Position magnitude
		local v: Vector3 = newTrajectoryObject.Velocity -- Velocity vector
		local vM: number = v.Magnitude -- Velocity magnitude

		local visVivaSubParameter: number = 2 * mu * (rM ^ -1) - vM ^ 2

		metatable._OrbitalPeriod = 2 * math.pi * mu * (visVivaSubParameter ^ -1.5)

		metatable._SemiMajorAxis = mu / visVivaSubParameter

		metatable._SemiMinorAxis = Magnitude(r:Cross(v)) / math.sqrt(math.abs(visVivaSubParameter))

		metatable._Eccentricity = Magnitude(mu * r + (rM * r:Cross(v):Cross(v))) / (mu * rM)

		metatable._IsBound = newTrajectoryObject:Eccentricity() <= 1

		metatable._IsClosed = newTrajectoryObject:Eccentricity() < 1

		metatable._TimeToPeriapsis = 0

		metatable._Periapsis = newTrajectoryObject:CalculatePointFromTrueAnomaly(0)
		assert(metatable._Periapsis, `periapsis is nil ({metatable._Periapsis})`)

		metatable._Apoapsis = if newTrajectoryObject:IsBound()
			then newTrajectoryObject:CalculatePointFromTrueAnomaly(math.pi)
			else nil

		if newTrajectoryObject:OrbitalPeriod() == newTrajectoryObject:OrbitalPeriod() then
			metatable._TimeSincePeriapsis = newTrajectoryObject:CalculateTimeFromPoint(newTrajectoryObject.Position, 0)
			metatable._TimeToPeriapsis = newTrajectoryObject:OrbitalPeriod() - metatable._TimeSincePeriapsis
		else
			metatable._TimeSincePeriapsis = newTrajectoryObject:CalculateTimeFromPoint(newTrajectoryObject.Position, 0)
			metatable._TimeToPeriapsis = -metatable._TimeSincePeriapsis
		end

		assert(
			newTrajectoryObject:TimeToPeriapsis() == newTrajectoryObject:TimeToPeriapsis(),
			`no time to periapsis!!!!!! ({newTrajectoryObject:TimeToPeriapsis()})`
		)

		newTrajectoryObject._SpecificOrbitalEnergy = (vM ^ 2 / 2) - (mu / rM)
	else
		metatable._IsBound = false
		metatable._IsClosed = false
	end

	return newTrajectoryObject
end

--[=[
	Returns the next TrajectoryObject, if it is detected that this TrajectoryObject enters a new SOI.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryObject:NextTrajectory(): Modules.TrajectoryObject?
	local timesToSOI: { number } = {}
	local gravityBodiesIntercepted: { Modules.GravityBody? } = {}
	local gravityBodies: { Modules.GravityBody? } = {}

	if self.OrbitingBody then
		local orbitingBody: Modules.GravityBody = self.OrbitingBody
		-- gravityBodies = orbitingBody.ChildGravityBodies -- uncomment when ready

		local escapingSOI: boolean = not self:IsClosed()
			or (self:Apoapsis() and Magnitude(self:Apoapsis().Position) > orbitingBody.SOIRadius)

		if escapingSOI then
			table.insert(timesToSOI, self:CalculateTimeFromMagnitude(orbitingBody.SOIRadius))
			table.insert(gravityBodiesIntercepted, orbitingBody.ParentGravityBody)
		end
		-- error("rthj")
		if #gravityBodies > 0 then
			-- bisection search to find if this trajectory goes in any SOI
			for i, gravityBodyToTest in ipairs(gravityBodies) do
				print(`{i}:`)
				print(gravityBodyToTest)

				-- generate points
				local maxTimeToSearch: number = 10 ^ 30

				if escapingSOI then
					maxTimeToSearch = timesToSOI[1]
				end

				-- choose a pair of 2 points to search between

				-- bisection search

				-- final result?
				local timeToSOI: number = -1

				-- table.insert(timesToSOI, timeToSOI)
				-- table.insert(gravityBodiesIntercepted, gravityBodyToTest)
			end
		end
	else
		gravityBodies = {} -- TODO: find a way to fetch array of all root GravityBodies

		if #gravityBodies > 0 then
			-- bisection search to find if this trajectory goes in any SOI
			for i, gravityBodyToTest in ipairs(gravityBodies) do
				print(`{i}:`)
				print(gravityBodyToTest)

				-- generate a pair of 2 points to search between

				-- bisection search

				-- final result?
				local timeToSOI: number = -1

				-- table.insert(timesToSOI, timeToSOI)
				-- table.insert(gravityBodiesIntercepted, gravityBodyToTest)
			end
		end
	end

	-- look through results
	if #timesToSOI > 0 then
		local timeToNearestSOI: number = math.min(table.unpack(timesToSOI))
		local nearestSOIBoundary: Modules.GravityBody? = gravityBodiesIntercepted[table.find(
			timesToSOI,
			timeToNearestSOI
		) or error(`timeToNearestSOI ({timeToNearestSOI}) not in timesToSOI ({timesToSOI})`)]

		return TrajectoryObject.from(
			SolarSystemObject.from(
				self:CalculatePointFromTime(timeToNearestSOI)
					+ if self.OrbitingBody then self.OrbitingBody:getSuper():getSuper() else nil
			),
			nearestSOIBoundary
		)
	else
		return nil
	end
end

--[=[
	Returns the orbital period.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryObject:OrbitalPeriod(): number
	assert(
		self.OrbitingBody,
		`TrajectoryObject:OrbitalPeriod() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	return getmetatable(self)._OrbitalPeriod
end

--[=[
	Returns the time (in seconds) to the nextperiapsis.
	Should always be positive if orbit is bound. Otherwise, may be negative if past the periapsis (since the orbit is a hyperbola).
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryObject:TimeToPeriapsis(): number
	assert(
		self.OrbitingBody,
		`TrajectoryObject:TimeToPeriapsis() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	return getmetatable(self)._TimeToPeriapsis
end

--[=[
	Returns the time (in seconds) since the last periapsis.
	Should always be positive if orbit is bound. Otherwise, may be negative if not past the periapsis (since the orbit is a hyperbola).
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryObject:TimeSincePeriapsis(): number
	assert(
		self.OrbitingBody,
		`TrajectoryObject:TimeSincePeriapsis() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	return getmetatable(self)._TimeSincePeriapsis
end

--[=[
	Returns the apoapsis.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryObject:Apoapsis(): Modules.MovingObject
	assert(
		self.OrbitingBody,
		`TrajectoryObject:Apoapsis() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	return getmetatable(self)._Apoapsis
end

--[=[
	Returns the periapsis.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryObject:Periapsis(): Modules.MovingObject
	assert(
		self.OrbitingBody,
		`TrajectoryObject:Periapsis() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	return getmetatable(self)._Periapsis or error(`TrajectoryObject Periapsis is nil ({getmetatable(self)._Periapsis})`)
end

--[=[
	Returns the semi major axis.
	https://en.wikipedia.org/wiki/Vis-viva_equation
]=]
function TrajectoryObject:SemiMajorAxis(): number
	assert(
		self.OrbitingBody,
		`TrajectoryObject:SemiMajorAxis() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	return getmetatable(self)._SemiMajorAxis
end

--[=[
	Returns the semi minor axis.
	https://en.wikipedia.org/wiki/Orbital_elements
]=]
function TrajectoryObject:SemiMinorAxis(): number
	assert(
		self.OrbitingBody,
		`TrajectoryObject:SemiMinorAxis() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	return getmetatable(self)._SemiMinorAxis
end

--[=[
	Returns the eccentricity.
	https://en.wikipedia.org/wiki/Eccentricity_vector
]=]
function TrajectoryObject:Eccentricity(): number
	assert(
		self.OrbitingBody,
		`TrajectoryObject:Eccentricity() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	return getmetatable(self)._Eccentricity
end

--[=[
	Returns true if this trajectory is a bound orbit (eccentricity <= 1) and false otherwise.
]=]
function TrajectoryObject:IsBound(): boolean
	return getmetatable(self)._IsBound
end

--[=[
	Returns true if this trajectory is a closed orbit (eccentricity < 1) and false otherwise.
]=]
function TrajectoryObject:IsClosed(): boolean
	return getmetatable(self)._IsClosed
end

--[=[
	Helper method for CalculateTrueAnomalyFromTime().
	Apparently a calculation for eccentric anomaly using Kepler's Equation solved via the Newton-Raphson Method.
	Returns nil if there is no GravityBody being orbited.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:RecursiveTrueAnomalyHelper(recursions: number, periapsisRelativeTime: number): number
	assert(
		self.OrbitingBody,
		`TrajectoryObject:RecursiveTrueAnomalyHelper() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	assert(periapsisRelativeTime == periapsisRelativeTime, `periapsisrelativetime is nan ({periapsisRelativeTime})`)
	local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Vector3 = self.Position -- Position vector
	local rM: number = r.Magnitude -- Position magnitude
	local v: Vector3 = self.Velocity -- Velocity vector
	local vM: number = v.Magnitude -- Velocity magnitude
	local t: number = periapsisRelativeTime

	if recursions == 0 then -- base case
		if 2 * mu <= rM * vM ^ 2 then
			-- print(1)
			return math.sign(t)
				* math.sqrt(
					(math.log(
								(
									(2 * rM * math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5 * math.abs(t))
									/ Magnitude(mu * r + rM * r:Cross(v):Cross(v))
								) + 1
							) + 1)
							^ 2
						- 1
				)
		elseif
			(math.pi - 1 + Magnitude(mu * r + rM * r:Cross(v):Cross(v)) / (mu * rM))
			<= math.abs((((t / mu) * (2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) % (2 * math.pi)) - math.pi)
		then
			-- print(2)
			return math.pi * (2 * math.round((t / (2 * math.pi * mu)) * math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5))
		elseif
			math.abs((((t / mu) * (2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) % (2 * math.pi)) - math.pi)
			<= (1 + Magnitude(mu * r + rM * r:Cross(v):Cross(v)) / (mu * rM))
		then
			-- print(3)
			return math.pi
				* (2 * math.floor((t / (2 * math.pi * mu)) * math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) + 1)
		else
			-- print(4)
			return math.pi * (math.floor((t / (math.pi * mu)) * math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) + 0.5)
		end
	else -- non-base case
		local prevRecursion = self:RecursiveTrueAnomalyHelper(recursions - 1, periapsisRelativeTime)
		assert(prevRecursion == prevRecursion, `prevRecursion is nan ({prevRecursion})`)

		-- print(`recursion {recursions - 1}`)
		-- print(prevRecursion)

		if 2 * mu <= rM * vM ^ 2 then
			return prevRecursion
				+ (
						rM * (math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) * t
						+ mu * rM * prevRecursion
						- math.sinh(prevRecursion) * Magnitude(mu * r + rM * r:Cross(v):Cross(v))
					)
					/ (math.cosh(prevRecursion) * Magnitude(mu * r + rM * r:Cross(v):Cross(v)) - mu * rM)
		else
			return prevRecursion
				+ (
						rM * ((2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) * t
						- mu * rM * prevRecursion
						+ math.sin(prevRecursion) * Magnitude(mu * r + rM * r:Cross(v):Cross(v))
					)
					/ (-math.cos(prevRecursion) * Magnitude(mu * r + rM * r:Cross(v):Cross(v)) + mu * rM)
		end
	end -- ...should i be concerned about performance issues
end

--[=[
	Calculates the angle of true anomaly at a given point in time on this TrajectoryObject.
	Returns nil if there is no GravityBody being orbited.
	https://en.wikipedia.org/wiki/True_anomaly
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculateTrueAnomalyFromTime(relativeTime: number): number
	assert(
		self.OrbitingBody,
		`TrajectoryObject:CalculateTrueAnomalyFromTime() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Vector3 = self.Position -- Position vector
	local rM: number = r.Magnitude -- Position magnitude
	local v: Vector3 = self.Velocity -- Velocity vector
	local vM: number = v.Magnitude -- Velocity magnitude
	local timeFromPeriapsis: number
	if self:OrbitalPeriod() == self:OrbitalPeriod() then
		timeFromPeriapsis = self:OrbitalPeriod() - self:TimeToPeriapsis()
	else
		timeFromPeriapsis = -self:TimeToPeriapsis()
	end

	local periapsisRelativeTime: number = -timeFromPeriapsis + relativeTime

	local TrueAnomalyHelperResult = self:RecursiveTrueAnomalyHelper(8, periapsisRelativeTime)
	assert(
		TrueAnomalyHelperResult == TrueAnomalyHelperResult,
		`TrueAnomalyHelperResult is nan ({TrueAnomalyHelperResult})`
	)

	if (rM * vM ^ 2) < (2 * mu) then --self:IsClosed() then -- orbit is not hyperbolic, eccentricity < 1
		return (
			2
				* math.pi
				* math.ceil(
					(math.abs(2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) * (periapsisRelativeTime / (2 * mu * math.pi)) - 0.5
				)
			+ 2
				* math.atan(
					(mu * rM + Magnitude(mu * r + rM * r:Cross(v):Cross(v)))
						/ (rM * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)) * Magnitude(r:Cross(v)))
						* math.tan(0.5 * TrueAnomalyHelperResult)
				)
		) % (2 * math.pi)
	else -- orbit is hyperbolic, eccentricity >= 1
		return 2
			* math.atan(
				(mu * rM + Magnitude(mu * r + rM * r:Cross(v):Cross(v)))
					/ (rM * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)) * Magnitude(r:Cross(v)))
					* math.tanh(0.5 * TrueAnomalyHelperResult)
			)
	end -- ...should i be concerned about performance issues
end

--[=[
	Calculates a new TrajectoryObject at a given point on this TrajectoryObject, using the angle of true anomaly.
	Returns nil if there is no GravityBody being orbited.
	https://en.wikipedia.org/wiki/True_anomaly
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculatePointFromTrueAnomaly(trueAnomaly: number): Modules.MovingObject
	assert(
		self.OrbitingBody,
		`TrajectoryObject:CalculatePointFromTrueAnomaly() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Vector3 = self.Position -- Position vector
	local rM: number = r.Magnitude -- Position magnitude
	local v: Vector3 = self.Velocity -- Velocity vector
	local vM: number = v.Magnitude -- Velocity magnitude

	if self:Eccentricity() == 0 then -- orbit is a circle
		return MovingObject.new(
			((math.sin(trueAnomaly) * r:Cross(v):Cross(r)) + (math.cos(trueAnomaly) * Magnitude(r:Cross(v)) * r))
				/ Magnitude(r:Cross(v)),
			((math.cos(trueAnomaly) * r:Cross(v):Cross(r)) - (math.sin(trueAnomaly) * Magnitude(r:Cross(v)) * r))
				/ (rM * Magnitude(r:Cross(v)))
				* vM
		)
	elseif
		self:IsClosed()
		or ( -- check range of true anomaly of hyperbolic orbit
			not self:IsClosed()
			and -math.acos(-(mu * rM) / Magnitude(mu * r + rM * r:Cross(v):Cross(v))) < math.abs(trueAnomaly) % (2 * math.pi) * math.sign(
				trueAnomaly
			)
			and math.abs(trueAnomaly) % (2 * math.pi) * math.sign(trueAnomaly)
				< math.acos(-(mu * rM) / Magnitude(mu * r + rM * r:Cross(v):Cross(v)))
		)
	then -- orbit is any other conic section
		-- note: for velocity, the mu that multiplies with the entire fraction was moved to denominator to counter floating point errors (the big fraction should not end up as (0,0,0))
		-- another note: really think about implementing arbitrary-precision arithmetic
		return MovingObject.new(
			(Magnitude(r:Cross(v)) * rM)
				/ (-Magnitude(mu * r + rM * r:Cross(v):Cross(v)) * (math.cos(trueAnomaly) * Magnitude(
					mu * r + rM * r:Cross(v):Cross(v)
				) + mu * rM))
				* (
					(math.sin(trueAnomaly) * (mu * r:Cross(v):Cross(r) - rM * Magnitude(r:Cross(v)) ^ 2 * v))
					+ (math.cos(trueAnomaly) * Magnitude(r:Cross(v)) * (mu * r + rM * r:Cross(v):Cross(v)))
				),
			(
				(
					-(math.cos(trueAnomaly) * (mu * r:Cross(v):Cross(r) - rM * Magnitude(r:Cross(v)) ^ 2 * v))
					+ (math.sin(trueAnomaly) * Magnitude(r:Cross(v)) * (mu * r + rM * r:Cross(v):Cross(v)))
				) / ((Magnitude(r:Cross(v)) ^ 2) * Magnitude(mu * r + rM * r:Cross(v):Cross(v)) / mu)
			)
				- ((mu * r:Cross(v):Cross(r)) / ((Magnitude(r:Cross(v)) ^ 2) * rM))
				+ v
		) -- ...should i be concerned about performance issues
	else -- true anomaly is out of range of hyperbolic orbit
		return error(
			`CalculatePointFromTrueAnomaly Invalid angle\n(min: {-math.acos(
				-(mu * rM) / Magnitude(mu * r + rM * r:Cross(v):Cross(v))
			)})\n(max: {math.acos(-(mu * rM) / Magnitude(mu * r + rM * r:Cross(v):Cross(v)))})`
		)
	end
end

--[=[
	Calculates a new MovingObject at a given point in time on this TrajectoryObject.
	https://www.desmos.com/3d/rfndgd4ppj

	@param relativeTime The time passed since the location of this TrajectoryObject.
]=]
function TrajectoryObject:CalculatePointFromTime(relativeTime: number): Modules.MovingObject
	if self.OrbitingBody then
		local trueAnomalyAngle = self:CalculateTrueAnomalyFromTime(relativeTime)
		assert(
			typeof(trueAnomalyAngle) == "number" and trueAnomalyAngle == trueAnomalyAngle,
			`trueAnomalyAngle is nan ({trueAnomalyAngle})`
		)
		local resultPoint = self:CalculatePointFromTrueAnomaly(trueAnomalyAngle)
		assert(resultPoint == resultPoint, `resultPoint is nan ({resultPoint})`)

		-- if self.OrbitingBody.SOIRadius > 88e6 then -- check the moon
		-- 	print("testing")
		-- 	print(trueAnomalyAngle)
		-- 	print(resultPoint.Position)
		-- end
		-- print("TrajectoryObject")
		-- print(trueAnomalyAngle)
		-- print(resultPoint)
		return resultPoint
	else
		return MovingObject.new(self.Position + self.Velocity * relativeTime, self.Velocity)
	end
end

--[=[
	Calculates the true anomaly at the point on this TrajectoryObject closest to a given point.
	https://www.desmos.com/3d/rfndgd4ppj

	@param position The given point. Does not have to be a point on the trajectory.
	@return Returns the true anomaly angle in radians, or nil if there is no GravityBody being orbited.
]=]
function TrajectoryObject:CalculateTrueAnomalyFromPoint(position: Vector3): number
	assert(
		self.OrbitingBody,
		`TrajectoryObject:CalculateTrueAnomalyFromPoint() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Vector3 = self.Position -- Position vector
	local rM: number = r.Magnitude -- Position magnitude
	local v: Vector3 = self.Velocity -- Velocity vector

	local greaterAnomaly: number
	local lesserAnomaly: number
	local greaterPoint: Vector3
	local lesserPoint: Vector3

	--
	if self:IsClosed() then -- find the quadrant of the point and get the two points at the axes lines bordering that quadrant (search range: 0 -> 2 * math.pi)
		local up: Vector3 = self:CalculatePointFromTrueAnomaly(math.pi).Position
		local down: Vector3 = self:CalculatePointFromTrueAnomaly(0).Position
		local left: Vector3 = self:CalculatePointFromTrueAnomaly(3 * math.pi / 2).Position
		local right: Vector3 = self:CalculatePointFromTrueAnomaly(math.pi / 2).Position

		if Magnitude(up - position) < Magnitude(down - position) then
			if Magnitude(left - position) < Magnitude(right - position) then
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
			if Magnitude(left - position) < Magnitude(right - position) then
				greaterAnomaly = 3 * math.pi / 2
				greaterPoint = left
			else
				greaterAnomaly = math.pi / 2
				greaterPoint = right
			end
		end
	else -- get the two points defining the range of true anomaly of hyperbolic orbit (search range: -(x < math.pi) -> (x < math.pi))
		greaterAnomaly = math.acos(-(mu * rM) / Magnitude(mu * r + rM * r:Cross(v):Cross(v))) - 2.24e-16
		greaterPoint = self:CalculatePointFromTrueAnomaly(greaterAnomaly).Position
		lesserAnomaly = -math.acos(-(mu * rM) / Magnitude(mu * r + rM * r:Cross(v):Cross(v))) + 2.24e-16
		lesserPoint = self:CalculatePointFromTrueAnomaly(lesserAnomaly).Position
	end

	-- Bisection search for true anomaly, check distance by converting anomaly to point and compare with position
	local middleAnomaly: number = (greaterAnomaly + lesserAnomaly) / 2
	local middleAnomalyPoint: Vector3 = self:CalculatePointFromTrueAnomaly(middleAnomaly).Position
	local anomalySearchIteration: number = 1

	repeat
		-- Vector math for comparing the target point and middleAnomalyPoint
		local transformedGreaterPoint: Vector3 = greaterPoint - lesserPoint -- transformedLesserPoint is (0, 0, 0)
		local transformedTargetPoint: Vector3 = position - lesserPoint
		local transformedmiddleAnomalyPoint: Vector3 = middleAnomalyPoint - lesserPoint
		local referenceAxis: Vector3 = transformedGreaterPoint / Magnitude(transformedGreaterPoint) -- get the unit axis vector

		-- Project the two points onto the reference axis with dot product
		local projectedTargetPoint: Vector3 = referenceAxis * Dot(transformedTargetPoint, referenceAxis)
		local projectedmiddleAnomalyPoint: Vector3 = referenceAxis * Dot(transformedmiddleAnomalyPoint, referenceAxis)

		-- Generate a 'number line' position along the reference axis for the two points
		local targetPointPosition: number = Dot(projectedTargetPoint, referenceAxis)
		local middleAnomalyPosition: number = Dot(projectedmiddleAnomalyPoint, referenceAxis)

		if targetPointPosition > middleAnomalyPosition then -- move lesser angle up
			lesserAnomaly = middleAnomaly
			lesserPoint = self:CalculatePointFromTrueAnomaly(lesserAnomaly).Position
		else --elseif targetPointPosition < middleAnomalyPosition then -- move greater angle down
			greaterAnomaly -= middleAnomaly - lesserAnomaly
			greaterPoint = self:CalculatePointFromTrueAnomaly(greaterAnomaly).Position
		end
		-- else -- shortcut in case angle of target point is directly in the middle of lesser and greater angles -- doesnt work due to inaccurate floating point
		-- 	return middleAnomaly
		-- end

		middleAnomaly = (greaterAnomaly + lesserAnomaly) / 2
		middleAnomalyPoint = self:CalculatePointFromTrueAnomaly(middleAnomaly).Position
		print(`iteration {anomalySearchIteration}`)
		print(greaterAnomaly)
		print(middleAnomaly)
		print(lesserAnomaly)
		-- assert(middleAnomaly ~= nil, `middleAnomalyPoint has errored ({middleAnomalyPoint})`)
		-- ...should i be concerned about performance issues

		assert(
			anomalySearchIteration <= 100,
			`Anomaly iterative search taking too long, concluded at {math.min(
				Magnitude(greaterPoint - position),
				Magnitude(lesserPoint - position)
			)} distance from target`
		)

		anomalySearchIteration += 1
	until (greaterAnomaly - lesserAnomaly) < (2 ^ -50) or Magnitude(middleAnomalyPoint - position) == 0
	print(`trueAnomaly calc finished at {anomalySearchIteration} iterations`)
	print(middleAnomaly)
	return middleAnomaly
end

--[=[
	Calculates the length of time from the periapsis to the given true anomaly.
	https://www.desmos.com/3d/rfndgd4ppj

	@param trueAnomaly The angle of true anomaly. Can be any value.
]=]
function TrajectoryObject:CalculateTimeFromPeriapsis(trueAnomaly: number): number
	assert(
		self.OrbitingBody,
		`TrajectoryObject:CalculateTimeFromTrueAnomaly() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Vector3 = self.Position -- Position vector
	local rM: number = r.Magnitude -- Position magnitude
	local v: Vector3 = self.Velocity -- Velocity vector
	local vM: number = v.Magnitude -- Velocity magnitude

	assert(
		self:IsClosed() == (((vM ^ 2) * rM) < (2 * mu)),
		`{self:IsClosed()} not equal to {((vM ^ 2) * rM) < (2 * mu)} (Eccectricity: {self:Eccentricity()})`
	)

	if self:IsClosed() then -- Orbit is circular / elliptic
		return (-Magnitude(r:Cross(v)) * Magnitude(mu * r + rM * r:Cross(v):Cross(v)) * math.sin(trueAnomaly))
				/ ((2 * mu * (rM ^ -1) - vM ^ 2) * (Magnitude(mu * r + rM * r:Cross(v):Cross(v)) * math.cos(trueAnomaly) + mu * rM))
			+ (mu * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)) ^ -3)
				* (2 * math.pi * math.ceil(trueAnomaly / (2 * math.pi) - 0.5) - 2 * math.atan(
					(Magnitude(mu * r + rM * r:Cross(v):Cross(v)) - mu * rM)
						/ (Magnitude(r:Cross(v)) * rM * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)))
						* math.tan(trueAnomaly / 2)
				))
	else -- Orbit is parabolic / hyperbolic
		return (-Magnitude(r:Cross(v)) * Magnitude(mu * r + rM * r:Cross(v):Cross(v)) * math.sin(trueAnomaly))
				/ ((2 * mu * (rM ^ -1) - vM ^ 2) * (Magnitude(mu * r + rM * r:Cross(v):Cross(v)) * math.cos(trueAnomaly) + mu * rM))
			+ (mu * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)) ^ -3)
				* (-math.log(
					(Magnitude(mu * r + rM * r:Cross(v):Cross(v)) * math.cos(trueAnomaly) + mu * rM)
						/ (
							Magnitude(mu * r + rM * r:Cross(v):Cross(v))
							+ mu * rM * math.cos(trueAnomaly)
							- math.sin(trueAnomaly)
								* rM
								* Magnitude(r:Cross(v))
								* math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2))
						)
				))
	end
end

--[=[
	Calculates the length of time seperating two given true anomalies on this TrajectoryObject.
	https://www.desmos.com/3d/rfndgd4ppj

	@param trueAnomaly The end angle of true anomaly. Can be any value.
	@param referenceTrueAnomaly The start angle of true anomaly. If not provided, defaults to the current true anomaly (between 0 and 2 * math.pi).
	@return Returns a value, in seconds, representing the length of time to go from trueAnomaly to referenceTrueAnomaly. Can be negative if the current orbit is a hyperbola.
]=]
function TrajectoryObject:CalculateTimeFromTrueAnomaly(trueAnomaly: number, referenceTrueAnomaly: number?): number
	assert(
		self.OrbitingBody,
		`TrajectoryObject:CalculateTimeFromTrueAnomaly() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	local adjustedReferenceTrueAnomaly: number = referenceTrueAnomaly
		or self:CalculateTrueAnomalyFromPoint(self.Position)

	return self:CalculateTimeFromPeriapsis(trueAnomaly) - self:CalculateTimeFromPeriapsis(adjustedReferenceTrueAnomaly)
end

--[=[
	Calculates the time until the craft reaches a specific point on this TrajectoryObject.
	Time may be negative if the current orbit is hyperbolic.
	https://www.desmos.com/3d/rfndgd4ppj

	@param position The position to be reached (may have already been reached if the current orbit is hyperbolic).
	@param referenceTrueAnomaly The refernce angle of true anomaly. If not provided, defaults to the current true anomaly (between 0 and 2 * math.pi).
]=]
function TrajectoryObject:CalculateTimeFromPoint(
	position: Vector3,
	referenceTrueAnomaly: number?
): number -- Need to implement looking in the past for hyperbolic orbits!
	if self.OrbitingBody then
		local trueAnomalyAngle = self:CalculateTrueAnomalyFromPoint(position)
		assert(
			trueAnomalyAngle ~= nil and trueAnomalyAngle == trueAnomalyAngle,
			`trueAnomalyAngle is invalid ({trueAnomalyAngle})`
		)

		return self:CalculateTimeFromTrueAnomaly(trueAnomalyAngle, referenceTrueAnomaly)
	else
		return self:getSuper():CalculateTimeFromPoint(position)
	end
end

--[=[
	Calculates the true anomaly at a given point closest to a given altitude on this TrajectoryObject.
	https://www.desmos.com/3d/rfndgd4ppj

	@param magnitude
	@return Returns the true anomaly angle in radians within 0 and math.pi, or nil if there is no GravityBody being orbited.
]=]
function TrajectoryObject:CalculateTrueAnomalyFromMagnitude(magnitude: number): number
	assert(
		self.OrbitingBody,
		`TrajectoryObject:CalculateTrueAnomalyFromMagnitude() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Vector3 = self.Position -- Position vector
	local rM: number = r.Magnitude -- Position magnitude
	local v: Vector3 = self.Velocity -- Velocity vector

	local greaterAnomaly: number
	local lesserAnomaly: number
	local greaterMagnitude: number
	local lesserMagnitude: number

	lesserAnomaly = 0
	lesserMagnitude = Magnitude(self:CalculatePointFromTrueAnomaly(lesserAnomaly).Position)

	if self:IsClosed() then -- search range: 0 -> math.pi
		greaterAnomaly = math.pi
		greaterMagnitude = Magnitude(self:CalculatePointFromTrueAnomaly(greaterAnomaly).Position)
	else -- search range: 0 -> (x < math.pi) (the range of true anomaly of hyperbolic orbit)
		greaterAnomaly = math.acos(-(mu * rM) / Magnitude(mu * r + rM * r:Cross(v):Cross(v))) - 2.24e-16 -- subtract small number so greaterPoint will work, hopefully
		greaterMagnitude = Magnitude(self:CalculatePointFromTrueAnomaly(greaterAnomaly).Position)
	end

	-- Bisection search for true anomaly, check distance by converting anomaly to point and compare with magnitude
	local trueAnomaly: number = (greaterAnomaly + lesserAnomaly) / 2
	local trueAnomalyMagnitude: number = Magnitude(self:CalculatePointFromTrueAnomaly(trueAnomaly).Position)
	local lastTrueAnomalyMagnitude: number
	local anomalySearchIteration: number = 0
	assert(trueAnomalyMagnitude ~= math.huge, `infinite value detected`)
	repeat
		if trueAnomalyMagnitude < magnitude then
			lesserAnomaly = trueAnomaly
			lesserMagnitude = Magnitude(self:CalculatePointFromTrueAnomaly(lesserAnomaly).Position)
		else
			greaterAnomaly -= trueAnomaly - lesserAnomaly
			greaterMagnitude = Magnitude(self:CalculatePointFromTrueAnomaly(greaterAnomaly).Position)
		end

		lastTrueAnomalyMagnitude = trueAnomalyMagnitude

		trueAnomaly = (greaterAnomaly + lesserAnomaly) / 2
		trueAnomalyMagnitude = Magnitude(self:CalculatePointFromTrueAnomaly(trueAnomaly).Position)
		-- assert(trueAnomalyMagnitude ~= nil, `trueAnomalyPosition has errored ({trueAnomalyMagnitude})`)
		-- ...should i be concerned about performance issues

		assert(
			anomalySearchIteration <= 50,
			`Anomaly iterative search taking too long, concluded at {math.min(
				greaterMagnitude - magnitude,
				lesserMagnitude - magnitude
			)} distance from target`
		)
		-- assert(
		-- 	math.abs(trueAnomalyMagnitude) ~= math.huge and trueAnomalyMagnitude == trueAnomalyMagnitude,
		-- 	`trueAnomalyMagnitude is invalid ({trueAnomalyMagnitude})`
		-- )

		anomalySearchIteration += 1
	until (greaterAnomaly - lesserAnomaly) < (10 ^ -11) or lastTrueAnomalyMagnitude == trueAnomalyMagnitude
	print(`trueAnomaly calc finished at {anomalySearchIteration} iterations`)
	print(trueAnomalyMagnitude, magnitude)
	return trueAnomaly
end

--[=[
	Calculates the time the craft reaches a specific altitude on this TrajectoryObject.
	Times are relative to this TrajectoryObject.
	Time can be either negative or positive if the trajectory is a hyperbola, or only positive if the orbit is closed.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculateTimeFromMagnitude(
	magnitude: number
): number -- Need to implement looking in the past for hyperbolic orbits!
	if self.OrbitingBody then
		local trueAnomalyAngle = self:CalculateTrueAnomalyFromMagnitude(magnitude)
		assert(typeof(trueAnomalyAngle) == "number", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)
		assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan`)

		local resultTime: number
		if self:IsClosed() then
			resultTime =
				self:CalculateTimeFromTrueAnomaly(trueAnomalyAngle, self:OrbitalPeriod() - self:TimeToPeriapsis()) -- CalculateTimeFromTrueAnomaly is broken??
		else
			resultTime = self:CalculateTimeFromTrueAnomaly(
				trueAnomalyAngle,
				if self:TimeToPeriapsis() == self:TimeToPeriapsis() then self:TimeToPeriapsis() else 0
			)
		end
		assert(typeof(resultTime) == "number", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)
		assert(resultTime == resultTime, `resultTime is nan`)

		-- print(self.Position)
		-- error("4redyhrftxdujhrfcvumjn rf 6xfvmujxrcf6fvjmcrd6tjvmct6d5tfjv ")
		return resultTime
	else
		return self:getSuper():CalculateTimeFromDistance(magnitude)
	end
end

--[=[
	Calculates a new MovingObject at a given altitude on this TrajectoryObject.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculatePointFromMagnitude(magnitude: number): Modules.MovingObject
	if self.OrbitingBody then
		local trueAnomalyAngle = self:CalculateTrueAnomalyFromMagnitude(magnitude)
		assert(typeof(trueAnomalyAngle) == "number", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)
		assert(trueAnomalyAngle == trueAnomalyAngle, `trueAnomalyAngle is nan`)
		local resultPoint = self:CalculatePointFromTrueAnomaly(trueAnomalyAngle)
		assert(resultPoint == resultPoint, `resultPoint is nan`)

		return resultPoint
	else
		return MovingObject.new(self.Position + self.Velocity.Unit * magnitude, self.Velocity)
	end
end

--[=[
	Returns a new TrajectoryObject incremented in time.
	Updates position, velocity, and the orbiting body.
	Optionally takes an acceleration value.
]=]
function TrajectoryObject:Step(delta: number, withAcceleration: Vector3?): Modules.TrajectoryObject
	local newVelocity: Vector3 = self.Velocity
	local newPosition: Vector3 = self.Position

	-- Update acceleration
	if withAcceleration then
		newVelocity += withAcceleration * delta
	end

	-- Update orbiting body
	local newOrbitingBody: Modules.GravityBody? = self.OrbitingBody

	if self.OrbitingBody and Magnitude(newPosition) > self.OrbitingBody.SOIRadius then
		newOrbitingBody = self.OrbitingBody.ParentGravityBody
	end

	-- Create new TrajectoryObject
	local newTrajectoryObject: Modules.TrajectoryObject =
		TrajectoryObject.new(newPosition, newVelocity, newOrbitingBody)

	local nextState: Modules.MovingObject = newTrajectoryObject:CalculatePointFromTime(delta)

	-- print(`step, before: {newTrajectoryObject:getSuper():getSuper().Position}`)
	-- print(`step, after: {nextState.Position}`)
	print(`distance: {Magnitude(newTrajectoryObject:getSuper():getSuper().Position - nextState.Position)}`)
	newTrajectoryObject:getSuper():setSuper(nextState)
	return newTrajectoryObject
end

--[=[
	Returns a new TrajectoryObject incremented in time.
	Updates position, velocity, and the orbiting body.
	Optionally takes an acceleration value.

	@param relativeTime The time passed since the location of this TrajectoryObject.
	@param withAcceleration Adds an acceleration to this TrajectoryObject, modifying the trajectory. Note: This is applied instantaneously, make sure to multiply with delta
]=]
function TrajectoryObject:AtTime(relativeTime: number, withAcceleration: Vector3?): Modules.TrajectoryObject
	local newVelocity: Vector3 = self.Velocity
	local newPosition: Vector3 = self.Position

	if withAcceleration then
		newVelocity += withAcceleration
	end

	local newTrajectoryObject: Modules.TrajectoryObject =
		TrajectoryObject.new(newPosition, newVelocity, self.OrbitingBody)

	local nextState: Modules.MovingObject = newTrajectoryObject:CalculatePointFromTime(relativeTime)

	-- print(`step, before: {newTrajectoryObject:getSuper():getSuper().Position}`)
	-- print(`step, after: {nextState.Position}`)
	-- print(`distance: {Magnitude(newTrajectoryObject:getSuper():getSuper().Position - nextState.Position)}`)
	newTrajectoryObject:getSuper():setSuper(nextState)
	return newTrajectoryObject
end

--[=[
	Increments this TrajectoryObject in time, then returns itself.

	@param delta The change in time.
	@param recursions The number of times to step this TrajectoryObject.
	@param withAcceleration Adds an acceleration to this TrajectoryObject, modifying the trajectory.
]=]
function TrajectoryObject:Increment(
	delta: number,
	recursions: number?,
	withAcceleration: Vector3?
): Modules.TrajectoryObject
	local newTrajectoryObject: Modules.TrajectoryObject = self

	for _ = 0, (if recursions then recursions else 1) do
		newTrajectoryObject = self:Step(delta, withAcceleration)
	end

	self = newTrajectoryObject

	return self
end

--[=[
	Calculates a trajectory as a series of points.

	@param delta The change in time.
	@param recursions The number of points to calculate.
]=]
function TrajectoryObject:CalculateTrajectory(delta: number, recursions: number): { Modules.MovingObject }
	local points: { Modules.MovingObject } = {}

	for i = 0, recursions do
		table.insert(points, self:CalculatePointFromTime(delta * i))
		-- print(`time progress: {delta * i / self.OrbitalPeriod}`)
	end

	return points
end

--[=[
	Creates and displays a trajectory / orbit line.

	@param delta The change in time.
	@param recursions The number of points to calculate.
]=]
function TrajectoryObject:DisplayTrajectory(delta: number, recursions: number): Folder
	local trajectory: { Modules.MovingObject } = self:CalculateTrajectory(delta, recursions)

	--[[
		TODO: Implement Multithreading for creation of Attachments and Beams
		TODO: create a gui thingy like KSP
	]]

	-- make all of the attachments
	local attachments: { Attachment } = {}

	for i in ipairs(trajectory) do
		local newPoint: Modules.MovingObject = trajectory[i]
		local newAttachment: Attachment = Instance.new("Attachment")

		newAttachment.Name = `{i}`
		newAttachment.Position = self.CalculateWorkspacePosition(newPoint.Position)

		attachments[i] = newAttachment
	end

	-- make all of the beams
	local beams: { Beam } = {}

	for i = 1, #attachments do
		local Attachment0: Attachment = attachments[i - 1]
		local Attachment1: Attachment = attachments[i]
		local newBeam: Beam = Instance.new("Beam")

		newBeam.Attachment0 = Attachment0
		newBeam.Attachment1 = Attachment1
		newBeam.Width0, newBeam.Width1 = 0.3, 0.3
		newBeam.FaceCamera = true
		newBeam.Color = ColorSequence.new(Color3.fromRGB(97, 97, 97))
		newBeam.Transparency = NumberSequence.new(0.8)
		newBeam.Name = `{i}`

		table.insert(beams, newBeam)
	end

	-- add everything to workspace in a nice file hierarchy
	local newTrajectoryFolder: Folder = Instance.new("Folder")
	newTrajectoryFolder.Name = "TrajectoryLine"

	local attachmentFolder: Part = Instance.new("Part")
	attachmentFolder.Anchored = true
	attachmentFolder.Transparency = 1
	attachmentFolder.Size *= 0
	attachmentFolder.Name = "Attachments"
	for _, attachment in attachments do
		attachment.Parent = attachmentFolder
	end
	attachmentFolder.Position = self.CalculateWorkspacePosition(Vector3.zero, self.OrbitingBody)
	attachmentFolder.Parent = newTrajectoryFolder

	local beamFolder: Folder = Instance.new("Folder")
	beamFolder.Name = "Beams"
	for _, beam in beams do
		beam.Parent = beamFolder
	end
	beamFolder.Parent = newTrajectoryFolder

	newTrajectoryFolder.Parent = workspace.Orbits

	return newTrajectoryFolder
end

return TrajectoryObject

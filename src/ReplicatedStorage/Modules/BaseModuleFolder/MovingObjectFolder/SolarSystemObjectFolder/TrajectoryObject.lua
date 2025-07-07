--[[
	Performace enhancements:

	Make all attributes accessor methods, and store result to an internal variable when they are called
	Have subparameters to calculate repeated calcs only once, then substitute redundant calcs w/ the variable
	Find out exactly what operations/methods are computationally expensive
]]

function Magnitude(v: Vector3): number
	return math.sqrt(v.X ^ 2 + v.Y ^ 2 + v.Z ^ 2)
end

local Modules = require(game.ReplicatedStorage.Modules.Modules)
local Constants = require(game.ReplicatedStorage.Modules.Constants)
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
		__type = "OrbitObject",
	}

	setmetatable(newTrajectoryObject, metatable)

	if newTrajectoryObject.OrbitingBody then
		local mu: number = newTrajectoryObject.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
		local r: Vector3 = newTrajectoryObject.Position -- Position vector
		local rM: number = r.Magnitude -- Position magnitude
		local v: Vector3 = newTrajectoryObject.Velocity -- Velocity vector
		local vM: number = v.Magnitude -- Velocity magnitude

		local visVivaSubParameter: number = 2 * mu * (rM ^ -1) - vM ^ 2

		newTrajectoryObject.OrbitalPeriod = 2 * math.pi * mu * visVivaSubParameter

		newTrajectoryObject.SemiMajorAxis = mu / visVivaSubParameter

		newTrajectoryObject.SemiMinorAxis = r:Cross(v).Magnitude / math.sqrt(math.abs(visVivaSubParameter))

		newTrajectoryObject.Eccentricity = Magnitude(mu * r + (rM * r:Cross(v):Cross(v))) / (mu * rM)

		newTrajectoryObject.TimeToPeriapsis = 0

		newTrajectoryObject.Periapsis = newTrajectoryObject:CalculatePointFromTime(0)

		newTrajectoryObject.Apoapsis = if newTrajectoryObject.Eccentricity <= 1
			then newTrajectoryObject:CalculatePointFromTime(newTrajectoryObject.OrbitalPeriod / 2)
			else nil

		newTrajectoryObject.TimeToPeriapsis =
			newTrajectoryObject:CalculateTimeFromPoint(newTrajectoryObject.Periapsis.Position)

		newTrajectoryObject.IsBound = newTrajectoryObject.Eccentricity <= 1

		newTrajectoryObject.IsClosed = newTrajectoryObject.Eccentricity < 1

		newTrajectoryObject.SpecificOrbitalEnergy = (vM ^ 2 / 2) - (mu / rM)
	end

	newTrajectoryObject.IsBound = false
	newTrajectoryObject.IsClosed = false

	return newTrajectoryObject
end

-- --[=[
-- 	Returns the apoapsis, or nil if there is no GravityBody being orbited.
-- 	https://en.wikipedia.org/wiki/Orbital_elements
-- ]=]

-- --[=[
-- 	Returns the periapsis, or nil if there is no GravityBody being orbited.
-- 	https://en.wikipedia.org/wiki/Orbital_elements
-- ]=]

-- --[=[
-- 	Returns the semi major axis, or nil if there is no GravityBody being orbited.
-- 	https://en.wikipedia.org/wiki/Vis-viva_equation
-- ]=]

-- --[=[
-- 	Returns the semi minor axis, or nil if there is no GravityBody being orbited.
-- 	https://en.wikipedia.org/wiki/Orbital_elements
-- ]=]

-- --[=[
-- 	Returns the eccentricity, or nil if there is no GravityBody being orbited.
-- 	https://en.wikipedia.org/wiki/Eccentricity_vector
-- ]=]

--[=[
	Helper method for CalculateTrueAnomalyFromTime().
	Apparently a calculation for eccentric anomaly using Kepler's Equation solved via the Newton-Raphson Method.
	Returns nil if there is no GravityBody being orbited.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:RecursiveTrueAnomalyHelper(recursions: number, periapsisRelativeTime: number): number?
	if self.OrbitingBody then
		local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
		local r: Vector3 = self.Position -- Position vector
		local rM: number = r.Magnitude -- Position magnitude
		local v: Vector3 = self.Velocity -- Velocity vector
		local vM: number = v.Magnitude -- Velocity magnitude
		local t: number = periapsisRelativeTime

		if recursions == 0 then -- base case
			if 2 * mu <= rM * vM ^ 2 then
				-- print(1)
				return math.pi
					* (math.sign(t) / math.pi)
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
				return math.pi * (2 * math.round((t / 2 * math.pi * mu) * Magnitude(mu * r + rM * r:Cross(v):Cross(v))))
			elseif
				math.abs((((t / mu) * (2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) % (2 * math.pi)) - math.pi)
				<= (1 + Magnitude(mu * r + rM * r:Cross(v):Cross(v)) / (mu * rM))
			then
				-- print(3)
				return math.pi
					* (2 * math.floor((t / 2 * math.pi * mu) * Magnitude(mu * r + rM * r:Cross(v):Cross(v))) + 1)
			else
				-- print(4)
				return math.pi
					* (math.floor((t / 2 * math.pi * mu) * Magnitude(mu * r + rM * r:Cross(v):Cross(v))) + 0.5)
			end
		else -- non-base case
			local prevRecursion = self:RecursiveTrueAnomalyHelper(recursions - 1, periapsisRelativeTime)
			assert(typeof(prevRecursion) == "number", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)

			if 2 * mu <= rM * vM ^ 2 then
				return prevRecursion
					+ (
							rM * ((2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) * t
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
	else
		return nil
	end
end

--[=[
	Calculates the angle of true anomaly at a given point in time on this TrajectoryObject.
	Returns nil if there is no GravityBody being orbited.
	https://en.wikipedia.org/wiki/True_anomaly
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculateTrueAnomalyFromTime(relativeTime: number): number?
	if self.OrbitingBody then
		local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
		local r: Vector3 = self.Position -- Position vector
		local rM: number = r.Magnitude -- Position magnitude
		local v: Vector3 = self.Velocity -- Velocity vector
		local vM: number = v.Magnitude -- Velocity magnitude
		local timeToPeriapsis = self.TimeToPeriapsis
		assert(typeof(timeToPeriapsis) == "number", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)

		local periapsisRelativeTime: number = timeToPeriapsis + relativeTime

		local TrueAnomalyHelperResult = self:RecursiveTrueAnomalyHelper(8, periapsisRelativeTime)
		assert(
			typeof(TrueAnomalyHelperResult) == "number",
			`self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`
		)

		if (rM * vM ^ 2) < (2 * mu) then --self.IsClosed then -- orbit is not hyperbolic, eccentricity < 1
			return 2 * math.pi * math.ceil(((2 * mu * (rM ^ -1) - vM ^ 2) ^ 1.5) * periapsisRelativeTime - 0.5)
				+ 2
					* math.atan(
						(mu * rM + Magnitude(mu * r + rM * r:Cross(v):Cross(v)))
							/ (rM * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)) * Magnitude(r:Cross(v)))
							* math.tan(0.5 * TrueAnomalyHelperResult)
					)
		else -- orbit is hyperbolic, eccentricity >= 1
			return 2
				* math.atan(
					(mu * rM + Magnitude(mu * r + rM * r:Cross(v):Cross(v)))
						/ (rM * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)) * Magnitude(r:Cross(v)))
						* math.tanh(0.5 * TrueAnomalyHelperResult)
				)
		end -- ...should i be concerned about performance issues
	else
		return nil
	end
end

--[=[
	Calculates a new TrajectoryObject at a given point on this TrajectoryObject, using the angle of true anomaly.
	Returns nil if there is no GravityBody being orbited.
	https://en.wikipedia.org/wiki/True_anomaly
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculatePointFromTrueAnomaly(trueAnomaly: number): Modules.MovingObject?
	if self.OrbitingBody then
		local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
		local r: Vector3 = self.Position -- Position vector
		local rM: number = r.Magnitude -- Position magnitude
		local v: Vector3 = self.Velocity -- Velocity vector
		local vM: number = v.Magnitude -- Velocity magnitude

		if self.Eccentricity == 0 then -- orbit is a circle
			return MovingObject.new(
				((math.sin(trueAnomaly) * r:Cross(v):Cross(r)) + (math.cos(trueAnomaly) * Magnitude(r:Cross(v)) * r))
					/ Magnitude(r:Cross(v)),
				((math.cos(trueAnomaly) * r:Cross(v):Cross(r)) - (math.sin(trueAnomaly) * Magnitude(r:Cross(v)) * r))
					/ (rM * Magnitude(r:Cross(v)))
					* vM
			)
		else -- orbit is any other conic section
			print(
				MovingObject.new( ------AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
					( ------------------------------------Not enough presicion, strongly consider implementing iterative mathematics precise to the nth decimal----------------------------------------
						(
							(math.sin(trueAnomaly) * (mu * r:Cross(v):Cross(r) - rM * Magnitude(r:Cross(v)) ^ 2 * v))
							+ (math.cos(trueAnomaly) * Magnitude(r:Cross(v)) * (mu * r + rM * r:Cross(v):Cross(v)))
						)
						/ (
							-Magnitude(mu * r + rM * r:Cross(v):Cross(v))
							* (math.cos(trueAnomaly) * Magnitude(mu * r + rM * r:Cross(v):Cross(v)) + mu * rM)
						)
					) * (Magnitude(r:Cross(v)) * rM),
					(
						(
							-(math.cos(trueAnomaly) * (mu * r:Cross(v):Cross(r) - rM * Magnitude(r:Cross(v)) ^ 2 * v))
							+ (math.sin(trueAnomaly) * Magnitude(r:Cross(v)) * (mu * r + rM * r:Cross(v):Cross(v)))
						) / ((Magnitude(r:Cross(v)) ^ 2) * Magnitude(mu * r + rM * r:Cross(v):Cross(v)))
					)
						- ((mu * r:Cross(v):Cross(r)) / ((Magnitude(r:Cross(v)) ^ 2) * rM))
						+ v
				)
			)
			print(
				(
					(
						-(math.cos(trueAnomaly) * (mu * r:Cross(v):Cross(r) - rM * Magnitude(r:Cross(v)) ^ 2 * v))
						+ (math.sin(trueAnomaly) * Magnitude(r:Cross(v)) * (mu * r + rM * r:Cross(v):Cross(v)))
					) / ((Magnitude(r:Cross(v)) ^ 2) * Magnitude(mu * r + rM * r:Cross(v):Cross(v)))
				)
					- ((mu * r:Cross(v):Cross(r)) / ((Magnitude(r:Cross(v)) ^ 2) * rM))
					+ v
			)
			print(
				( -- numerator
					-(math.cos(trueAnomaly) * (mu * r:Cross(v):Cross(r) - rM * Magnitude(r:Cross(v)) ^ 2 * v))
					+ (math.sin(trueAnomaly) * Magnitude(r:Cross(v)) * (mu * r + rM * r:Cross(v):Cross(v)))
				)
			)
			print(((Magnitude(r:Cross(v)) ^ 2) * Magnitude(mu * r + rM * r:Cross(v):Cross(v)))) -- denominator
			print(-((mu * r:Cross(v):Cross(r)) / ((Magnitude(r:Cross(v)) ^ 2) * rM)) + v) -- added/subtracted
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
					) / ((Magnitude(r:Cross(v)) ^ 2) * Magnitude(mu * r + rM * r:Cross(v):Cross(v)))
				)
					- ((mu * r:Cross(v):Cross(r)) / ((Magnitude(r:Cross(v)) ^ 2) * rM))
					+ v
				-- (
				-- 	(
				-- 		(math.sin(trueAnomaly) * (mu * r:Cross(v):Cross(r) - rM * Magnitude(r:Cross(v)) ^ 2 * v))
				-- 		+ (math.cos(trueAnomaly) * Magnitude(r:Cross(v)) * (mu * r + rM * r:Cross(v):Cross(v)))
				-- 	)
				-- 	/ (
				-- 		-Magnitude(mu * r + rM * r:Cross(v):Cross(v))
				-- 		* (math.cos(trueAnomaly) * Magnitude(mu * r + rM * r:Cross(v):Cross(v)) + mu * rM)
				-- 	)
				-- ) * (Magnitude(r:Cross(v)) * rM),
				-- (
				-- 	(
				-- 		-(math.cos(trueAnomaly) * (mu * r:Cross(v):Cross(r) - rM * Magnitude(r:Cross(v)) ^ 2 * v))
				-- 		+ (math.sin(trueAnomaly) * Magnitude(r:Cross(v)) * (mu * r + rM * r:Cross(v):Cross(v)))
				-- 	) / ((Magnitude(r:Cross(v)) ^ 2) * Magnitude(mu * r + rM * r:Cross(v):Cross(v)))
				-- )
				-- 	- ((mu * r:Cross(v):Cross(r)) / ((Magnitude(r:Cross(v)) ^ 2) * rM))
				-- 	+ v
			)
		end -- ...should i be concerned about performance issues
	else
		return nil
	end
end

--[=[
	Calculates a new MovingObject at a given point in time on this TrajectoryObject.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculatePointFromTime(relativeTime: number): Modules.MovingObject
	if self.OrbitingBody then
		local trueAnomalyAngle = self:CalculateTrueAnomalyFromTime(relativeTime)
		assert(typeof(trueAnomalyAngle) == "number", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)

		local resultPoint = self:CalculatePointFromTrueAnomaly(trueAnomalyAngle)
		-- assert(resultPoint:getType() == "MovingObject", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)

		print(resultPoint)
		assert(1 == 0, "no nans allowed")
		return resultPoint
	else
		return MovingObject.new(self.Position + self.Velocity * relativeTime, self.Velocity)
	end
end

--[=[
	Calculates the true anomaly at a given point on this TrajectoryObject.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculateTrueAnomalyFromPoint(position: Vector3): number?
	if self.OrbitingBody then
		local tempAnomaly = self:CalculateTrueAnomalyFromTime(0)
		assert(typeof(tempAnomaly) == "number", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)
		local trueAnomaly: number = tempAnomaly -- + math.sign(direction) * math.pi / 2
		local anomalySearchIteration: number = 1
		local anomalySearchPoint = self:CalculatePointFromTrueAnomaly(trueAnomaly)
		-- assert(
		-- 	anomalySearchPoint:getType() == "MovingObject",
		-- 	`self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`
		-- )
		anomalySearchPoint = anomalySearchPoint.Position.Magnitude

		repeat -- Iterative search for true anomaly, checking distance by converting anomaly to point
			local anomalyNegative: number = trueAnomaly - math.pi / 2 ^ anomalySearchIteration
			local anomalyPositive: number = trueAnomaly + math.pi / 2 ^ anomalySearchIteration

			local searchPointNegative = self:CalculatePointFromTrueAnomaly(anomalyNegative)
			local searchPointPositive = self:CalculatePointFromTrueAnomaly(anomalyPositive)
			-- ...should i be concerned about performance issues
			-- assert(
			-- 	typeof(searchPointNegative) == "MovingObject" and typeof(searchPointPositive) == "MovingObject",
			-- 	`self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`
			-- )

			local differenceNegative: number = (position - searchPointNegative.Position).Magnitude
			local differencePositive: number = (position - searchPointPositive.Position).Magnitude

			if math.min(differenceNegative, differencePositive) == differenceNegative then
				trueAnomaly = anomalyNegative
				anomalySearchPoint = searchPointNegative
			else
				trueAnomaly = anomalyPositive
				anomalySearchPoint = searchPointPositive
			end

			anomalySearchIteration += 1
			assert(
				(position - anomalySearchPoint.Position).Magnitude == (position - anomalySearchPoint.Position).Magnitude,
				`distance is nan. Position: {position}, Search point: {anomalySearchPoint.Position}`
			)
			assert(
				anomalySearchIteration <= 1000,
				`Anomaly iterative search taking too long, concluded at {(position - anomalySearchPoint.Position).Magnitude} distance from target`
			)
		until (position - anomalySearchPoint.Position).Magnitude == 0

		return trueAnomaly
	else
		return nil
	end
end

--[=[
	Calculates the length of time until a given true anomaly on this TrajectoryObject is reached.
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculateTimeFromTrueAnomaly(trueAnomaly: number): number?
	if self.OrbitingBody then
		local mu: number = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
		local r: Vector3 = self.Position -- Position vector
		local rM: number = r.Magnitude -- Position magnitude
		local v: Vector3 = self.Velocity -- Velocity vector
		local vM: number = v.Magnitude -- Velocity magnitude

		if self.IsClosed then
			return (-r:Cross(v).Magnitude * (mu * r + rM * r:Cross(v):Cross(v)).Magnitude * math.sin(trueAnomaly))
					/ ((2 * mu * (rM ^ -1) - vM ^ 2) * (mu * r + rM * r:Cross(v):Cross(v)).Magnitude)
				+ (mu * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)) ^ -3)
					* (2 * math.pi * math.ceil(trueAnomaly / (2 * math.pi) - 0.5) - 2 * math.atan(
						((mu * r + rM * r:Cross(v):Cross(v)).Magnitude - mu * rM)
							/ (r:Cross(v).Magnitude * rM * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)))
							* math.tan(trueAnomaly / 2)
					))
		else
			return (-r:Cross(v).Magnitude * (mu * r + rM * r:Cross(v):Cross(v)).Magnitude * math.sin(trueAnomaly))
					/ ((2 * mu * (rM ^ -1) - vM ^ 2) * (mu * r + rM * r:Cross(v):Cross(v)).Magnitude)
				+ (mu * math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2)) ^ -3)
					* (-math.log(
						((mu * r + rM * r:Cross(v):Cross(v)).Magnitude * math.cos(trueAnomaly) + mu * rM)
							/ (
								(mu * r + rM * r:Cross(v):Cross(v)).Magnitude
								+ mu * rM * math.cos(trueAnomaly)
								- math.sin(trueAnomaly)
									* rM
									* r:Cross(v).Magnitude
									* math.sqrt(math.abs(2 * mu * (rM ^ -1) - vM ^ 2))
							)
					))
		end
	else
		return nil
	end
end

--[=[
	Calculates the first time the craft reaches a specific altitude on this TrajectoryObject.
	Times are relative to this TrajectoryObject.
	Direction can be either negative or positive (for searching in the past or future).
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculateTimeFromPoint(position: Vector3): number?
	if self.OrbitingBody then
		local trueAnomalyAngle = self:CalculateTrueAnomalyFromPoint(position)
		assert(typeof(trueAnomalyAngle) == "number", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)
		local resultTime = self:CalculateTimeFromTrueAnomaly(trueAnomalyAngle)
		assert(typeof(resultTime) == "number", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)

		return resultTime
	else
		return MovingObject.new(self.Position, self.Velocity):CalculateTimeFromPoint(position)
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

	if withAcceleration then
		newVelocity += withAcceleration * delta
	end

	local newTrajectoryObject: Modules.TrajectoryObject =
		TrajectoryObject.new(newPosition, newVelocity, self.OrbitingBody)

	local nextState: Modules.MovingObject = newTrajectoryObject:CalculatePointFromTime(delta)

	print(`step, before`)
	print(newTrajectoryObject:getSuper():getSuper())
	print(`step, after`)
	print(nextState)
	newTrajectoryObject:getSuper():setSuper(nextState)
	return newTrajectoryObject
end
-- 	local acceleration: Vector3 = if withAcceleration then withAcceleration * delta else Vector3.zero

-- 	-- -- Calculate acceleration change due to gravity
-- 	if self.OrbitingBody then
-- 		local orbitingBody: Modules.GravityBody = self.OrbitingBody
-- 		local direction: Vector3 = (-self.Position).Unit
-- 		local distance: number = (-self.Position).Magnitude

-- 		acceleration += direction * ((orbitingBody.Mass / (distance ^ 2)) * Constants.GRAVITATIONAL_CONSTANT)
-- 	end

-- 	-- Calculate position within the conic section

-- 	-- Update position + velocity

-- 	local newVelocity: Vector3 = self.Velocity + (acceleration * delta)
-- 	local newPosition: Vector3 = self.Position + (newVelocity * delta)

-- 	-- Update orbiting body

-- 	local newOrbitingBody: Modules.GravityBody? = self.OrbitingBody

-- 	if self.OrbitingBody and newPosition.Magnitude > self.OrbitingBody.SOIRadius then
-- 		newOrbitingBody = self.OrbitingBody.ParentGravityBody
-- 	end

-- 	return TrajectoryObject.new(newPosition, newVelocity, newOrbitingBody)
-- end

--[=[
	Increments this OrbitObject in time, then returns itself.
]=]
function TrajectoryObject:Increment(
	delta: number,
	recursions: number,
	withAcceleration: Vector3?
): Modules.TrajectoryObject
	local newTrajectoryObject: Modules.TrajectoryObject = self

	for _ = 0, recursions do
		newTrajectoryObject = self:Step(delta, withAcceleration)
	end

	self = newTrajectoryObject

	return self
end

--[=[
	Calculates a trajectory as a series of points.
]=]
function TrajectoryObject:CalculateTrajectory(delta: number, recursions: number): { Modules.MovingObject }
	local points: { Modules.MovingObject } = {}

	for i = 0, recursions do
		table.insert(points, self:CalculatePointFromTime(delta * i))
	end

	return points
end

--[=[
	Creates and displays a trajectory / orbit line.
]=]
function TrajectoryObject:DisplayTrajectory(delta: number, recursions: number): Folder
	local trajectory: { Modules.MovingObject } = self:CalculateTrajectory(delta, recursions)

	local attachments: { Attachment } = {}

	--[[
		TODO: MAKE IT MULTITHREADED
	]]

	-- make all of the attachments
	for i in ipairs(trajectory) do
		local newPoint: Modules.MovingObject = trajectory[i]
		local newAttachment: Attachment = Instance.new("Attachment")

		newAttachment.Position = self.CalculateWorkspacePosition(newPoint.Position)
			+ if self.OrbitingBody then self.OrbitingBody.RootPart.Position else Vector3.zero

		newAttachment.Name = `{i}`

		table.insert(attachments, newAttachment)
	end

	local beams: { Beam } = {}

	-- make all of the beams
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
	attachmentFolder.Parent = newTrajectoryFolder

	local beamFolder: Folder = Instance.new("Folder")
	beamFolder.Name = "Beams"
	for _, beam in beams do
		beam.Parent = beamFolder
	end
	beamFolder.Parent = newTrajectoryFolder

	newTrajectoryFolder.Parent = workspace.Orbits

	return newTrajectoryFolder -- create a gui thingy
end

return TrajectoryObject

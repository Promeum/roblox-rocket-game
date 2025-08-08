--!strict

--[[
	Performace enhancements:

	Have subparameters to calculate repeated calcs only once, then substitute redundant calcs w/ the variable
	Find out exactly what operations/methods are computationally expensive

	TODO:
	CalculateTimeFromPoint - Need to implement looking in the past for hyperbolic orbits! (time = negative)
	Is the vector multiplication correct? Convert everything to dot products?
]]

-- function Magnitude(v: Vector3): number
-- 	return math.sqrt(v.X ^ 2 + v.Y ^ 2 + v.Z ^ 2)
-- end

-- function Dot(v1: Vector3, v2: Vector3): number
-- 	return (v1.X * v2.X) + (v1.Y * v2.Y) + (v1.Z * v2.Z)
-- end

local Modules = require(game.ReplicatedStorage.Modules.Modules)
local Constants = require(game.ReplicatedStorage.Modules.Constants)
local BigNum = require(game.ReplicatedStorage.Modules.Libraries.BigNum)
local BigMath = require(game.ReplicatedStorage.Modules.BigMath)
local Vector3B = require(game.ReplicatedStorage.Modules.BaseModuleFolder.Vector3B)
local MovingObject = require(script.Parent.Parent.Parent.MovingObject)
local SolarSystemObject = require(script.Parent.Parent.SolarSystemObject)

-- Constants
local TWO_FRACTION = Constants.TWO_FRACTION

local TrajectoryObject = {}

--[=[
	Creates a new TrajectoryObject instance.
]=]
function TrajectoryObject.new(
	position: Modules.Vector3B,
	velocity: Modules.Vector3B,
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
		local mu: Modules.Fraction = newTrajectoryObject.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
		local r: Modules.Vector3B = newTrajectoryObject.Position -- Position vector
		local rM: Modules.Fraction = r:Magnitude() -- Position magnitude
		local v: Modules.Vector3B = newTrajectoryObject.Velocity -- Velocity vector
		local vM: Modules.Fraction = v:Magnitude() -- Velocity magnitude

		local visVivaSubParameter: Modules.Fraction = ((Constants.TWO_FRACTION * mu) / rM - BigMath.pow(vM, TWO_FRACTION)):Reduce()
		print(visVivaSubParameter)

		metatable._rxvxr = r:Cross(v):Cross(r)
		metatable._rxvxv = r:Cross(v):Cross(v)
		metatable._mu_r_rM_rxvxv = mu * r + rM * metatable._rxvxv
		metatable._mu_r_rM_rxvxv_magnitude = metatable._mu_r_rM_rxvxv:Magnitude()
		metatable._2mu_rM_vM_2 = ((2 * mu) / rM - BigMath.pow(vM, 2))
		metatable._sqrt_abs_2mu_rM_vM_2 = BigMath.sqrt(BigMath.abs(metatable._2mu_rM_vM_2))

		metatable._RecursiveTrueAnomalyHelper = {
			baseCase = nil,
			nonBaseCaseFunction = nil
		}

		metatable._OrbitalPeriod = Constants.TWO_FRACTION * Constants.PI * mu * BigMath.pow(visVivaSubParameter, -1.5)

		metatable._SemiMajorAxis = mu / visVivaSubParameter

		metatable._SemiMinorAxis = r:Cross(v):Magnitude() / BigMath.sqrt(BigMath.abs(visVivaSubParameter))

		metatable._Eccentricity = ((mu * r + (rM * metatable._rxvxv)):Magnitude() / (mu * rM)):Reduce()

		metatable._IsBound = newTrajectoryObject:Eccentricity() <= Constants.ONE_FRACTION

		metatable._IsClosed = newTrajectoryObject:Eccentricity() < Constants.ONE_FRACTION

		metatable._TimeToPeriapsis = BigNum.newFraction(0, 1)

		metatable._Periapsis = newTrajectoryObject:CalculatePointFromTrueAnomaly(0)
		assert(metatable._Periapsis, `periapsis is nil ({metatable._Periapsis})`)

		metatable._Apoapsis = if newTrajectoryObject:IsBound()
			then newTrajectoryObject:CalculatePointFromTrueAnomaly(Constants.PI)
			else nil

		print("start test area")

		print(newTrajectoryObject:RecursiveTrueAnomalyHelper(8, BigMath.toFraction("798154.9360516296")))

		print("end test area")

		if newTrajectoryObject:OrbitalPeriod() ~= BigNum.newFraction(0, 0) then
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

		newTrajectoryObject._SpecificOrbitalEnergy = (BigMath.pow(vM, 2) / 2) - (mu / rM)
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
	local timesToSOI: { Modules.Fraction } = {}
	local gravityBodiesIntercepted: { Modules.GravityBody? } = {}
	local gravityBodies: { Modules.GravityBody? } = {}

	if self.OrbitingBody then
		local orbitingBody: Modules.GravityBody = self.OrbitingBody
		-- gravityBodies = orbitingBody.ChildGravityBodies -- uncomment when ready

		local escapingSOI: boolean = not self:IsClosed()
			or (self:Apoapsis() and self:Apoapsis().Position:Magnitude() > BigMath.toFraction(orbitingBody.SOIRadius))

		if escapingSOI then
			table.insert(timesToSOI, self:CalculateTimeFromMagnitude(orbitingBody.SOIRadius))
			table.insert(gravityBodiesIntercepted, orbitingBody.ParentGravityBody)
		end
		-- error("rthj")
		if #gravityBodies > 0 then
			error("Finding a trajectory into an SOI not implemented yet")
			-- bisection search to find if this trajectory goes in any SOI
			for i, gravityBodyToTest in ipairs(gravityBodies) do
				print(`{i}:`)
				print(gravityBodyToTest)

				-- generate points
				local maxTimeToSearch: Modules.BigNum = BigNum.new(1e30)

				if escapingSOI then
					maxTimeToSearch = timesToSOI[1]
				end

				-- choose a pair of 2 points to search between

				-- bisection search

				-- final result?
				local timeToSOI: Modules.Fraction = BigMath.toFraction(-1)

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
				local timeToSOI: Modules.Fraction = BigMath.toFraction(-1)

				-- table.insert(timesToSOI, timeToSOI)
				-- table.insert(gravityBodiesIntercepted, gravityBodyToTest)
			end
		end
	end

	-- look through results
	if #timesToSOI > 0 then
		local timeToNearestSOI: Modules.Fraction = BigMath.min(table.unpack(timesToSOI))
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
function TrajectoryObject:OrbitalPeriod(): Modules.Fraction
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
function TrajectoryObject:TimeToPeriapsis(): Modules.Fraction
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
function TrajectoryObject:TimeSincePeriapsis(): Modules.Fraction
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
function TrajectoryObject:SemiMajorAxis(): Modules.Fraction
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
function TrajectoryObject:SemiMinorAxis(): Modules.Fraction
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
function TrajectoryObject:Eccentricity(): Modules.Fraction
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
function TrajectoryObject:RecursiveTrueAnomalyHelper(recursions: Modules.BigNum | number, periapsisRelativeTime: Modules.BigNum | Modules.Fraction | number): Modules.Fraction
	assert(
		self.OrbitingBody,
		`TrajectoryObject:RecursiveTrueAnomalyHelper() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	assert(not BigMath.isNaN(periapsisRelativeTime), `periapsisrelativetime is nan ({periapsisRelativeTime})`)
	local mu: Modules.Fraction = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3B = self.Position -- Position vector
	local rM: Modules.Fraction = r:Magnitude() -- Position magnitude
	local v: Modules.Vector3B = self.Velocity -- Velocity vector
	local vM: Modules.Fraction = v:Magnitude() -- Velocity magnitude
	local t: Modules.Fraction = BigMath.toFraction(periapsisRelativeTime)

	--
	--
	--
	-- TODO: FIX THIS
	--
	--
	--

	if recursions == 0 then -- base case
		if 2 * mu <= rM * BigMath.pow(vM, 2) then
			print(1)
			return BigMath.sign(t)
				* BigMath.sqrt(
					BigMath.pow(
						BigMath.log(
							(
								(2 * rM * BigMath.pow(BigMath.abs(getmetatable(self)._2mu_rM_vM_2), 1.5) * BigMath.abs(t))
								/ getmetatable(self)._mu_r_rM_rxvxv_magnitude
							) + 1
						) + 1,
						2
					) - 1
				)
		elseif
			(Constants.PI - 1 + getmetatable(self)._mu_r_rM_rxvxv_magnitude / (mu * rM))
			<= BigMath.abs(BigMath.fmod((t / mu) * BigMath.pow(getmetatable(self)._2mu_rM_vM_2, 1.5), 2 * Constants.PI) - Constants.PI)
		then
			print(2)
			return Constants.PI * (2 * BigMath.round((t / (2 * Constants.PI * mu)) * BigMath.pow(BigMath.abs(getmetatable(self)._2mu_rM_vM_2), 1.5)))
		elseif
			BigMath.abs(BigMath.fmod((t / mu) * BigMath.pow(getmetatable(self)._2mu_rM_vM_2, 1.5), 2 * Constants.PI) - Constants.PI)
			<= (1 + getmetatable(self)._mu_r_rM_rxvxv_magnitude / (mu * rM))
		then
			print(3)
			return Constants.PI
				* (2 * BigMath.floor((t / (2 * Constants.PI * mu)) * BigMath.pow(BigMath.abs(getmetatable(self)._2mu_rM_vM_2), 1.5)) + 1)
		else
			print(4)
			return Constants.PI * (BigMath.floor((t / (Constants.PI * mu)) * BigMath.pow(BigMath.abs(getmetatable(self)._2mu_rM_vM_2), 1.5)) + 0.5)
		end
	else -- non-base case
		local prevRecursion = self:RecursiveTrueAnomalyHelper(recursions - 1, periapsisRelativeTime)
		assert(not BigMath.isNaN(prevRecursion), `prevRecursion is nan ({prevRecursion})`)

		print(`recursion {recursions - 1}`)
		print(prevRecursion)

		if 2 * mu <= rM * BigMath.pow(vM, 2) then
			return prevRecursion
				+ (
						rM * BigMath.pow(BigMath.abs(getmetatable(self)._2mu_rM_vM_2), 1.5) * t
						+ mu * rM * prevRecursion
						- BigMath.sinh(prevRecursion) * getmetatable(self)._mu_r_rM_rxvxv_magnitude
					)
					/ (BigMath.cosh(prevRecursion) * getmetatable(self)._mu_r_rM_rxvxv_magnitude - mu * rM)
		else
			return prevRecursion
				+ (
						rM * BigMath.pow(getmetatable(self)._2mu_rM_vM_2, 1.5) * t
						- mu * rM * prevRecursion
						+ BigMath.sin(prevRecursion) * getmetatable(self)._mu_r_rM_rxvxv_magnitude
					)
					/ (-BigMath.cos(prevRecursion) * getmetatable(self)._mu_r_rM_rxvxv_magnitude + mu * rM)
		end
	end -- ...should i be concerned about performance issues
end

--[=[
	Calculates the angle of true anomaly at a given point in time on this TrajectoryObject.
	Returns nil if there is no GravityBody being orbited.
	https://en.wikipedia.org/wiki/True_anomaly
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculateTrueAnomalyFromTime(relativeTime: Modules.BigNum | Modules.Fraction | number): Modules.Fraction
	assert(
		self.OrbitingBody,
		`TrajectoryObject:CalculateTrueAnomalyFromTime() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	local mu: Modules.Fraction = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3B = self.Position -- Position vector
	local rM: Modules.Fraction = r:Magnitude() -- Position magnitude
	local v: Modules.Vector3B = self.Velocity -- Velocity vector
	local vM: Modules.Fraction = v:Magnitude() -- Velocity magnitude
	local timeFromPeriapsis: Modules.Fraction
	if self:OrbitalPeriod() == self:OrbitalPeriod() then
		timeFromPeriapsis = self:OrbitalPeriod() - self:TimeToPeriapsis()
	else
		timeFromPeriapsis = -self:TimeToPeriapsis()
	end

	local periapsisRelativeTime: Modules.Fraction = -timeFromPeriapsis + relativeTime

	local TrueAnomalyHelperResult = self:RecursiveTrueAnomalyHelper(8, periapsisRelativeTime)
	assert(
		not BigMath.isNaN(TrueAnomalyHelperResult),
		`TrueAnomalyHelperResult is nan ({TrueAnomalyHelperResult})`
	)

	if (rM * BigMath.pow(vM, 2)) < (2 * mu) then --self:IsClosed() then -- orbit is not hyperbolic, eccentricity < 1
		return BigMath.fmod(
			(
				2
					* Constants.PI
					* BigMath.ceil(
						BigMath.pow(BigMath.abs(getmetatable(self)._2mu_rM_vM_2), 1.5) * (periapsisRelativeTime / (2 * mu * Constants.PI)) - 0.5
					)
				+ 2
					* BigMath.atan(
						(mu * rM + getmetatable(self)._mu_r_rM_rxvxv_magnitude)
							/ (rM * getmetatable(self)._sqrt_abs_2mu_rM_vM_2 * r:Cross(v):Magnitude())
							* BigMath.tan(0.5 * TrueAnomalyHelperResult)
					)
			),
			2 * Constants.PI
		)
	else -- orbit is hyperbolic, eccentricity >= 1
		return 2
			* BigMath.atan(
				(mu * rM + getmetatable(self)._mu_r_rM_rxvxv_magnitude)
					/ (rM * getmetatable(self)._sqrt_abs_2mu_rM_vM_2 * r:Cross(v):Magnitude())
					* BigMath.tanh(0.5 * TrueAnomalyHelperResult)
			)
	end -- ...should i be concerned about performance issues
end

--[=[
	Calculates a new TrajectoryObject at a given point on this TrajectoryObject, using the angle of true anomaly.
	Returns nil if there is no GravityBody being orbited.
	https://en.wikipedia.org/wiki/True_anomaly
	https://www.desmos.com/3d/rfndgd4ppj
]=]
function TrajectoryObject:CalculatePointFromTrueAnomaly(trueAnomaly: Modules.BigNum | Modules.Fraction | number): Modules.MovingObject
	assert(
		self.OrbitingBody,
		`TrajectoryObject:CalculatePointFromTrueAnomaly() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	local mu: Modules.Fraction = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3B = self.Position -- Position vector
	local rM: Modules.Fraction = r:Magnitude() -- Position magnitude
	local v: Modules.Vector3B = self.Velocity -- Velocity vector
	local vM: Modules.Fraction = v:Magnitude() -- Velocity magnitude

	if self:Eccentricity() == 0 then -- orbit is a circle
		return MovingObject.new(
			((BigMath.sin(trueAnomaly) * getmetatable(self)._rxvxr) + (BigMath.cos(trueAnomaly) * r:Cross(v):Magnitude() * r))
				/ r:Cross(v):Magnitude(),
			((BigMath.cos(trueAnomaly) * getmetatable(self)._rxvxr) - (BigMath.sin(trueAnomaly) * r:Cross(v):Magnitude() * r))
				/ (rM * r:Cross(v):Magnitude())
				* vM
		)
	elseif
		self:IsClosed()
		or ( -- check range of true anomaly of hyperbolic orbit
			not self:IsClosed()
			and -BigMath.acos(-(mu * rM) / getmetatable(self)._mu_r_rM_rxvxv_magnitude) < BigMath.fmod(BigMath.abs(trueAnomaly), (2 * Constants.PI)) * BigMath.sign(
				trueAnomaly
			)
			and BigMath.fmod(BigMath.abs(trueAnomaly), 2 * Constants.PI) * BigMath.sign(trueAnomaly)
				< BigMath.acos(-(mu * rM) / getmetatable(self)._mu_r_rM_rxvxv_magnitude)
		)
	then -- orbit is any other conic section
		-- note: for velocity, the mu that multiplies with the entire fraction was moved to denominator to counter floating point errors (the big fraction should not end up as (0,0,0))
		-- another note: really think about implementing arbitrary-precision arithmetic
		return MovingObject.new(
			(r:Cross(v):Magnitude() * rM)
				/ (-getmetatable(self)._mu_r_rM_rxvxv_magnitude * (BigMath.cos(trueAnomaly) * getmetatable(self)._mu_r_rM_rxvxv_magnitude + mu * rM))
				* (
					(BigMath.sin(trueAnomaly) * (mu * getmetatable(self)._rxvxr - rM * BigMath.pow(r:Cross(v):Magnitude(), 2) * v))
					+ (BigMath.cos(trueAnomaly) * r:Cross(v):Magnitude() * getmetatable(self)._mu_r_rM_rxvxv)
				),
			(
				(
					-(BigMath.cos(trueAnomaly) * (mu * getmetatable(self)._rxvxr - rM * BigMath.pow(r:Cross(v):Magnitude(), 2) * v))
					+ (BigMath.sin(trueAnomaly) * r:Cross(v):Magnitude() * (getmetatable(self)._mu_r_rM_rxvxv))
				) / (BigMath.pow(r:Cross(v):Magnitude(), 2) * getmetatable(self)._mu_r_rM_rxvxv_magnitude / mu)
			)
				- ((mu * getmetatable(self)._rxvxr) / (BigMath.pow(r:Cross(v):Magnitude(), 2) * rM))
				+ v
		) -- ...should i be concerned about performance issues
	else -- true anomaly is out of range of hyperbolic orbit
		return error(
			`CalculatePointFromTrueAnomaly Invalid angle\n(min: {-BigMath.acos(
				-(mu * rM) / getmetatable(self)._mu_r_rM_rxvxv_magnitude
			)})\n(max: {BigMath.acos(-(mu * rM) / getmetatable(self)._mu_r_rM_rxvxv_magnitude)})`
		)
	end
end

--[=[
	Calculates a new MovingObject at a given point in time on this TrajectoryObject.
	https://www.desmos.com/3d/rfndgd4ppj

	@param relativeTime The time passed since the location of this TrajectoryObject.
]=]
function TrajectoryObject:CalculatePointFromTime(relativeTime: Modules.BigNum | Modules.Fraction | number): Modules.MovingObject
	if self.OrbitingBody then
		local trueAnomalyAngle = self:CalculateTrueAnomalyFromTime(relativeTime)
		assert(
			not BigMath.isNaN(trueAnomalyAngle),
			`trueAnomalyAngle is nan ({trueAnomalyAngle})`
		)
		local resultPoint = self:CalculatePointFromTrueAnomaly(trueAnomalyAngle)
		assert(not BigMath.isNaN(resultPoint), `resultPoint is nan ({resultPoint})`)

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
function TrajectoryObject:CalculateTrueAnomalyFromPoint(position: Modules.Vector3B): Modules.Fraction
	assert(
		self.OrbitingBody,
		`TrajectoryObject:CalculateTrueAnomalyFromPoint() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	local mu: Modules.Fraction = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3B = self.Position -- Position vector
	local rM: Modules.Fraction = r:Magnitude() -- Position magnitude
	-- local v: Modules.Vector3B = self.Velocity -- Velocity vector

	local greaterAnomaly: Modules.Fraction
	local lesserAnomaly: Modules.Fraction
	local greaterPoint: Modules.Vector3B
	local lesserPoint: Modules.Vector3B

	if self:IsClosed() then -- find the quadrant of the point and get the two points at the axes lines bordering that quadrant (search range: 0 -> 2 * pi)
		local up: Modules.Vector3B = self:CalculatePointFromTrueAnomaly(math.pi).Position
		local down: Modules.Vector3B = self:CalculatePointFromTrueAnomaly(0).Position
		local left: Modules.Vector3B = self:CalculatePointFromTrueAnomaly(3 * math.pi / 2).Position
		local right: Modules.Vector3B = self:CalculatePointFromTrueAnomaly(math.pi / 2).Position

		if (up - position):Magnitude() < (down - position):Magnitude() then
			if (left - position):Magnitude() < (right - position):Magnitude() then
				greaterAnomaly = BigMath.toFraction(3 * math.pi / 2)
				lesserAnomaly = Constants.PI
				greaterPoint = left
				lesserPoint = up
			else
				greaterAnomaly = Constants.PI
				lesserAnomaly = BigMath.toFraction(math.pi / 2)
				greaterPoint = up
				lesserPoint = right
			end
		else
			lesserAnomaly = Constants.ZERO_FRACTION
			lesserPoint = down
			if (left - position):Magnitude() < (right - position):Magnitude() then
				greaterAnomaly = BigMath.toFraction(3 * math.pi / 2)
				greaterPoint = left
			else
				greaterAnomaly = BigMath.toFraction(math.pi / 2)
				greaterPoint = right
			end
		end
	else -- get the two points defining the range of true anomaly of hyperbolic orbit (search range: -(x < pi) -> (x < pi))
		greaterAnomaly = BigMath.acos(-(mu * rM) / getmetatable(self)._mu_r_rM_rxvxv_magnitude) -- - 2.24e-16
		greaterPoint = self:CalculatePointFromTrueAnomaly(greaterAnomaly).Position
		lesserAnomaly = -BigMath.acos(-(mu * rM) / getmetatable(self)._mu_r_rM_rxvxv_magnitude) -- + 2.24e-16
		lesserPoint = self:CalculatePointFromTrueAnomaly(lesserAnomaly).Position
	end

	-- Bisection search for true anomaly, check distance by converting anomaly to point and compare with position
	local middleAnomaly: Modules.Fraction = ((greaterAnomaly + lesserAnomaly) / 2):Reduce()
	local middleAnomalyPoint: Modules.Vector3B = self:CalculatePointFromTrueAnomaly(middleAnomaly).Position
	local anomalySearchIteration: number = 1

	repeat
		task.wait(0)
		-- Vector math for comparing the target point and middleAnomalyPoint
		local transformedGreaterPoint: Modules.Vector3B = greaterPoint - lesserPoint -- transformedLesserPoint is (0, 0, 0)
		local transformedTargetPoint: Modules.Vector3B = position - lesserPoint
		local transformedmiddleAnomalyPoint: Modules.Vector3B = middleAnomalyPoint - lesserPoint
		local referenceAxis: Modules.Vector3B = transformedGreaterPoint / transformedGreaterPoint:Magnitude() -- get the unit axis vector

		-- Project the two points onto the reference axis with dot product
		local projectedTargetPoint: Modules.Vector3B = referenceAxis * transformedTargetPoint:Dot(referenceAxis)
		local projectedmiddleAnomalyPoint: Modules.Vector3B = referenceAxis * transformedmiddleAnomalyPoint:Dot(referenceAxis)

		-- Generate a 'number line' position along the reference axis for the two points
		local targetPointPosition: Modules.Fraction = projectedTargetPoint:Dot(referenceAxis)
		local middleAnomalyPosition: Modules.Fraction = projectedmiddleAnomalyPoint:Dot(referenceAxis)

		if targetPointPosition > middleAnomalyPosition then -- move lesser angle up
			lesserAnomaly = middleAnomaly
			lesserPoint = self:CalculatePointFromTrueAnomaly(lesserAnomaly).Position
		else --elseif targetPointPosition < middleAnomalyPosition then -- move greater angle down
			greaterAnomaly = (greaterAnomaly - (middleAnomaly - lesserAnomaly)):Reduce()
			greaterPoint = self:CalculatePointFromTrueAnomaly(greaterAnomaly).Position
		end
		-- else -- shortcut in case angle of target point is directly in the middle of lesser and greater angles -- doesnt work due to inaccurate floating point
		-- 	return middleAnomaly
		-- end

		middleAnomaly = ((greaterAnomaly + lesserAnomaly) / 2):Reduce()
		middleAnomalyPoint = self:CalculatePointFromTrueAnomaly(middleAnomaly).Position
		-- print(`iteration {anomalySearchIteration}`)
		-- print(greaterAnomaly)
		-- print(middleAnomaly)
		-- print(lesserAnomaly)
		-- assert(middleAnomaly ~= nil, `middleAnomalyPoint has errored ({middleAnomalyPoint})`)
		-- ...should i be concerned about performance issues

		if anomalySearchIteration > 30 then
			print(greaterAnomaly)
			print(lesserAnomaly)
			print(middleAnomaly)
			print(position)
			print(greaterPoint)
			print(lesserPoint)
			assert(
				anomalySearchIteration <= 30,
				`Anomaly iterative search taking too long, concluded at {BigMath.min(
					(greaterPoint - position):Magnitude(),
					(lesserPoint - position):Magnitude()
				)} distance from target`
			)
		end

		anomalySearchIteration += 1
	until (greaterAnomaly - lesserAnomaly) < BigMath.toFraction(2 ^ -50) or (middleAnomalyPoint - position):Magnitude() == Constants.ZERO_FRACTION
	print(`trueAnomaly calc finished at {anomalySearchIteration} iterations`)
	print(middleAnomaly)
	return middleAnomaly
end

--[=[
	Calculates the length of time from the periapsis to the given true anomaly.
	https://www.desmos.com/3d/rfndgd4ppj

	@param trueAnomaly The angle of true anomaly. Can be any value.
]=]
function TrajectoryObject:CalculateTimeFromPeriapsis(trueAnomaly: Modules.BigNum | Modules.Fraction | number): Modules.Fraction
	assert(
		self.OrbitingBody,
		`TrajectoryObject:CalculateTimeFromTrueAnomaly() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	local mu: Modules.Fraction = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3B = self.Position -- Position vector
	local rM: Modules.Fraction = r:Magnitude() -- Position magnitude
	local v: Modules.Vector3B = self.Velocity -- Velocity vector
	local vM: Modules.Fraction = v:Magnitude() -- Velocity magnitude

	assert(
		self:IsClosed() == ((BigMath.pow(vM, 2) * rM) < (2 * mu)),
		`{self:IsClosed()} not equal to {(BigMath.pow(vM, 2) * rM) < (2 * mu)} (Eccectricity: {self:Eccentricity()})`
	)

	if self:IsClosed() then -- Orbit is circular / elliptic
		return (-r:Cross(v):Magnitude() * getmetatable(self)._mu_r_rM_rxvxv_magnitude * BigMath.sin(trueAnomaly))
				/ ((getmetatable(self)._2mu_rM_vM_2) * (getmetatable(self)._mu_r_rM_rxvxv_magnitude * BigMath.cos(trueAnomaly) + mu * rM))
			+ (mu * BigMath.pow(getmetatable(self)._sqrt_abs_2mu_rM_vM_2, -3))
				* (2 * Constants.PI * BigMath.ceil(trueAnomaly / (2 * Constants.PI) - 0.5) - 2 * BigMath.atan(
					(getmetatable(self)._mu_r_rM_rxvxv_magnitude - mu * rM)
						/ (r:Cross(v):Magnitude() * rM * getmetatable(self)._sqrt_abs_2mu_rM_vM_2)
						* BigMath.tan(trueAnomaly / 2)
				))
	else -- Orbit is parabolic / hyperbolic
		return (-r:Cross(v):Magnitude() * getmetatable(self)._mu_r_rM_rxvxv_magnitude * BigMath.sin(trueAnomaly))
				/ ((getmetatable(self)._2mu_rM_vM_2) * (getmetatable(self)._mu_r_rM_rxvxv_magnitude * BigMath.cos(trueAnomaly) + mu * rM))
			+ (mu * BigMath.pow(getmetatable(self)._sqrt_abs_2mu_rM_vM_2, -3))
				* (-BigMath.log(
					(getmetatable(self)._mu_r_rM_rxvxv_magnitude * BigMath.cos(trueAnomaly) + mu * rM)
						/ (
							getmetatable(self)._mu_r_rM_rxvxv_magnitude
							+ mu * rM * BigMath.cos(trueAnomaly)
							- BigMath.sin(trueAnomaly)
								* rM
								* r:Cross(v):Magnitude()
								* getmetatable(self)._sqrt_abs_2mu_rM_vM_2
						)
				))
	end
end

--[=[
	Calculates the length of time seperating two given true anomalies on this TrajectoryObject.
	https://www.desmos.com/3d/rfndgd4ppj

	@param trueAnomaly The end angle of true anomaly. Can be any value.
	@param referenceTrueAnomaly The start angle of true anomaly. If not provided, defaults to the current true anomaly (between 0 and 2 * pi).
	@return Returns a value, in seconds, representing the length of time to go from trueAnomaly to referenceTrueAnomaly. Can be negative if the current orbit is a hyperbola.
]=]
function TrajectoryObject:CalculateTimeFromTrueAnomaly(trueAnomaly: Modules.BigNum | Modules.Fraction | number, referenceTrueAnomaly: Modules.BigNum | Modules.Fraction | number?): Modules.Fraction
	assert(
		self.OrbitingBody,
		`TrajectoryObject:CalculateTimeFromTrueAnomaly() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	local adjustedReferenceTrueAnomaly: Modules.Fraction = if referenceTrueAnomaly then BigMath.toFraction(referenceTrueAnomaly) else self:CalculateTrueAnomalyFromPoint(self.Position)

	return self:CalculateTimeFromPeriapsis(trueAnomaly) - self:CalculateTimeFromPeriapsis(adjustedReferenceTrueAnomaly)
end

--[=[
	Calculates the time until the craft reaches a specific point on this TrajectoryObject.
	Time may be negative if the current orbit is hyperbolic.
	https://www.desmos.com/3d/rfndgd4ppj

	@param position The position to be reached (may have already been reached if the current orbit is hyperbolic).
	@param referenceTrueAnomaly The refernce angle of true anomaly. If not provided, defaults to the current true anomaly (between 0 and 2 * pi).
]=]
function TrajectoryObject:CalculateTimeFromPoint(
	position: Modules.Vector3B,
	referenceTrueAnomaly: Modules.BigNum | Modules.Fraction | number?
): Modules.Fraction -- Need to implement looking in the past for hyperbolic orbits!
	if self.OrbitingBody then
		local trueAnomalyAngle = self:CalculateTrueAnomalyFromPoint(position)
		assert(
			trueAnomalyAngle ~= BigNum.newFraction(0, 0),
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
	@return Returns the true anomaly angle in radians within 0 and pi, or nil if there is no GravityBody being orbited.
]=]
function TrajectoryObject:CalculateTrueAnomalyFromMagnitude(magnitude: Modules.BigNum | Modules.Fraction | number): Modules.Fraction
	assert(
		self.OrbitingBody,
		`TrajectoryObject:CalculateTrueAnomalyFromMagnitude() cannot be called on a TrajectoryObject with no OrbitingBody ({self.OrbitingBody})`
	)
	local mu: Modules.Fraction = self.OrbitingBody:StandardGravitationalParameter() -- Standard gravitational parameter
	local r: Modules.Vector3B = self.Position -- Position vector
	local rM: Modules.Fraction = r:Magnitude() -- Position magnitude
	-- local v: Modules.Vector3B = self.Velocity -- Velocity vector

	local greaterAnomaly: Modules.Fraction
	local lesserAnomaly: Modules.Fraction
	local greaterMagnitude: Modules.Fraction
	local lesserMagnitude: Modules.Fraction

	lesserAnomaly = Constants.ZERO_FRACTION
	lesserMagnitude = self:CalculatePointFromTrueAnomaly(lesserAnomaly).Position:Magnitude()

	if self:IsClosed() then -- search range: 0 -> pi
		greaterAnomaly = Constants.PI
		greaterMagnitude = self:CalculatePointFromTrueAnomaly(greaterAnomaly).Position:Magnitude()
	else -- search range: 0 -> (x < pi) (the range of true anomaly of hyperbolic orbit)
		greaterAnomaly = BigMath.acos(-(mu * rM) / getmetatable(self)._mu_r_rM_rxvxv_magnitude) -- - 2.24e-16 -- subtract small number so greaterPoint will work, hopefully
		greaterMagnitude = self:CalculatePointFromTrueAnomaly(greaterAnomaly).Position:Magnitude()
	end

	-- Bisection search for true anomaly, check distance by converting anomaly to point and compare with magnitude
	local trueAnomaly: Modules.Fraction = (greaterAnomaly + lesserAnomaly) / 2
	local trueAnomalyMagnitude: Modules.Fraction = self:CalculatePointFromTrueAnomaly(trueAnomaly).Position:Magnitude()
	local lastTrueAnomalyMagnitude: Modules.Fraction
	local anomalySearchIteration: number = 0
	assert(trueAnomalyMagnitude ~= BigNum.newFraction(1, 0), `infinite value detected`)
	repeat
		if trueAnomalyMagnitude < magnitude then
			lesserAnomaly = trueAnomaly
			lesserMagnitude = self:CalculatePointFromTrueAnomaly(lesserAnomaly).Position:Magnitude()
		else
			greaterAnomaly -= trueAnomaly - lesserAnomaly
			greaterMagnitude = self:CalculatePointFromTrueAnomaly(greaterAnomaly).Position:Magnitude()
		end

		lastTrueAnomalyMagnitude = trueAnomalyMagnitude

		trueAnomaly = (greaterAnomaly + lesserAnomaly) / 2
		trueAnomalyMagnitude = self:CalculatePointFromTrueAnomaly(trueAnomaly).Position:Magnitude()
		-- assert(trueAnomalyMagnitude ~= nil, `trueAnomalyPosition has errored ({trueAnomalyMagnitude})`)
		-- ...should i be concerned about performance issues

		assert(
			anomalySearchIteration <= 50,
			`Anomaly iterative search taking too long, concluded at {BigMath.min(
				greaterMagnitude - magnitude,
				lesserMagnitude - magnitude
			)} distance from target`
		)
		-- assert(
		-- 	math.abs(trueAnomalyMagnitude) ~= math.huge and trueAnomalyMagnitude == trueAnomalyMagnitude,
		-- 	`trueAnomalyMagnitude is invalid ({trueAnomalyMagnitude})`
		-- )

		anomalySearchIteration += 1
	until (greaterAnomaly - lesserAnomaly) < BigMath.toFraction(10 ^ -11) or lastTrueAnomalyMagnitude == trueAnomalyMagnitude
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
	magnitude: Modules.BigNum | Modules.Fraction | number
): Modules.Fraction -- Need to implement looking in the past for hyperbolic orbits!
	if self.OrbitingBody then
		local trueAnomalyAngle = self:CalculateTrueAnomalyFromMagnitude(magnitude)
		-- assert(typeof(trueAnomalyAngle) == "number", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)
		assert(not BigMath.isNaN(trueAnomalyAngle), `trueAnomalyAngle is nan`)

		local resultTime: Modules.Fraction
		if self:IsClosed() then
			resultTime =
				self:CalculateTimeFromTrueAnomaly(trueAnomalyAngle, self:OrbitalPeriod() - self:TimeToPeriapsis()) -- CalculateTimeFromTrueAnomaly is broken??
		else
			resultTime = self:CalculateTimeFromTrueAnomaly(
				trueAnomalyAngle,
				if self:TimeToPeriapsis() == self:TimeToPeriapsis() then self:TimeToPeriapsis() else 0
			)
		end
		-- assert(typeof(resultTime) == "number", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)
		assert(not BigMath.isNaN(resultTime), `resultTime is nan`)

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
function TrajectoryObject:CalculatePointFromMagnitude(magnitude: Modules.BigNum | Modules.Fraction | number): Modules.MovingObject
	if self.OrbitingBody then
		local trueAnomalyAngle = self:CalculateTrueAnomalyFromMagnitude(magnitude)
		-- assert(typeof(trueAnomalyAngle) == "number", `self.OrbitingBody unexpectedly altered ({self.OrbitingBody})`)
		assert(not BigMath.isNaN(trueAnomalyAngle), `trueAnomalyAngle is nan`)
		local resultPoint = self:CalculatePointFromTrueAnomaly(trueAnomalyAngle)
		assert(not BigMath.isNaN(resultPoint), `resultPoint is nan`)

		return resultPoint
	else
		return MovingObject.new(self.Position + self.Velocity:Unit() * magnitude, self.Velocity)
	end
end

--[=[
	Returns a new TrajectoryObject incremented in time.
	Updates position, velocity, and the orbiting body.
	Optionally takes an acceleration value.
]=]
function TrajectoryObject:Step(delta: Modules.BigNum | Modules.Fraction | number, withAcceleration: Modules.Vector3B?): Modules.TrajectoryObject
	local newVelocity: Modules.Vector3B = self.Velocity
	local newPosition: Modules.Vector3B = self.Position

	-- Update acceleration
	if withAcceleration then
		newVelocity += withAcceleration * delta
	end

	-- Update orbiting body
	local newOrbitingBody: Modules.GravityBody? = self.OrbitingBody

	if self.OrbitingBody and newPosition:Magnitude() > self.OrbitingBody.SOIRadius then
		newOrbitingBody = self.OrbitingBody.ParentGravityBody
	end

	-- Create new TrajectoryObject
	local newTrajectoryObject: Modules.TrajectoryObject =
		TrajectoryObject.new(newPosition, newVelocity, newOrbitingBody)

	local nextState: Modules.MovingObject = newTrajectoryObject:CalculatePointFromTime(delta)

	-- print(`step, before: {newTrajectoryObject:getSuper():getSuper().Position}`)
	-- print(`step, after: {nextState.Position}`)
	print(`distance: {(newTrajectoryObject:getSuper():getSuper().Position - nextState.Position):Magnitude()}`)
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
function TrajectoryObject:AtTime(relativeTime: Modules.BigNum | Modules.Fraction | number, withAcceleration: Modules.Vector3B?): Modules.TrajectoryObject
	local newVelocity: Modules.Vector3B = self.Velocity
	local newPosition: Modules.Vector3B = self.Position

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
	delta: Modules.BigNum | Modules.Fraction | number,
	recursions: Modules.BigNum | number?,
	withAcceleration: Modules.Vector3B?
): Modules.TrajectoryObject
	local newTrajectoryObject: Modules.TrajectoryObject = self

	for _ = 0, (if recursions then BigMath.toDecimal(recursions) else 1) do
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
function TrajectoryObject:CalculateTrajectory(delta: Modules.BigNum | Modules.Fraction | number, recursions: Modules.BigNum | number): { Modules.MovingObject }
	local points: { Modules.MovingObject } = {}

	for i = 0, BigMath.toDecimal(recursions) do
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
function TrajectoryObject:DisplayTrajectory(delta: Modules.BigNum | Modules.Fraction | number, recursions: Modules.BigNum | number): Folder
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
	attachmentFolder.Position = self.CalculateWorkspacePosition(Vector3B.zero, self.OrbitingBody)
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

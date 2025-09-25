--[[
	The original MOID.jl package is licensed under the MIT "Expat" License, copyright (c) 2018 Mike Kretlow.

    Copyright (c) 2018 Mike Kretlow
	Copyright (c) 2025 Promeum

    Permission is hereby granted, free of charge, to any person obtaining a copy of this
	software and associated documentation files (the "Software"), to deal in the Software
	without restriction, including without limitation the rights to use, copy, modify, merge,
	publish, distribute, sublicense, and/or sell copies of the Software, and to permit 
	persons to whom the Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or
	substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
	BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
]]

--[[
	Wisniowski & Rickman MOID algorithm implemented in Luau
	Converted from Julia implementation (via ChatGPT)
	Original Julia implementation by Mike Kretlow

	https://github.com/mkretlow/MOID.jl
]]

local function water_procedure(nmax, argpeB, sintmpo, costmpo, sint, cost, tmptrueB, tmplongit, tmpmoid)
	-- This only seeds candidate minima if too few were found.
	if nmax < 2 then
		-- nmax is not returned/updated by design (same as Julia),
		-- but we still prefill 4 candidate seeds for arrays.
		for iii = 1, 4 do
			tmptrueB[iii] = (0.25 + 0.5 * iii) * math.pi  -- evenly distributed points
			local sintmp = math.sin(tmptrueB[iii] + argpeB)
			local costmp = math.cos(tmptrueB[iii] + argpeB)
			tmplongit[iii] = math.atan2(
				sintmpo * costmp + sintmp * cost,
				costmpo * costmp - sintmp * sint
			)
			tmpmoid[iii] = 1e6
		end
	end
end

-- Calculate the MOID between two elliptical orbits around a single body. Argument values are: 
-- semi-major axis (au), eccentricity, argument of perhielion (ω), longitude of ascending node (Ω),
-- inclination (i) (all angles in rad). Result is MOID in au.
local function wisric_moid(
	saxisA, eccenA, argpeA, omegaA, incliA,
	saxisB, eccenB, argpeB, omegaB, incliB
)
	-- Tables
	local rAt, rBt, Axt, Ayt, Bxt, Byt, Bzt = {}, {}, {}, {}, {}, {}, {}
	local tmpmoid, tmptrueB, tmplongit = {}, {}, {}

	-- Parameters of the program
	local cstep = 0.12       -- scanning step [rad]
	local stepini = 0.07     -- initial step for first tuning [rad]
	local steptresh = 1e-5   -- final step of first tuning [rad]
	local stepmin = 1e-14    -- threshold step of second tuning [rad]
	local twopi = 2 * math.pi

	-- START OF PREPARING THE ORBITS

	-- Transition matrix C11...C33
	local c11 = math.cos(omegaA) * math.cos(argpeA) - math.sin(omegaA) * math.cos(incliA) * math.sin(argpeA)
	local c12 = math.sin(omegaA) * math.cos(argpeA) + math.cos(omegaA) * math.cos(incliA) * math.sin(argpeA)
	local c13 = math.sin(incliA) * math.sin(argpeA)
	local c21 = -math.cos(omegaA) * math.sin(argpeA) - math.sin(omegaA) * math.cos(incliA) * math.cos(argpeA)
	local c22 = -math.sin(omegaA) * math.sin(argpeA) + math.cos(omegaA) * math.cos(incliA) * math.cos(argpeA)
	local c23 = math.sin(incliA) * math.cos(argpeA)
	local c31 = math.sin(incliA) * math.sin(omegaA)
	local c32 = -math.sin(incliA) * math.cos(omegaA)
	local c33 = math.cos(incliA)

	-- Calculating new values of Euler angles using transition matrix
	local sintmpi = math.sin(incliB)
	local costmpi = math.cos(incliB)
	local costmpo = math.cos(omegaB)
	local sintmpo = math.sin(omegaB)
	local costmpa = math.cos(argpeB)
	local sintmpa = math.sin(argpeB)

	local x1 = costmpo * costmpa - sintmpo * costmpi * sintmpa
	local x2 = sintmpo * costmpa + costmpo * costmpi * sintmpa
	local x3 = sintmpi * sintmpa
	local y1 = -costmpo * sintmpa - sintmpo * costmpi * costmpa
	local y2 = -sintmpo * sintmpa + costmpo * costmpi * costmpa
	local y3 = sintmpi * costmpa
	local z1 = sintmpi * sintmpo
	local z2 = -sintmpi * costmpo
	local z3 = costmpi

	local z1n = c11 * z1 + c12 * z2 + c13 * z3
	local z2n = c21 * z1 + c22 * z2 + c23 * z3
	local z3n = c31 * z1 + c32 * z2 + c33 * z3
	local y3n = c31 * y1 + c32 * y2 + c33 * y3
	local x3n = c31 * x1 + c32 * x2 + c33 * x3

	incliB = math.atan2(math.sqrt(z1n * z1n + z2n * z2n), z3n)
	omegaB = -math.atan2(z1n, -z2n)
	argpeB = -math.atan2(x3n, y3n)

	-- Helpful precalculated values
	costmpo = math.cos(omegaB)
	sintmpo = math.sin(omegaB)
	sintmpi = math.sin(incliB)      -- = z1n/sintmpo
	costmpi = z3n                   -- = cos(incliB)
	local sint = sintmpo * costmpi
	local cost = costmpo * costmpi
	local radA = saxisA * (1.0 - eccenA * eccenA)
	local radB = saxisB * (1.0 - eccenB * eccenB)

	-- END OF PREPARING THE ORBITS

	-- START OF SCANNING

	-- Initial parameters
	local trueB = -2.0 * cstep
	local trueB_m, trueB_o = 0.0, 0.0
	local longit_m, longit_o = 0.0, 0.0
	local dist, dist_oo, dist_o = 0.0, 0.0, 1e6
	local moid = 1e6
	for n = 1, 10 do
		tmpmoid[n] = 1e6
		tmptrueB[n] = 0.0
		tmplongit[n] = 0.0
	end

	-- a) First two positions of the plane to create first triplet
	for iii = 1, 2 do
		local rB = radB / (1.0 + eccenB * math.cos(trueB))
		local sintmp = math.sin(trueB + argpeB)
		local costmp = math.cos(trueB + argpeB)
		local Bz_sq = (sintmpi * sintmp)
		Bz_sq = Bz_sq * Bz_sq
		local longit = math.atan2(sintmpo * costmp + sintmp * cost, costmpo * costmp - sintmp * sint)
		local tmp2 = eccenA * math.cos(longit)
		local rA = radA / (1.0 + tmp2)
		local rA2 = radA / (1.0 - tmp2)
		local tmp1 = rB * math.sqrt(1.0 - Bz_sq)

		if math.abs(tmp1 - rA) > math.abs(tmp1 + rA2) then
			rA = rA2
			longit = longit - math.pi
			tmp1 = tmp1 + rA2
		else
			tmp1 = tmp1 - rA
		end

		dist = rB * rB * Bz_sq + tmp1 * tmp1
		if iii == 1 then
			dist_oo = dist
		else
			dist_o = dist
			trueB_o = trueB
			longit_o = longit
		end
		trueB = trueB + cstep
	end

	-- b) Scan full revolution of meridional plane
	local nmax = 0
	local dist_min = dist
	while trueB < (twopi + cstep) do
		local rB = radB / (1.0 + eccenB * math.cos(trueB))
		local sintmp = math.sin(trueB + argpeB)
		local costmp = math.cos(trueB + argpeB)
		local Bz_sq = (sintmpi * sintmp)
		Bz_sq = Bz_sq * Bz_sq
		local longit = math.atan2(sintmpo * costmp + sintmp * cost, costmpo * costmp - sintmp * sint)
		local tmp2 = eccenA * math.cos(longit)
		local rA = radA / (1.0 + tmp2)
		local rA2 = radA / (1.0 - tmp2)
		local tmp1 = rB * math.sqrt(1.0 - Bz_sq)

		if math.abs(tmp1 - rA) > math.abs(tmp1 + rA2) then
			rA = rA2
			longit = longit - math.pi
			tmp1 = tmp1 + rA2
		else
			tmp1 = tmp1 - rA
		end

		dist = rB * rB * Bz_sq + tmp1 * tmp1

		if (dist_o <= dist) and (dist_o <= dist_oo) then
			nmax += 1
			tmptrueB[nmax] = trueB_o
			tmplongit[nmax] = longit_o
			tmpmoid[nmax] = dist_o
		end

		if dist_min > dist then dist_min = dist end

		dist_oo = dist_o
		trueB_o = trueB
		longit_o = longit
		dist_o = dist
		trueB = trueB + cstep
	end

	-- END OF SCANNING

	-- "WATER" PROCEDURE (can be skipped to increase speed)
	water_procedure(nmax, argpeB, sintmpo, costmpo, sint, cost, tmptrueB, tmplongit, tmpmoid)

	-- START OF PARALLEL TUNING

	for jjj = 1, nmax + 1 do
		local step, threshold

		if jjj <= nmax then
			moid = tmpmoid[jjj]
			trueB_m = tmptrueB[jjj]
			longit_m = tmplongit[jjj]
			step = stepini
			threshold = steptresh
		else
			-- choose best candidate for final tuning
			if nmax == 2 then
				-- If two minima are very close go to "water procedure"
				if math.abs(tmpmoid[1] - tmpmoid[2]) < 1e-4 then
					nmax = 1
					water_procedure(nmax, argpeB, sintmpo, costmpo, sint, cost, tmptrueB, tmplongit, tmpmoid)
				else
					if tmpmoid[1] < moid then
						moid = tmpmoid[1]
						trueB_m = tmptrueB[1]
						longit_m = tmplongit[1]
					end
				end
			else
				for iii = 1, (nmax - 1) do
					if tmpmoid[iii] < moid then
						moid = tmpmoid[iii]
						trueB_m = tmptrueB[iii]
						longit_m = tmplongit[iii]
					end
				end
			end
			step = 2.0 * stepini  -- initial step for final tuning
			threshold = stepmin   -- terminal step for final tuning
		end

		-- Seed central points
		rBt[2] = radB / (1.0 + eccenB * math.cos(trueB_m))
		do
			local sintmp = math.sin(trueB_m + argpeB)
			local costmp = math.cos(trueB_m + argpeB)
			Bxt[2] = costmpo * costmp - sintmp * sint
			Byt[2] = sintmpo * costmp + sintmp * cost
			Bzt[2] = sintmpi * sintmp
		end

		rAt[2] = radA / (1.0 + eccenA * math.cos(longit_m))
		Axt[2] = math.cos(longit_m)
		Ayt[2] = math.sin(longit_m)

		local aleft, aright = true, true
		local bleft, bright = true, true

		while step >= threshold do
			local lpoints = 0
			local j1min, j1max = 1, 3
			local i1min, i1max = 1, 3
			local calc1, calc2, calc3, calc4 = false, false, false, false

			if bleft then
				rBt[1] = radB / (1.0 + eccenB * math.cos(trueB_m - step))
				local sintmp = math.sin(trueB_m - step + argpeB)
				local costmp = math.cos(trueB_m - step + argpeB)
				Bxt[1] = costmpo * costmp - sintmp * sint
				Byt[1] = sintmpo * costmp + sintmp * cost
				Bzt[1] = sintmpi * sintmp
				lpoints += 1
			end

			if bright then
				rBt[3] = radB / (1.0 + eccenB * math.cos(trueB_m + step))
				local sintmp = math.sin(trueB_m + step + argpeB)
				local costmp = math.cos(trueB_m + step + argpeB)
				Bxt[3] = costmpo * costmp - sintmp * sint
				Byt[3] = sintmpo * costmp + sintmp * cost
				Bzt[3] = sintmpi * sintmp
				lpoints += 1
			end

			if aleft then
				rAt[1] = radA / (1.0 + eccenA * math.cos(longit_m - step))
				Axt[1] = math.cos(longit_m - step)
				Ayt[1] = math.sin(longit_m - step)
				lpoints += 1
			end

			if aright then
				rAt[3] = radA / (1.0 + eccenA * math.cos(longit_m + step))
				Axt[3] = math.cos(longit_m + step)
				Ayt[3] = math.sin(longit_m + step)
				lpoints += 1
			end

			local j1_t, i1_t = 2, 2

			if lpoints == 1 then
				if aleft  then i1max = 1 end
				if aright then i1min = 3 end
				if bleft  then j1max = 1 end
				if bright then j1min = 3 end
			end

			if lpoints == 2 then
				if aleft and  bright then calc1 = true end
				if aleft and  bleft  then calc2 = true end
				if aright and bright then calc3 = true end
				if aright and bleft  then calc4 = true end
			end

			for j1 = j1min, j1max do
				for i1 = i1min, i1max do
					if lpoints == 2 then
						if i1 ~= 1 then
							if ((j1 ~= 3) and calc1) or ((j1 ~= 1) and calc2) then
								continue
							end
						end
						if i1 ~= 3 then
							if ((j1 ~= 3) and calc3) or ((j1 ~= 1) and calc4) then
								continue
							end
						end
					end
					if (i1 == 2) and (j1 == 2) then
						continue
					end

					local Dx = rBt[j1] * Bxt[j1] - rAt[i1] * Axt[i1]
					local Dy = rBt[j1] * Byt[j1] - rAt[i1] * Ayt[i1]
					local Dz = rBt[j1] * Bzt[j1]
					dist = (Dx * Dx + Dy * Dy + Dz * Dz)

					if dist < moid then
						moid = dist
						j1_t = j1
						i1_t = i1
					end
				end
			end

			if (j1_t ~= 2) or (i1_t ~= 2) then
				aleft, aright, bleft, bright = false, false, false, false

				if i1_t ~= 2 then
					if i1_t == 1 then
						aleft = true
						longit_m = longit_m - step
						rAt[3], Axt[3], Ayt[3] = rAt[2], Axt[2], Ayt[2]
						rAt[2], Axt[2], Ayt[2] = rAt[1], Axt[1], Ayt[1]
					else
						aright = true
						longit_m = longit_m + step
						rAt[1], Axt[1], Ayt[1] = rAt[2], Axt[2], Ayt[2]
						rAt[2], Axt[2], Ayt[2] = rAt[3], Axt[3], Ayt[3]
					end
				end

				if j1_t ~= 2 then
					if j1_t == 1 then
						bleft = true
						trueB_m = trueB_m - step
						rBt[3], Bxt[3], Byt[3], Bzt[3] = rBt[2], Bxt[2], Byt[2], Bzt[2]
						rBt[2], Bxt[2], Byt[2], Bzt[2] = rBt[1], Bxt[1], Byt[1], Bzt[1]
					else
						bright = true
						trueB_m = trueB_m + step
						rBt[1], Bxt[1], Byt[1], Bzt[1] = rBt[2], Bxt[2], Byt[2], Bzt[2]
						rBt[2], Bxt[2], Byt[2], Bzt[2] = rBt[3], Bxt[3], Byt[3], Bzt[3]
					end
				end
			else
				-- No improvement: shrink step
				aleft, aright, bleft, bright = true, true, true, true
				step = step * 0.15 -- 0.15 is optimal value
			end
		end -- while step >= threshold

		if jjj <= nmax then
			tmpmoid[jjj] = moid
			tmptrueB[jjj] = trueB_m
			tmplongit[jjj] = longit_m
		end
	end

	-- END OF PARALLEL TUNING
	return math.sqrt(moid) -- we dealt with squares
end

return wisric_moid

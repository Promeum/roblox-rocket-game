--!strict
local Type = require(script.Parent.Parent.Parent.Type)
local Constructor = require(script.Parent.Parent.Parent.Constructor)
local Relative = require(script.Parent)

-- Internal type
type State = Type.StateEXTENSIBLE<State,
		Type.RelativeEXTENSIBLE<State,
			Type.BaseModuleEXTENSIBLE<State
	>>>
	& Constructor.StateEXTENSIBLE<State>

local State: State = { __type = "State" :: "State" } :: any
local StateMT = {}

function StateMT.__add(self: State, other: State): State
	error("State __add() not implemented for type " .. self.__type)
end

function StateMT.__sub(self: State, other: State): State
	error("State __sub() not implemented for type " .. self.__type)
end

function StateMT.__eq(self: State, other: State?): boolean
	error("State __eq() not implemented for type " .. self.__type)
end

function StateMT.__lt(self: State, other: State): boolean
	error("State __lt() not implemented for type " .. self.__type)
end

function StateMT.__le(self: State, other: State): boolean
	error("State __le() not implemented for type " .. self.__type)
end

-- Constructors

--[=[
	Creates a new State instance.
]=]
function State.new(relativeTo: State?): State
	local self: State = table.clone(State) :: any

	local metatable = table.clone(StateMT)
	metatable.__index = Relative.new(relativeTo)

	setmetatable(self, metatable)

	return self
end

-- Methods

--[=[
	Returns a new State relative to nil, representing
	the State relative to the base world state.
	Implemented in superclasses.

	<code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	<code>result: result</code>

	@return The resultant State.
]=]
function State:getAbsolute(): State
	error("State getAbsolute() not implemented for type " .. self.__type)
end

--[=[
	Returns a new State relative to the current relativeTo's relativeTo.
	Implemented in superclasses.

	<code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	<code>result: a-b-c-result</code>

	@return The resultant State.
]=]
function State:consolidateOnce(): (State, State)
	error("State consolidateOnce() not implemented for type " .. self.__type)
end

--[=[
	Synchronizes this State with another such that they have the same RelativeTo.
	Implemented in superclasses.

	<code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	<code>other: &nbsp;a-b-e-other</code><br>
	<code>result: a-b-selfResult, a-b-otherResult</code>

	@param other The other State to synchronize with.
	@return The synchronized States as a tuple of self and other, in that order.
]=]
function State:synchronize(other: State): (State, State)
	error("State synchronize() not implemented for type " .. self.__type)
end

--[=[
	Matches the RelativeTo tree of other with this State.
	Implemented in superclasses.

	<code>self: &nbsp;&nbsp;a-b-c-d-self</code><br>
	<code>other: &nbsp;a-b-e-other</code><br>
	<code>result: a-b-c-d-otherResult</code>

	@param other The other State to match with.
	@return The synchronized other State. Note: Resultant relativeTime may be negative.
]=]
function State.matchRelative(self: State, other: State): State
	error("State matchRelative() not implemented for type " .. self.__type)
end

return (State :: any) :: Constructor.StateEXTENSIBLE<any>

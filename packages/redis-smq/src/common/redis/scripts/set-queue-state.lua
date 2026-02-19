--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Atomically updates a queue's operational state and records the state transition.
-- Stores lock information for validation by other operations.
--
-- KEYS[1]: keyQueueProperties - Queue properties hash
-- KEYS[2]: keyQueueStateHistory - List of state transitions
--
-- ARGV[1]: EQueuePropertyOperationalState - Field name for operational state
-- ARGV[2]: newState - New operational state value
-- ARGV[3]: transitionData - JSON string of state transition
-- ARGV[4]: expectedPreviousState - Expected previous state (for atomic consistency)
-- ARGV[5]: EQueueOperationalStateActive - ACTIVE state enum value
-- ARGV[6]: maxQueueStateHistorySize
-- ARGV[7]: EQueueOperationalStateLocked - LOCKED state enum value
-- ARGV[8]: lockId - Lock ID for LOCKED state transitions (empty string if not applicable)
-- ARGV[9]: EQueuePropertyLastStateChangeAt - Field name for last state change timestamp
-- ARGV[10]: lastStateChangeAt - Timestamp value for the state change
-- ARGV[11]: EQueuePropertyLockId - Field name for lock ID
--
-- Returns:
--   'OK' - Success
--   'QUEUE_NOT_FOUND' - Queue does not exist
--   'INVALID_STATE_TRANSITION' - Queue state changed since validation
--   'INVALID_LOCK' - Invalid lock ID provided for lock/unlock operation
--

-- Static Keys
local keyQueueProperties = KEYS[1]
local keyQueueStateHistory = KEYS[2]

-- Arguments
local EQueuePropertyOperationalState = ARGV[1]
local newState = ARGV[2]
local transitionData = ARGV[3]
local expectedPreviousState = ARGV[4]
local EQueueOperationalStateActive = ARGV[5]
local maxQueueStateHistorySize = tonumber(ARGV[6])
local EQueueOperationalStateLocked = ARGV[7]
local lockId = ARGV[8]
local EQueuePropertyLastStateChangeAt = ARGV[9]
local lastStateChangeAt = ARGV[10]
local EQueuePropertyLockId = ARGV[11]

-- Validate queue exists
if redis.call("EXISTS", keyQueueProperties) == 0 then
    return 'QUEUE_NOT_FOUND'
end

-- Get current state
local currentStateValue = redis.call("HGET", keyQueueProperties, EQueuePropertyOperationalState)
local currentState = currentStateValue or EQueueOperationalStateActive -- Default to ACTIVE if not set

-- Atomic consistency check: ensure queue hasn't changed since validation
if expectedPreviousState and expectedPreviousState ~= '' and currentState ~= expectedPreviousState then
    return 'INVALID_STATE_TRANSITION'
end

-- Get current lock ID for validation
local currentLockId = redis.call("HGET", keyQueueProperties, EQueuePropertyLockId)
currentLockId = currentLockId or '' -- Handle nil case

-- Handle LOCKED state transitions
if newState == EQueueOperationalStateLocked then
    -- LOCKING: Store new lock information
    if not lockId or lockId == '' then
        return 'INVALID_LOCK'
    end

    -- Store lock information for other operations to validate
    redis.call("HSET", keyQueueProperties, EQueuePropertyLockId, lockId)

elseif currentState == EQueueOperationalStateLocked then
    -- UNLOCKING: Validate lock ID matches
    if not lockId or lockId == '' then
        return 'INVALID_LOCK'
    end

    -- Validate the provided lock ID matches current lock
    if currentLockId == '' or currentLockId ~= lockId then
        return 'INVALID_LOCK'
    end

    -- Clear lock information
    redis.call("HDEL", keyQueueProperties, EQueuePropertyLockId)
end

-- Update queue properties with new state
redis.call("HSET", keyQueueProperties, EQueuePropertyOperationalState, newState)

-- Record transition timestamp (from ARGV)
redis.call("HSET", keyQueueProperties, EQueuePropertyLastStateChangeAt, lastStateChangeAt)

-- Add transition to history
redis.call("LPUSH", keyQueueStateHistory, transitionData)

-- Trim history to last maxQueueStateHistorySize entries
redis.call("LTRIM", keyQueueStateHistory, 0, maxQueueStateHistorySize - 1)

return 'OK'
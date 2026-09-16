--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Atomically sets or removes the rate limit for a given queue.
-- Respects queue operational state - rate limits cannot be changed when queue is LOCKED.
--
-- KEYS[1]: keyQueueProperties (the hash key where queue properties are stored)
--
-- ARGV[1]: EQueuePropertyRateLimit (the name of the rate limit field in the hash)
-- ARGV[2]: rateLimit (the new rate limit value as a JSON string, or an empty string to remove it)
-- ARGV[3]: EQueuePropertyOperationalState (field name for operational state)
-- ARGV[4]: EQueueOperationalStateLocked (LOCKED state enum value)
-- ARGV[5]: EQueuePropertyLockId (field name for lock ID)
-- ARGV[6]: operationLockId (lock ID for the current operation, or empty string if not applicable)
--
-- Returns:
--   - 'OK' on success.
--   - 'QUEUE_NOT_FOUND' if the queue does not exist.
--   - 'QUEUE_LOCKED' if the queue is locked and no valid lock ID is provided.
--   - 'INVALID_LOCK' if the provided lock ID does not match the current lock.

local keyQueueProperties = KEYS[1]
local EQueuePropertyRateLimit = ARGV[1]
local rateLimit = ARGV[2]
local EQueuePropertyOperationalState = ARGV[3]
local EQueueOperationalStateLocked = ARGV[4]
local EQueuePropertyLockId = ARGV[5]
local operationLockId = ARGV[6]

-- Early return if queue doesn't exist
if redis.call("EXISTS", keyQueueProperties) == 0 then
    return 'QUEUE_NOT_FOUND'
end

-- Get current operational state and lock ID
local currentState = redis.call("HGET", keyQueueProperties, EQueuePropertyOperationalState)
local currentLockId = redis.call("HGET", keyQueueProperties, EQueuePropertyLockId)
currentLockId = currentLockId or '' -- Handle nil case

-- Check if queue is locked
if currentState == EQueueOperationalStateLocked then
    -- Queue is locked, need valid lock ID to proceed
    if not operationLockId or operationLockId == '' then
        return 'QUEUE_LOCKED'
    end

    -- Validate the provided lock ID matches current lock
    if currentLockId == '' or currentLockId ~= operationLockId then
        return 'INVALID_LOCK'
    end
end

-- Set the rate limit property
redis.call("HSET", keyQueueProperties, EQueuePropertyRateLimit, rateLimit)

return 'OK'
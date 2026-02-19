--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
--   Atomically clears the rate limit for a queue by removing its
--   configuration from the queue properties and deleting its counter.
--   Respects queue operational state - rate limits cannot be cleared when queue is LOCKED.
--
-- Arguments:
--   KEYS[1]: The key for the queue properties hash.
--   KEYS[2]: The key for the queue rate limit counter.
--
--   ARGV[1]: The field name of the rate limit property to be deleted from the hash (e.g., 'rateLimit').
--   ARGV[2]: EQueuePropertyOperationalState (field name for operational state)
--   ARGV[3]: EQueueOperationalStateLocked (LOCKED state enum value)
--   ARGV[4]: EQueuePropertyLockId (field name for lock ID)
--   ARGV[5]: operationLockId (lock ID for the current operation, or empty string if not applicable)
--
-- Returns:
--   OK: Success.
--   QUEUE_NOT_FOUND: Queue not found.
--   QUEUE_LOCKED: Queue is locked and no valid lock ID is provided.
--   INVALID_LOCK: Provided lock ID does not match the current lock.
--

local keyQueueProperties = KEYS[1]
local keyQueueRateLimitCounter = KEYS[2]

local keyQueuePropertiesRateLimit = ARGV[1]
local EQueuePropertyOperationalState = ARGV[2]
local EQueueOperationalStateLocked = ARGV[3]
local EQueuePropertyLockId = ARGV[4]
local operationLockId = ARGV[5]

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

-- Clear the rate limit property and counter
redis.call('HDEL', keyQueueProperties, keyQueuePropertiesRateLimit)
redis.call('DEL', keyQueueRateLimitCounter)

return 'OK'
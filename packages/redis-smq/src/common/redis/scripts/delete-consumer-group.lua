--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Atomically deletes a consumer group and its associated pending queues,
-- but only if its primary pending queue is empty.
-- Respects queue operational state - requires valid lock ID when queue is LOCKED.
--
-- KEYS[1]: keyQueueConsumerGroups (a set of all consumer group IDs for the queue)
-- KEYS[2]: keyQueuePending (the consumer group's pending list for LIFO/FIFO)
-- KEYS[3]: keyQueuePendingPriority (the consumer group's pending sorted set for Priority)
-- KEYS[4]: keyQueueProperties (the properties hash of the main queue)
--
-- ARGV:
--   ARGV[1]: EQueuePropertyQueueType (the name of the queue type field)
--   ARGV[2]: EQueueTypePriority (the value for a priority queue)
--   ARGV[3]: EQueuePropertyDeliveryModel (the name of the delivery model field)
--   ARGV[4]: EQueueDeliveryModelPubSub (the value for the pub/sub delivery model)
--   ARGV[5]: groupId (the ID of the consumer group to delete)
--   ARGV[6]: EQueuePropertyOperationalState (field name for operational state)
--   ARGV[7]: EQueueOperationalStateLocked (LOCKED state enum value)
--   ARGV[8]: EQueuePropertyLockId (field name for lock ID)
--   ARGV[9]: operationLockId (lock ID for the current operation, or empty string if not applicable)
--
-- Returns:
--   - 'OK' on successful deletion.
--   - 'QUEUE_NOT_FOUND' if the main queue does not exist.
--   - 'CONSUMER_GROUPS_NOT_SUPPORTED' if the queue is not a PUB/SUB queue.
--   - 'CONSUMER_GROUP_NOT_EMPTY' if the consumer group's pending queue still contains messages.
--   - 'QUEUE_LOCKED' if the queue is locked and no valid lock ID is provided.
--   - 'INVALID_LOCK' if the provided lock ID does not match the current lock.

-- Static Keys
local keyQueueConsumerGroups = KEYS[1]
local keyQueuePending = KEYS[2]
local keyQueuePendingPriority = KEYS[3]
local keyQueueProperties = KEYS[4]

-- Arguments
local EQueuePropertyQueueType = ARGV[1]
local EQueueTypePriority = ARGV[2]
local EQueuePropertyDeliveryModel = ARGV[3]
local EQueueDeliveryModelPubSub = ARGV[4]
local groupId = ARGV[5]
-- Operational state constants (new)
local EQueuePropertyOperationalState = ARGV[6]
local EQueueOperationalStateLocked = ARGV[7]
local EQueuePropertyLockId = ARGV[8]
local operationLockId = ARGV[9]

-- Get queue properties
local props = redis.call("HMGET", keyQueueProperties,
    EQueuePropertyQueueType,
    EQueuePropertyDeliveryModel,
    EQueuePropertyOperationalState,
    EQueuePropertyLockId)

local queueType = props[1]
local queueDeliveryModel = props[2]
local currentState = props[3]
local currentLockId = props[4] or '' -- Handle nil case

-- Validate queue existence
if queueType == false then
    return 'QUEUE_NOT_FOUND'
end

-- Check operational state for LOCKED queue
if currentState == EQueueOperationalStateLocked then
    -- Queue is locked, need valid lock ID to proceed with consumer group deletion
    if not operationLockId or operationLockId == '' then
        return 'QUEUE_LOCKED'
    end

    -- Validate the provided lock ID matches current lock
    if currentLockId == '' or currentLockId ~= operationLockId then
        return 'INVALID_LOCK'
    end
end

-- Validate delivery model
if queueDeliveryModel ~= EQueueDeliveryModelPubSub then
    return 'CONSUMER_GROUPS_NOT_SUPPORTED'
end

-- Check if the pending queue is empty using the appropriate command
local count = 0
if queueType == EQueueTypePriority then
    count = redis.call("ZCARD", keyQueuePendingPriority)
else
    count = redis.call("LLEN", keyQueuePending)
end

-- Return early if the queue is not empty
if count > 0 then
    return 'CONSUMER_GROUP_NOT_EMPTY'
end

-- Remove the consumer group from the main queue's set of groups
redis.call("SREM", keyQueueConsumerGroups, groupId)

-- Atomically delete BOTH possible pending queues to ensure a complete cleanup.
-- DEL on a non-existent key is a safe no-op.
redis.call("DEL", keyQueuePending, keyQueuePendingPriority)

return 'OK'
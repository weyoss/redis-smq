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
--
-- KEYS[1]: keyQueueConsumerGroups (a set of all consumer group IDs for the queue)
-- KEYS[2]: keyQueuePending (the consumer group's pending list for LIFO/FIFO)
-- KEYS[3]: keyQueuePendingPriority (the consumer group's pending sorted set for Priority)
-- KEYS[4]: keyQueueProperties (the properties hash of the main queue)
--
-- ARGV:
--   ARGV[1]: EQueuePropertyQueueType (the name of the queue type field)
--   ARGV[2]: EQueueTypePriority (the value for a priority queue)
--   ARGV[3]: groupId (the ID of the consumer group to delete)
--
-- Returns:
--   - 'OK' on successful deletion.
--   - 'QUEUE_NOT_FOUND' if the main queue does not exist.
--   - 'CONSUMER_GROUP_NOT_EMPTY' if the consumer group's pending queue still contains messages.

-- Static Keys
local keyQueueConsumerGroups = KEYS[1]
local keyQueuePending = KEYS[2]
local keyQueuePendingPriority = KEYS[3]
local keyQueueProperties = KEYS[4]

-- Arguments
local EQueuePropertyQueueType = ARGV[1]
local EQueueTypePriority = ARGV[2]
local groupId = ARGV[3]

-- Get queue type once and validate it exists
local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)
if queueType == false then
    return 'QUEUE_NOT_FOUND'
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
--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- This script atomically unsubscribes a consumer from a queue by cleaning up all
-- associated Redis keys and data structures. It removes the consumer from the
-- queue's consumer registry, deletes the consumer's dedicated processing queue,
-- and cleans up the consumer's queue membership set. The operation is atomic and
-- ensures data consistency across all related Redis data structures.
--
-- The script performs the following operations:
--   1. Validates that the target queue exists
--   2. Checks if the consumer's processing queue is empty (returns error if not)
--   3. Removes the consumer's processing queue reference from the queue's
--      processing queues mapping
--   4. Deletes the consumer's dedicated processing queue
--   5. Removes the consumer from the queue's consumer registry
--   6. Removes the queue from the consumer's subscribed queues set
--   7. Cleans up the consumer's queues set if it becomes empty
--
-- KEYS[1]: keyQueueProperties - Hash key storing queue properties and operational state
-- KEYS[2]: keyQueueConsumers - Hash mapping consumer IDs to their metadata for this queue
-- KEYS[3]: keyConsumerQueues - Set of queue identifiers that this consumer is subscribed to
-- KEYS[4]: keyQueueProcessingQueues - Hash mapping processing queue keys to consumer IDs
-- KEYS[5]: keyQueueProcessing - The consumer's dedicated processing queue (list)
--
-- ARGV[1]: consumerId - Unique identifier of the consumer to unsubscribe
-- ARGV[2]: queue - String representation of the queue (e.g., "my-queue@my-ns")
--
-- Returns:
--   - 'OK' on successful unsubscription
--   - 'QUEUE_NOT_FOUND' if the target queue does not exist
--   - 'PROCESSING_QUEUE_NOT_EMPTY' if the consumer's processing queue still contains messages

-- Static Keys
local keyQueueProperties = KEYS[1]
local keyQueueConsumers = KEYS[2]
local keyConsumerQueues = KEYS[3]
local keyQueueProcessingQueues = KEYS[4]
local keyQueueProcessing = KEYS[5]

-- Arguments
local consumerId = ARGV[1]
local queue = ARGV[2]

-- First, check if the queue exists. This is a critical guard clause.
if redis.call("EXISTS", keyQueueProperties) == 0 then
    return 'QUEUE_NOT_FOUND'
end

-- Check if the processing queue is empty
-- Consumers should not have any in-flight messages when unsubscribing
local queueLength = redis.call("LLEN", keyQueueProcessing)
if queueLength > 0 then
    return 'PROCESSING_QUEUE_NOT_EMPTY'
end

-- Delete the consumer's processing queue reference from the queue's mapping
redis.call("HDEL", keyQueueProcessingQueues, keyQueueProcessing)
-- Delete the actual processing queue (list) - now confirmed empty
redis.call("DEL", keyQueueProcessing)

-- Remove the consumer from the queue's consumer registry
redis.call("HDEL", keyQueueConsumers, consumerId)
-- Remove the queue from the consumer's subscribed queues set
redis.call("SREM", keyConsumerQueues, queue)
-- If the consumer has no more queues subscribed, clean up the set entirely
local size = redis.call("SCARD", keyConsumerQueues)
if size == 0 then
    redis.call("DEL", keyConsumerQueues)
end

return 'OK'
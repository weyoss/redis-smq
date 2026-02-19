--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Initializes a consumer for a given queue. This script performs the following actions atomically:
-- 1. Verifies that the target queue exists.
-- 2. Checks if the consumer is already registered to prevent redundant operations.
-- 3. Associates the consumer with the queue.
-- 4. Registers the consumer's dedicated processing queue.
-- Consumers are only allowed to subscribe when queue operational state is ACTIVE.
--
-- KEYS[1]: keyQueues (a set of all queue names)
-- KEYS[2]: keyQueueConsumers (a hash mapping consumer IDs to their info for a given queue)
-- KEYS[3]: keyConsumerQueues (a set of queues that a given consumer is subscribed to)
-- KEYS[4]: keyQueueProcessingQueues (a hash mapping processing queue keys to consumer IDs for a given queue)
-- KEYS[5]: keyQueueProcessing (the consumer's dedicated processing queue)
-- KEYS[6]: keyQueueProperties (the hash key where queue properties are stored)
--
-- ARGV[1]: consumerId
-- ARGV[2]: consumerInfo (a string, typically JSON, with consumer details)
-- ARGV[3]: queue (the queue name string, e.g., "my-queue@my-ns")
-- ARGV[4]: EQueuePropertyOperationalState (field name for operational state)
-- ARGV[5]: EQueueOperationalStateActive (ACTIVE state enum value)
--
-- Returns:
--   - 'OK' on successful initialization or if the consumer is already initialized.
--   - 'QUEUE_NOT_FOUND' if the target queue does not exist.
--   - 'QUEUE_NOT_ACTIVE' if the queue operational state is not ACTIVE.

-- Static Keys
local keyQueues = KEYS[1]
local keyQueueConsumers = KEYS[2]
local keyConsumerQueues = KEYS[3]
local keyQueueProcessingQueues = KEYS[4]
local keyQueueProcessing = KEYS[5]
local keyQueueProperties = KEYS[6]

-- Arguments
local consumerId = ARGV[1]
local consumerInfo = ARGV[2]
local queue = ARGV[3]
-- Operational state constants (new)
local EQueuePropertyOperationalState = ARGV[4]
local EQueueOperationalStateActive = ARGV[5]

-- First, check if the queue exists. This is a critical guard clause.
if redis.call("SISMEMBER", keyQueues, queue) == 0 then
    return 'QUEUE_NOT_FOUND'
end

-- Get current operational state
local currentState = redis.call("HGET", keyQueueProperties, EQueuePropertyOperationalState)
if currentState == false then
    -- Default to ACTIVE if operational state is not set
    currentState = EQueueOperationalStateActive
end

-- Validate queue operational state for consumer subscription
if currentState ~= EQueueOperationalStateActive then
    return 'QUEUE_NOT_ACTIVE'
end

-- Idempotency check: If the consumer is already registered for this queue,
-- do nothing and return success. This prevents redundant writes.
if redis.call("HGET", keyQueueConsumers, consumerId) then
    return 'OK'
end

-- Associate the queue with the consumer.
redis.call("SADD", keyConsumerQueues, queue)

-- Register the consumer with the queue and its processing queue.
redis.call("HSET", keyQueueConsumers, consumerId, consumerInfo)
redis.call("HSET", keyQueueProcessingQueues, keyQueueProcessing, consumerId)

return 'OK'
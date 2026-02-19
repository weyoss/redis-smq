--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Re-queues messages from the delayed sorted set to the pending queue.
-- This script is designed for batch processing to improve performance. It moves messages
-- that are due for a retry back into the active processing queue.
-- It atomically removes messages from the delayed queue to prevent race conditions
-- and updates message status and the 'lastRetriedAttemptAt' timestamp.
-- It supports FIFO, LIFO, and Priority queues.
-- For PUB/SUB queues, if a message's target consumer group has been deleted,
-- the message is moved to the dead-letter queue instead of being re-queued.
-- Queue counters are updated once per batch for efficiency.
-- Respects queue operational state - returns specific error codes when queue state prevents requeue.
--
-- KEYS:
--   Static Keys (1-4):
--     KEYS[1]: keyQueueProperties (HMAP)
--     KEYS[2]: keyQueueDelayed (ZSET)
--     KEYS[3]: keyQueueDeadLettered (LIST)
--     KEYS[4]: keyQueueConsumerGroups (SET)
--   Dynamic Keys (5...):
--     A flat list of repeating keys for each message.
--
--   KEYS structure per message (3 keys):
--     1. keyMessage
--     2. keyQueuePending (for FIFO/LIFO)
--     3. keyQueuePriorityPending (for Priority)
--
-- ARGV:
--   Static ARGV (1-17):
--     ARGV[1-16]: A list of all EQueueProperty and EMessageProperty constants.
--     ARGV[17]: Current timestamp.
--   Dynamic ARGV (18...):
--     A flat list of repeating parameters for each message.
--
-- ARGV structure per message (3 parameters):
--   1. messageId
--   2. messagePriority
--   3. consumerGroupId
--
-- Returns:
--   - The number of messages successfully processed (re-queued or dead-lettered).
--   - 'QUEUE_STOPPED': Queue is in STOPPED state.
--   - 'QUEUE_LOCKED': Queue is in LOCKED state.
--   - 'QUEUE_INVALID_STATE': Queue is in an unknown state.

-- Static Keys
local keyQueueProperties = KEYS[1]
local keyQueueDelayed = KEYS[2]
local keyQueueDeadLettered = KEYS[3]
local keyQueueConsumerGroups = KEYS[4]

-- Static ARGV
local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyDelayedMessagesCount = ARGV[2]
local EQueuePropertyPendingMessagesCount = ARGV[3]
local EQueuePropertyDeadLetteredMessagesCount = ARGV[4]
local EMessagePropertyStatus = ARGV[5]
local EMessagePropertyStatusPending = ARGV[6]
local EMessagePropertyStatusDeadLettered = ARGV[7]
local EMessagePropertyDeadLetteredAt = ARGV[8]
local EMessagePropertyLastRetriedAttemptAt = ARGV[9]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[10]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[11]
-- Operational state constants (new)
local EQueuePropertyOperationalState = ARGV[12]
local EQueueOperationalStateActive = ARGV[13]
local EQueueOperationalStatePaused = ARGV[14]
local EQueueOperationalStateStopped = ARGV[15]
local EQueueOperationalStateLocked = ARGV[16]
local timestamp = ARGV[17]

-- Early exit if the queue does not exist
local queueProps = redis.call("HMGET", keyQueueProperties,
    EQueuePropertyQueueType,
    EQueuePropertyOperationalState)

local queueType = queueProps[1]
local operationalState = queueProps[2]

if queueType == false then
    return 0
end

if operationalState == false then
    -- Default to ACTIVE if operational state is not set
    operationalState = EQueueOperationalStateActive
end

-- Validate queue operational state
if operationalState == EQueueOperationalStateStopped then
    -- Queue is completely stopped, no processing allowed
    return 'QUEUE_STOPPED'
elseif operationalState == EQueueOperationalStateLocked then
    -- Queue is locked, delayed requeue operations cannot be processed
    return 'QUEUE_LOCKED'
elseif operationalState == EQueueOperationalStatePaused then
    -- Queue is paused, messages can be moved to pending but won't be consumed
    -- This is allowed, so continue
elseif operationalState == EQueueOperationalStateActive then
    -- Queue is active, messages can be processed
    -- This is allowed, so continue
else
    -- Unknown state, skip processing as a safety measure
    return 'QUEUE_INVALID_STATE'
end

-- Constants for parameter counts
local INITIAL_KEY_OFFSET = 4
local INITIAL_ARGV_OFFSET = 17
local PARAMS_PER_MESSAGE = 3
local KEYS_PER_MESSAGE = 3

local keyIndex = INITIAL_KEY_OFFSET + 1
local requeued_count = 0
local dead_lettered_count = 0

-- Process messages in batches
for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    -- Extract message parameters
    local messageId = ARGV[argvIndex]
    local messagePriority = ARGV[argvIndex + 1]
    local consumerGroupId = ARGV[argvIndex + 2]

    -- Get the message keys for this iteration from KEYS
    local keyMessage = KEYS[keyIndex]
    local keyQueuePending = KEYS[keyIndex + 1]
    local keyQueuePriorityPending = KEYS[keyIndex + 2]
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    -- Attempt to remove the message from the delayed list.
    -- If ZREM returns 0, the message was not found (e.g., already processed),
    -- so we skip it to prevent corrupting queue counters.
    if redis.call("ZREM", keyQueueDelayed, messageId) == 1 then
        local group_exists = true
        if consumerGroupId and consumerGroupId ~= '' then
            if redis.call("SISMEMBER", keyQueueConsumerGroups, consumerGroupId) == 0 then
                group_exists = false
            end
        end

        if group_exists then
            -- Move the message to the pending queue.
            if queueType == EQueuePropertyQueueTypeFIFOQueue then
                redis.call("LPUSH", keyQueuePending, messageId)
            elseif queueType == EQueuePropertyQueueTypeLIFOQueue then
                redis.call("RPUSH", keyQueuePending, messageId)
            else -- Priority queue
                redis.call("ZADD", keyQueuePriorityPending, messagePriority, messageId)
            end

            -- Update message properties
            redis.call("HSET", keyMessage,
                EMessagePropertyStatus, EMessagePropertyStatusPending,
                EMessagePropertyLastRetriedAttemptAt, timestamp
            )

            requeued_count = requeued_count + 1
        else
            -- The consumer group does not exist. Dead-letter the message.
            redis.call("RPUSH", keyQueueDeadLettered, messageId)

            -- Update message properties
            redis.call("HSET", keyMessage,
                EMessagePropertyStatus, EMessagePropertyStatusDeadLettered,
                EMessagePropertyDeadLetteredAt, timestamp
            )

            dead_lettered_count = dead_lettered_count + 1
        end
    end
end

-- After processing the whole batch, update queue counters once.
if requeued_count > 0 then
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyPendingMessagesCount, requeued_count)
end

if dead_lettered_count > 0 then
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyDeadLetteredMessagesCount, dead_lettered_count)
end

local total_processed = requeued_count + dead_lettered_count
if total_processed > 0 then
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyDelayedMessagesCount, -total_processed)
end

return total_processed
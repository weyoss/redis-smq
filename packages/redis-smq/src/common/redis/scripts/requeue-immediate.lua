--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Re-queues unacknowledged messages from the 'requeue' list to either the 'pending' queue
-- or the 'delayed' queue based on each message's retry delay.
-- This is a powerful, consolidated script designed for batch processing.
--
-- It atomically removes messages from the 'requeue' list.
-- - If a message has a retryDelay > 0, it is moved to the 'delayed' sorted set.
-- - If a message has no retryDelay, it is moved to the appropriate 'pending' queue.
--   - For PUB/SUB queues, if the target consumer group is deleted, the message is
--     moved to the dead-letter queue instead.
--
-- All queue counters are updated once at the end of the script for maximum efficiency.
--
-- KEYS:
--   Static Keys (1-5):
--     KEYS[1]: keyQueueProperties (HMAP)
--     KEYS[2]: keyQueueRequeued (LIST)
--     KEYS[3]: keyQueueDelayed (ZSET)
--     KEYS[4]: keyQueueDeadLettered (LIST)
--     KEYS[5]: keyQueueConsumerGroups (SET)
--   Dynamic Keys (6...):
--     A flat list of repeating keys for each message.
--
--   KEYS structure per message (3 keys):
--     1. keyMessage
--     2. keyQueuePending (for FIFO/LIFO)
--     3. keyQueuePriorityPending (for Priority)
--
-- ARGV:
--   Static ARGV (1-14):
--     A list of all EQueueProperty and EMessageProperty constants.
--     ARGV[14]: Current timestamp.
--   Dynamic ARGV (15...):
--     A flat list of repeating parameters for each message.
--
-- ARGV structure per message (5 parameters):
--   1. messageId
--   2. messagePriority
--   3. retryDelay
--   4. delayedTimestamp
--   5. consumerGroupId
--
-- Returns:
--   - The total number of messages successfully processed.

-- Static Keys
local keyQueueProperties = KEYS[1]
local keyQueueRequeued = KEYS[2]
local keyQueueDelayed = KEYS[3]
local keyQueueDeadLettered = KEYS[4]
local keyQueueConsumerGroups = KEYS[5]

-- Static ARGV
local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyRequeuedMessagesCount = ARGV[2]
local EQueuePropertyDelayedMessagesCount = ARGV[3]
local EQueuePropertyPendingMessagesCount = ARGV[4]
local EQueuePropertyDeadLetteredMessagesCount = ARGV[5]
local EMessagePropertyStatus = ARGV[6]
local EMessagePropertyStatusPending = ARGV[7]
local EMessagePropertyStatusDeadLettered = ARGV[8]
local EMessagePropertyDeadLetteredAt = ARGV[9]
local EMessagePropertyStatusUnackDelaying = ARGV[10]
local EMessagePropertyLastRetriedAttemptAt = ARGV[11]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[12]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[13]
local timestamp = ARGV[14]

-- Early exit if the queue does not exist.
local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)
if queueType == false then
    return 0
end

-- Constants for parameter counts
local INITIAL_KEY_OFFSET = 5
local INITIAL_ARGV_OFFSET = 14
local PARAMS_PER_MESSAGE_ARGV = 5
local PARAMS_PER_MESSAGE_KEYS = 3

local keyIndex = INITIAL_KEY_OFFSET + 1
local processedPendingCount = 0
local processedDelayedCount = 0
local processedDeadLetteredCount = 0

-- Process messages in batches
for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE_ARGV do
    -- Extract message parameters from ARGV
    local messageId = ARGV[argvIndex]
    local messagePriority = ARGV[argvIndex + 1]
    local retryDelay = ARGV[argvIndex + 2]
    local delayedTimestamp = ARGV[argvIndex + 3]
    local consumerGroupId = ARGV[argvIndex + 4]

    -- Get the message keys for this iteration from KEYS
    local keyMessage = KEYS[keyIndex]
    local keyQueuePending = KEYS[keyIndex + 1]
    local keyQueuePriorityPending = KEYS[keyIndex + 2]
    keyIndex = keyIndex + PARAMS_PER_MESSAGE_KEYS

    -- Atomically remove the message from the requeue list.
    if redis.call("LREM", keyQueueRequeued, 1, messageId) == 1 then
        if retryDelay == '0' then
            -- Immediate retry: Check consumer group existence for PUB/SUB queues.
            local group_exists = true
            if consumerGroupId and consumerGroupId ~= '' then
                if redis.call("SISMEMBER", keyQueueConsumerGroups, consumerGroupId) == 0 then
                    group_exists = false
                end
            end

            if group_exists then
                -- Move to the pending queue
                if queueType == EQueuePropertyQueueTypeFIFOQueue then
                    redis.call("LPUSH", keyQueuePending, messageId)
                elseif queueType == EQueuePropertyQueueTypeLIFOQueue then
                    redis.call("RPUSH", keyQueuePending, messageId)
                else -- Priority queue
                    redis.call("ZADD", keyQueuePriorityPending, messagePriority, messageId)
                end

                redis.call("HSET", keyMessage,
                        EMessagePropertyStatus, EMessagePropertyStatusPending,
                        EMessagePropertyLastRetriedAttemptAt, timestamp
                )
                processedPendingCount = processedPendingCount + 1
            else
                -- Consumer group is gone. Dead-letter the message.
                redis.call("RPUSH", keyQueueDeadLettered, messageId)
                redis.call("HSET", keyMessage,
                        EMessagePropertyStatus, EMessagePropertyStatusDeadLettered,
                        EMessagePropertyDeadLetteredAt, timestamp
                )
                processedDeadLetteredCount = processedDeadLetteredCount + 1
            end
        else
            -- Move to the delayed queue
            redis.call('HSET', keyMessage, EMessagePropertyStatus, EMessagePropertyStatusUnackDelaying)
            redis.call('ZADD', keyQueueDelayed, delayedTimestamp, messageId)
            processedDelayedCount = processedDelayedCount + 1
        end
    end
end

-- After processing the whole batch, update all queue counters once.
local total_processed = processedPendingCount + processedDelayedCount + processedDeadLetteredCount
if total_processed > 0 then
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyRequeuedMessagesCount, -total_processed)
    if processedDelayedCount > 0 then
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyDelayedMessagesCount, processedDelayedCount)
    end
    if processedPendingCount > 0 then
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyPendingMessagesCount, processedPendingCount)
    end
    if processedDeadLetteredCount > 0 then
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyDeadLetteredMessagesCount, processedDeadLetteredCount)
    end
end

return total_processed
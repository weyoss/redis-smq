-- Description:
-- Re-queues unacknowledged messages from the 'requeue' list to either the 'pending' queue
-- or the 'delayed' queue based on each message's retry delay.
-- This is a powerful, consolidated script designed for batch processing.
--
-- It atomically removes messages from the 'requeue' list.
-- - If a message has a retryDelay > 0, it is moved to the 'delayed' sorted set.
-- - If a message has no retryDelay, it is moved to the appropriate 'pending' queue.
--
-- All queue counters are updated once at the end of the script for maximum efficiency.
--
-- KEYS:
--   Static Keys (1-3):
--     KEYS[1]: keyQueueProperties (HMAP)
--     KEYS[2]: keyQueueRequeued (LIST)
--     KEYS[3]: keyQueueDelayed (ZSET)
--   Dynamic Keys (4...):
--     A flat list of repeating keys for each message.
--
--   KEYS structure per message (3 keys):
--     1. keyMessage
--     2. keyQueuePending (for FIFO/LIFO)
--     3. keyQueuePriorityPending (for Priority)
--
-- ARGV:
--   Static ARGV (1-11):
--     A list of all EQueueProperty and EMessageProperty constants.
--     ARGV[11]: Current timestamp.
--   Dynamic ARGV (12...):
--     A flat list of repeating parameters for each message.
--
-- ARGV structure per message (4 parameters):
--   1. messageId
--   2. messagePriority
--   3. retryDelay
--   4. delayedTimestamp
--
-- Returns:
--   - The total number of messages successfully processed.

-- Static Keys
local keyQueueProperties = KEYS[1]
local keyQueueRequeued = KEYS[2]
local keyQueueDelayed = KEYS[3]

-- Static ARGV
local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyRequeuedMessagesCount = ARGV[2]
local EQueuePropertyDelayedMessagesCount = ARGV[3]
local EQueuePropertyPendingMessagesCount = ARGV[4]
local EMessagePropertyStatus = ARGV[5]
local EMessagePropertyStatusPending = ARGV[6]
local EMessagePropertyStatusUnackDelaying = ARGV[7]
local EMessagePropertyLastRetriedAttemptAt = ARGV[8]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[9]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[10]
local timestamp = ARGV[11]

-- Early exit if the queue does not exist.
local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)
if queueType == false then
    return 0
end

-- Constants for parameter counts
local INITIAL_KEY_OFFSET = 3
local INITIAL_ARGV_OFFSET = 11
local PARAMS_PER_MESSAGE_ARGV = 4
local PARAMS_PER_MESSAGE_KEYS = 3

local keyIndex = INITIAL_KEY_OFFSET + 1
local processedPendingCount = 0
local processedDelayedCount = 0

-- Process messages in batches
for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE_ARGV do
    -- Extract message parameters from ARGV
    local messageId = ARGV[argvIndex]
    local messagePriority = ARGV[argvIndex + 1]
    local retryDelay = ARGV[argvIndex + 2]
    local delayedTimestamp = ARGV[argvIndex + 3]

    -- Get the message keys for this iteration from KEYS
    local keyMessage = KEYS[keyIndex]
    local keyQueuePending = KEYS[keyIndex + 1]
    local keyQueuePriorityPending = KEYS[keyIndex + 2]
    keyIndex = keyIndex + PARAMS_PER_MESSAGE_KEYS

    -- Atomically remove the message from the requeue list.
    if redis.call("LREM", keyQueueRequeued, 1, messageId) == 1 then
        if retryDelay == '0' then
            -- Move to the pending queue (immediate retry)
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
            -- Move to the delayed queue
            redis.call('HSET', keyMessage, EMessagePropertyStatus, EMessagePropertyStatusUnackDelaying)
            redis.call('ZADD', keyQueueDelayed, delayedTimestamp, messageId)
            processedDelayedCount = processedDelayedCount + 1
        end
    end
end

-- After processing the whole batch, update all queue counters once.
local total_processed = processedPendingCount + processedDelayedCount
if total_processed > 0 then
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyRequeuedMessagesCount, -total_processed)
    if processedDelayedCount > 0 then
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyDelayedMessagesCount, processedDelayedCount)
    end
    if processedPendingCount > 0 then
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyPendingMessagesCount, processedPendingCount)
    end
end

return total_processed
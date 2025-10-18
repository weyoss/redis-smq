-- Re-queues messages from the delayed sorted set to the pending queue.
-- This script is designed for batch processing to improve performance. It moves messages
-- that are due for a retry back into the active processing queue.
-- It atomically removes messages from the delayed queue to prevent race conditions
-- and updates message status and the 'lastRetriedAttemptAt' timestamp.
-- It supports FIFO, LIFO, and Priority queues.
-- For PUB/SUB queues, if a message's target consumer group has been deleted,
-- the message is moved to the dead-letter queue instead of being re-queued.
-- Queue counters are updated once per batch for efficiency.
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
--   Static ARGV (1-12):
--     ARGV[1-11]: A list of all EQueueProperty and EMessageProperty constants.
--     ARGV[12]: Current timestamp.
--   Dynamic ARGV (13...):
--     A flat list of repeating parameters for each message.
--
-- ARGV structure per message (3 parameters):
--   1. messageId
--   2. messagePriority
--   3. consumerGroupId
--
-- Returns:
--   - The number of messages successfully processed (re-queued or dead-lettered).

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
local timestamp = ARGV[12]

-- Early exit if the queue does not exist
local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)
if queueType == false then
    return 0
end

-- Constants for parameter counts
local INITIAL_KEY_OFFSET = 4
local INITIAL_ARGV_OFFSET = 12
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
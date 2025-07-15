-- Description:
-- Re-queues messages from the delayed sorted set to the pending queue.
-- This script is designed for batch processing to improve performance. It moves messages
-- that are due for a retry back into the active processing queue.
-- It atomically removes messages from the delayed queue to prevent race conditions
-- and updates message status and the 'lastRetriedAttemptAt' timestamp.
-- It supports FIFO, LIFO, and Priority queues.
-- Queue counters are updated once per batch for efficiency.
--
-- KEYS:
--   Static Keys (1-2):
--     KEYS[1]: keyQueueProperties (HMAP)
--     KEYS[2]: keyQueueDelayed (ZSET)
--   Dynamic Keys (3...):
--     A flat list of repeating keys for each message.
--
--   KEYS structure per message (3 keys):
--     1. keyMessage
--     2. keyQueuePending (for FIFO/LIFO)
--     3. keyQueuePriorityPending (for Priority)
--
-- ARGV:
--   Static ARGV (1-9):
--     ARGV[1-8]: A list of all EQueueProperty and EMessageProperty constants.
--     ARGV[9]: Current timestamp.
--   Dynamic ARGV (10...):
--     A flat list of repeating parameters for each message.
--
-- ARGV structure per message (2 parameters):
--   1. messageId
--   2. messagePriority
--
-- Returns:
--   - The number of messages successfully processed and re-queued.

-- Static Keys
local keyQueueProperties = KEYS[1]
local keyQueueDelayed = KEYS[2]

-- Static ARGV
local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyDelayedMessagesCount = ARGV[2]
local EQueuePropertyPendingMessagesCount = ARGV[3]
local EMessagePropertyStatus = ARGV[4]
local EMessagePropertyStatusPending = ARGV[5]
local EMessagePropertyLastRetriedAttemptAt = ARGV[6]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[7]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[8]
local timestamp = ARGV[9]

-- Early exit if the queue does not exist
local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)
if queueType == false then
    return 0
end

-- Constants for parameter counts
local INITIAL_KEY_OFFSET = 2
local INITIAL_ARGV_OFFSET = 9
local PARAMS_PER_MESSAGE = 2
local KEYS_PER_MESSAGE = 3

local keyIndex = INITIAL_KEY_OFFSET + 1
local processed_count = 0

-- Process messages in batches
for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    -- Extract message parameters
    local messageId = ARGV[argvIndex]
    local messagePriority = ARGV[argvIndex + 1]

    -- Get the message keys for this iteration from KEYS
    local keyMessage = KEYS[keyIndex]
    local keyQueuePending = KEYS[keyIndex + 1]
    local keyQueuePriorityPending = KEYS[keyIndex + 2]
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    -- Attempt to remove the message from the delayed list.
    -- If ZREM returns 0, the message was not found (e.g., already processed),
    -- so we skip it to prevent corrupting queue counters.
    if redis.call("ZREM", keyQueueDelayed, messageId) == 1 then
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

        processed_count = processed_count + 1
    end
end

-- After processing the whole batch, update queue counters once.
-- This is much more efficient than updating them inside the loop.
if processed_count > 0 then
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyDelayedMessagesCount, -processed_count)
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyPendingMessagesCount, processed_count)
end

return processed_count
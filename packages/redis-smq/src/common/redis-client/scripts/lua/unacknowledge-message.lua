-- Description:
-- This script atomically recovers messages from a consumer's processing queue,
-- deciding whether to requeue them for another attempt or move them to the dead-letter queue.
-- It also cleans up resources associated with the dead consumer and is optimized for
-- safe, atomic batch operations.
--
-- KEYS:
--   Static Keys (1-5): All queue-related keys except consumer-specific ones.
--   Dynamic Keys (6...): A repeating triplet of [keyQueueProcessing, keyMessage, keyConsumerQueues] for each message.
--
-- ARGV:
--   Static ARGV (1-18): All constants.
--   Dynamic ARGV (19...): A flat list of parameters for each message.
--
-- ARGV structure per message (9 parameters):
--   1. queue (JSON string)
--   2. consumerId
--   3. messageId
--   4. retryAction
--   5. messageUnacknowledgedCause
--   6. deadLetteredAt
--   7. messageExpired
--   8. unacknowledgedAt
--   9. lastUnacknowledgedAt
--
-- Returns:
--   The number of messages that were successfully unacknowledged.

-- Static Keys
local keyQueueRequeued = KEYS[1]
local keyQueueDL = KEYS[2]
local keyQueueProcessingQueues = KEYS[3]
local keyQueueConsumers = KEYS[4]
local keyQueueProperties = KEYS[5]

-- Static ARGV
local ERetryActionDelay = ARGV[1]
local ERetryActionRequeue = ARGV[2]
local ERetryActionDeadLetter = ARGV[3]
local storeMessages = ARGV[4]
local expireStoredMessages = ARGV[5]
local storedMessagesSize = ARGV[6]
local EMessagePropertyStatus = ARGV[7]
local EMessageUnacknowledgedCauseOfflineConsumer = ARGV[8]
local EMessageUnacknowledgedCauseOfflineHandler = ARGV[9]
local EQueuePropertyProcessingMessagesCount = ARGV[10]
local EQueuePropertyDeadLetteredMessagesCount = ARGV[11]
local EQueuePropertyRequeuedMessagesCount = ARGV[12]
local EMessagePropertyStatusUnackRequeuing = ARGV[13]
local EMessagePropertyStatusDeadLettered = ARGV[14]
local EMessagePropertyDeadLetteredAt = ARGV[15]
local EMessagePropertyUnacknowledgedAt = ARGV[16]
local EMessagePropertyLastUnacknowledgedAt = ARGV[17]
local EMessagePropertyExpired = ARGV[18]

-- Loop constants
local INITIAL_KEY_OFFSET = 5
local INITIAL_ARGV_OFFSET = 18
local PARAMS_PER_MESSAGE = 9
local KEYS_PER_MESSAGE = 3 -- keyQueueProcessing + keyMessage + keyConsumerQueues
local E_INVALID_ARGS_ERROR_REPLY = "Mismatch between the number of keys and arguments provided."

-- Validation: Ensure the number of dynamic keys and args are proportional.
if ((#KEYS - INITIAL_KEY_OFFSET) * PARAMS_PER_MESSAGE) ~= ((#ARGV - INITIAL_ARGV_OFFSET) * KEYS_PER_MESSAGE) then
    return redis.error_reply(E_INVALID_ARGS_ERROR_REPLY)
end

-- If there are no dynamic arguments, there is nothing to do.
if #ARGV == INITIAL_ARGV_OFFSET then
    return 0
end

local keyIndex = INITIAL_KEY_OFFSET + 1
local processedCount = 0
local deadLetteredCount = 0
local requeuedCount = 0

for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    -- Read all values for this message
    local queue = ARGV[argvIndex]
    local consumerId = ARGV[argvIndex + 1]
    local messageId = ARGV[argvIndex + 2]
    local retryAction = ARGV[argvIndex + 3]
    local messageUnacknowledgedCause = ARGV[argvIndex + 4]
    local deadLetteredAt = ARGV[argvIndex + 5]
    local messageExpired = ARGV[argvIndex + 6]
    local unacknowledgedAt = ARGV[argvIndex + 7]
    local lastUnacknowledgedAt = ARGV[argvIndex + 8]

    -- Get dynamic keys for this message
    local keyQueueProcessing = KEYS[keyIndex]
    local keyMessage = KEYS[keyIndex + 1]
    local keyConsumerQueues = KEYS[keyIndex + 2]
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    -- Process message only if it exists and can be claimed
    if messageId ~= '' then
        -- Atomically remove the message from the processing queue.
        -- If LREM returns 0, the message was not found (already processed or moved).
        if redis.call("LREM", keyQueueProcessing, 1, messageId) == 1 then
            local status
            if (retryAction == ERetryActionRequeue) or (retryAction == ERetryActionDelay)  then
                status = EMessagePropertyStatusUnackRequeuing
                redis.call("RPUSH", keyQueueRequeued, messageId)
                requeuedCount = requeuedCount + 1
            else -- Dead-letter
                status = EMessagePropertyStatusDeadLettered
                if storeMessages == '1' then
                    redis.call("RPUSH", keyQueueDL, messageId)
                    if expireStoredMessages ~= '0' then
                        redis.call("PEXPIRE", keyQueueDL, expireStoredMessages)
                    end
                    if storedMessagesSize ~= '0' then
                        redis.call("LTRIM", keyQueueDL, storedMessagesSize, -1)
                    end
                end
                deadLetteredCount = deadLetteredCount + 1
            end

            redis.call(
                    "HSET", keyMessage,
                    EMessagePropertyStatus, status,
                    EMessagePropertyUnacknowledgedAt, unacknowledgedAt,
                    EMessagePropertyLastUnacknowledgedAt, lastUnacknowledgedAt,
                    EMessagePropertyDeadLetteredAt, deadLetteredAt,
                    EMessagePropertyExpired, messageExpired
            )
            processedCount = processedCount + 1
        end
    end

    -- Handle offline consumer/handler
    if messageUnacknowledgedCause == EMessageUnacknowledgedCauseOfflineConsumer or
            messageUnacknowledgedCause == EMessageUnacknowledgedCauseOfflineHandler then
        -- Delete processing queue
        redis.call("HDEL", keyQueueProcessingQueues, keyQueueProcessing)
        redis.call("DEL", keyQueueProcessing)

        -- Remove queue consumer
        redis.call("HDEL", keyQueueConsumers, consumerId)
        redis.call("SREM", keyConsumerQueues, queue)
        local size = redis.call("SCARD", keyConsumerQueues)
        if size == 0 then
            redis.call("DEL", keyConsumerQueues)
        end
    end
end

-- Update queue counters once per batch for performance.
if processedCount > 0 then
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyProcessingMessagesCount, -processedCount)
end
if deadLetteredCount > 0 then
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyDeadLetteredMessagesCount, deadLetteredCount)
end
if requeuedCount > 0 then
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyRequeuedMessagesCount, requeuedCount)
end

return processedCount
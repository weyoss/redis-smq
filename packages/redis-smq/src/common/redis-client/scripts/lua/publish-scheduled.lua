-- Description:
-- Publishes due scheduled messages for a SINGLE queue. This script handles two cases:
-- 1. Simple scheduled message: The message is moved to the pending queue.
-- 2. Repeating scheduled message: A new message is created and published, and the original is rescheduled.
--
-- This script depends on 'shared-procedures/publish-message.lua'.
-- The content of 'shared-procedures/publish-message.lua' must be prepended to this script before loading it into Redis.
--
-- KEYS:
--   Static Keys (1-5):
--     KEYS[1]: keyQueueProperties
--     KEYS[2]: keyQueuePending
--     KEYS[3]: keyQueueMessages
--     KEYS[4]: keyQueuePriorityPending
--     KEYS[5]: keyQueueScheduled
--   Dynamic Keys (6...): A repeating pair for each message.
--     - keyMessage (for the new message, or an empty placeholder)
--     - keyScheduledMessage (for the original message)
--
-- ARGV:
--   ARGV[1-32]: A list of all EQueueProperty and EMessageProperty constants.
--   ARGV[33...]: A flat list of repeating parameters for each message.
--
-- ARGV structure per message (12 parameters):
--   1. messageId (new message ID, or '')
--   2. message (new message body, or '')
--   3. messagePriority
--   4. messagePublishedAt (for new message)
--   5. scheduledMessageId
--   6. scheduledMessageNextScheduleTimestamp ('0' if not repeating)
--   7. scheduledMessageLastScheduledAt
--   8. scheduledMessageScheduledTimes
--   9. scheduledMessagePublishedAt
--   10. scheduledMessageCronFired
--   11. scheduledMessageRepeatCount
--   12. scheduledMessageEffectiveScheduledDelay
--
-- Returns:
--   - The number of successfully processed messages.
--   - A detailed error string if publishing a new message fails.

-- Static Keys
local keyQueueProperties = KEYS[1]
local keyQueuePending = KEYS[2]
local keyQueueMessages = KEYS[3]
local keyQueuePriorityPending = KEYS[4]
local keyQueueScheduled = KEYS[5]

-- Early exit if the queue does not exist. This check is now done only once per batch.
local queueType = redis.call("HGET", keyQueueProperties, ARGV[1] -- EQueuePropertyQueueType
)
if queueType == false then
    return 0
end

-- Queue Property Constants (ARGV[1-7])
local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyMessagesCount = ARGV[2]
local EQueuePropertyPendingMessagesCount = ARGV[3]
local EQueuePropertyScheduledMessagesCount = ARGV[4]
local EQueuePropertyQueueTypePriorityQueue = ARGV[5]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[6]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[7]

-- Message Status Constants (ARGV[8-9])
local EMessagePropertyStatusPending = ARGV[8]
local EMessagePropertyStatusScheduled = ARGV[9]

-- Message Property Constants (ARGV[10-32])
local EMessagePropertyId = ARGV[10]
local EMessagePropertyStatus = ARGV[11]
local EMessagePropertyMessage = ARGV[12]
local EMessagePropertyScheduledAt = ARGV[13]
local EMessagePropertyPublishedAt = ARGV[14]
local EMessagePropertyProcessingStartedAt = ARGV[15]
local EMessagePropertyDeadLetteredAt = ARGV[16]
local EMessagePropertyAcknowledgedAt = ARGV[17]
local EMessagePropertyUnacknowledgedAt = ARGV[18]
local EMessagePropertyLastUnacknowledgedAt = ARGV[19]
local EMessagePropertyLastScheduledAt = ARGV[20]
local EMessagePropertyRequeuedAt = ARGV[21]
local EMessagePropertyRequeueCount = ARGV[22]
local EMessagePropertyLastRequeuedAt = ARGV[23]
local EMessagePropertyLastRetriedAttemptAt = ARGV[24]
local EMessagePropertyScheduledCronFired = ARGV[25]
local EMessagePropertyAttempts = ARGV[26]
local EMessagePropertyScheduledRepeatCount = ARGV[27]
local EMessagePropertyExpired = ARGV[28]
local EMessagePropertyEffectiveScheduledDelay = ARGV[29]
local EMessagePropertyScheduledTimes = ARGV[30]
local EMessagePropertyScheduledMessageParentId = ARGV[31]
local EMessagePropertyRequeuedMessageParentId = ARGV[32]

-- Loop constants
local INITIAL_ARGV_OFFSET = 32
local INITIAL_KEY_OFFSET = 5
local PARAMS_PER_MESSAGE = 12
local KEYS_PER_MESSAGE = 2
local keyIndex = INITIAL_KEY_OFFSET + 1
local processed_count = 0

for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    -- Extract message parameters for the current message
    local newMessageId = ARGV[argvIndex]
    local newMessage = ARGV[argvIndex + 1]
    local newMessagePriority = ARGV[argvIndex + 2]
    local newMessagePublishedAt = ARGV[argvIndex + 3]
    local scheduledMessageId = ARGV[argvIndex + 4]
    local scheduledMessageNextScheduleTimestamp = ARGV[argvIndex + 5]
    local scheduledMessageLastScheduledAt = ARGV[argvIndex + 6]
    local scheduledMessageScheduledTimes = ARGV[argvIndex + 7]
    local scheduledMessagePublishedAt = ARGV[argvIndex + 8]
    local scheduledMessageCronFired = ARGV[argvIndex + 9]
    local scheduledMessageRepeatCount = ARGV[argvIndex + 10]
    local scheduledMessageEffectiveScheduledDelay = ARGV[argvIndex + 11]

    -- Extract keys for the current message
    local keyMessage = KEYS[keyIndex]
    local keyScheduledMessage = KEYS[keyIndex + 1]
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    -- Case 1: A simple scheduled message is due. Move it to the pending queue.
    if newMessageId == '' then
        if queueType == EQueuePropertyQueueTypeFIFOQueue then
            redis.call("LPUSH", keyQueuePending, scheduledMessageId)
        elseif queueType == EQueuePropertyQueueTypeLIFOQueue then
            redis.call("RPUSH", keyQueuePending, scheduledMessageId)
        else -- Priority queue
            redis.call("ZADD", keyQueuePriorityPending, newMessagePriority, scheduledMessageId)
        end
        redis.call("ZREM", keyQueueScheduled, scheduledMessageId)
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyPendingMessagesCount, 1)
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyScheduledMessagesCount, -1)

        -- Update all relevant properties for the scheduled message
        redis.call(
                "HSET", keyScheduledMessage,
                EMessagePropertyPublishedAt, scheduledMessagePublishedAt,
                EMessagePropertyStatus, EMessagePropertyStatusPending,
                EMessagePropertyLastScheduledAt, scheduledMessageLastScheduledAt,
                EMessagePropertyScheduledTimes, scheduledMessageScheduledTimes,
                EMessagePropertyScheduledCronFired, scheduledMessageCronFired,
                EMessagePropertyScheduledRepeatCount, scheduledMessageRepeatCount,
                EMessagePropertyEffectiveScheduledDelay, scheduledMessageEffectiveScheduledDelay
        )
        processed_count = processed_count + 1
    else
        -- Case 2: A repeating message is due. Publish a new message and reschedule the original.
        if scheduledMessageNextScheduleTimestamp == "0" then
            -- This is the last repetition, so we don't reschedule.
            -- We just remove it from the scheduled set.
            redis.call("ZREM", keyQueueScheduled, scheduledMessageId)
        else
            -- Reschedule the original message for its next occurrence
            redis.call("ZADD", keyQueueScheduled, scheduledMessageNextScheduleTimestamp, scheduledMessageId)
        end

        -- Update all relevant properties for the original scheduled message
        redis.call(
                "HSET", keyScheduledMessage,
                EMessagePropertyLastScheduledAt, scheduledMessageLastScheduledAt,
                EMessagePropertyScheduledTimes, scheduledMessageScheduledTimes,
                EMessagePropertyScheduledCronFired, scheduledMessageCronFired,
                EMessagePropertyScheduledRepeatCount, scheduledMessageRepeatCount,
                EMessagePropertyEffectiveScheduledDelay, scheduledMessageEffectiveScheduledDelay
        )

        -- Publishing the new message
        -- The order of keys must exactly match the 'publish-message.lua' script.
        local pKeys = {
            keyQueueProperties,
            keyQueuePriorityPending,
            keyQueuePending,
            keyQueueScheduled,
            keyQueueMessages,
            keyMessage
        }
        -- The order of arguments must exactly match the 'publish-message.lua' script.
        local pArgs = {
            -- Queue properties (1-7)
            EQueuePropertyQueueType, EQueuePropertyMessagesCount, EQueuePropertyPendingMessagesCount, EQueuePropertyScheduledMessagesCount, EQueuePropertyQueueTypePriorityQueue, EQueuePropertyQueueTypeLIFOQueue, EQueuePropertyQueueTypeFIFOQueue,
            -- Message priority and scheduling (8-11)
            newMessagePriority, '', EMessagePropertyStatusScheduled, EMessagePropertyStatusPending,
            -- Message Property Keys (12-34, 23 keys)
            EMessagePropertyId, EMessagePropertyStatus, EMessagePropertyMessage, EMessagePropertyScheduledAt, EMessagePropertyPublishedAt, EMessagePropertyProcessingStartedAt, EMessagePropertyDeadLetteredAt, EMessagePropertyAcknowledgedAt, EMessagePropertyUnacknowledgedAt, EMessagePropertyLastUnacknowledgedAt, EMessagePropertyLastScheduledAt, EMessagePropertyRequeuedAt, EMessagePropertyRequeueCount, EMessagePropertyLastRequeuedAt, EMessagePropertyLastRetriedAttemptAt, EMessagePropertyScheduledCronFired, EMessagePropertyAttempts, EMessagePropertyScheduledRepeatCount, EMessagePropertyExpired, EMessagePropertyEffectiveScheduledDelay, EMessagePropertyScheduledTimes, EMessagePropertyScheduledMessageParentId, EMessagePropertyRequeuedMessageParentId,
            -- Message Property Values (35-57, 23 values)
            newMessageId, EMessagePropertyStatusPending, newMessage, '', newMessagePublishedAt, '', '', '', '', '', '', '', '0', '', '', '0', '0', '0', '0', '0', '0', scheduledMessageId, ''
        }
        -- Publish the new message by calling the shared publish_message function
        local result = publish_message(pKeys, pArgs)
        if result ~= 'OK' then
            return 'PUBLISH_ERROR:' .. newMessageId .. ':' .. result
        end
        processed_count = processed_count + 1
    end
end

return processed_count
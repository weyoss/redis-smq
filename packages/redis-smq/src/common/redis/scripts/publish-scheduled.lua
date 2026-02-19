--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Publishes due scheduled messages for a SINGLE queue. This script handles two cases:
-- 1. Simple scheduled message: The message is moved to the pending queue. If the target consumer group is gone, it is moved to the dead-letter queue.
-- 2. Repeating scheduled message: A new message is created and published. If the target consumer group is gone, the original repeating message is dead-lettered to terminate its cycle, and the new message for the current firing is discarded.
--
-- This script depends on 'shared-procedures/publish-message.lua'.
-- The content of 'shared-procedures/publish-message.lua' must be prepended to this script before loading it into Redis.
--
-- KEYS:
--   Static Keys (1-7):
--     KEYS[1]: keyQueueProperties
--     KEYS[2]: keyQueuePending
--     KEYS[3]: keyQueueMessages
--     KEYS[4]: keyQueuePriorityPending
--     KEYS[5]: keyQueueScheduled
--     KEYS[6]: keyQueueDeadLettered
--     KEYS[7]: keyQueueConsumerGroups
--   Dynamic Keys (8...): A repeating pair for each message.
--     - keyMessage (for the new message, or an empty placeholder)
--     - keyScheduledMessage (for the original message)
--
-- ARGV:
--   ARGV[1-40]: A list of all EQueueProperty and EMessageProperty constants.
--   ARGV[41...]: A flat list of repeating parameters for each message.
--
-- ARGV structure per message (14 parameters):
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
--   13. consumerGroupId
--   14. messageDeadLetteredAt
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
local keyQueueDeadLettered = KEYS[6]
local keyQueueConsumerGroups = KEYS[7]

-- Queue Property Constants (ARGV[1-14])
local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyMessagesCount = ARGV[2]
local EQueuePropertyPendingMessagesCount = ARGV[3]
local EQueuePropertyScheduledMessagesCount = ARGV[4]
local EQueuePropertyDeadLetteredMessagesCount = ARGV[5]
local EQueuePropertyQueueTypePriorityQueue = ARGV[6]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[7]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[8]
local EQueuePropertyOperationalState = ARGV[9]   -- New: Operational state field
local EQueuePropertyLockId = ARGV[10]            -- New: Lock ID field
local EQueueOperationalStateActive = ARGV[11]    -- New: ACTIVE state value
local EQueueOperationalStatePaused = ARGV[12]    -- New: PAUSED state value
local EQueueOperationalStateStopped = ARGV[13]   -- New: STOPPED state value
local EQueueOperationalStateLocked = ARGV[14]    -- New: LOCKED state value

-- Message Status Constants (ARGV[15-17])
local EMessagePropertyStatusPending = ARGV[15]
local EMessagePropertyStatusScheduled = ARGV[16]
local EMessagePropertyStatusDeadLettered = ARGV[17]

-- Message Property Constants (ARGV[18-40])
local EMessagePropertyId = ARGV[18]
local EMessagePropertyStatus = ARGV[19]
local EMessagePropertyMessage = ARGV[20]
local EMessagePropertyScheduledAt = ARGV[21]
local EMessagePropertyPublishedAt = ARGV[22]
local EMessagePropertyProcessingStartedAt = ARGV[23]
local EMessagePropertyDeadLetteredAt = ARGV[24]
local EMessagePropertyAcknowledgedAt = ARGV[25]
local EMessagePropertyUnacknowledgedAt = ARGV[26]
local EMessagePropertyLastUnacknowledgedAt = ARGV[27]
local EMessagePropertyLastScheduledAt = ARGV[28]
local EMessagePropertyRequeuedAt = ARGV[29]
local EMessagePropertyRequeueCount = ARGV[30]
local EMessagePropertyLastRequeuedAt = ARGV[31]
local EMessagePropertyLastRetriedAttemptAt = ARGV[32]
local EMessagePropertyScheduledCronFired = ARGV[33]
local EMessagePropertyAttempts = ARGV[34]
local EMessagePropertyScheduledRepeatCount = ARGV[35]
local EMessagePropertyExpired = ARGV[36]
local EMessagePropertyEffectiveScheduledDelay = ARGV[37]
local EMessagePropertyScheduledTimes = ARGV[38]
local EMessagePropertyScheduledMessageParentId = ARGV[39]
local EMessagePropertyRequeuedMessageParentId = ARGV[40]

-- Check queue operational state
local queueProps = redis.call("HMGET", keyQueueProperties,
        EQueuePropertyQueueType,
        EQueuePropertyOperationalState)

local queueType = queueProps[1]
local operationalState = queueProps[2]

-- Early exit if the queue does not exist. This check is now done only once per batch.
if queueType == false then
    return 0
end

if operationalState == false then
    -- Default to ACTIVE if operational state is not set
    operationalState = EQueueOperationalStateActive
end

-- Validate queue state for scheduled message processing
if operationalState == EQueueOperationalStateStopped then
    -- Queue is completely stopped, no processing allowed
    return 0
elseif operationalState == EQueueOperationalStateLocked then
    -- Queue is locked, scheduled messages cannot be processed
    return 0
elseif operationalState == EQueueOperationalStatePaused then
    -- Queue is paused, scheduled messages can be moved to pending but won't be consumed
    -- This is allowed, so continue
elseif operationalState == EQueueOperationalStateActive then
    -- Queue is active, scheduled messages can be processed
    -- This is allowed, so continue
else
    -- Unknown state, skip processing as a safety measure
    return 0
end

-- Loop constants
local INITIAL_ARGV_OFFSET = 40
local INITIAL_KEY_OFFSET = 7
local PARAMS_PER_MESSAGE = 14
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
    local consumerGroupId = ARGV[argvIndex + 12]
    local messageDeadLetteredAt = ARGV[argvIndex + 13]

    -- Extract keys for the current message
    local keyMessage = KEYS[keyIndex]
    local keyScheduledMessage = KEYS[keyIndex + 1]
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    local group_exists = true
    if consumerGroupId and consumerGroupId ~= '' then
        if redis.call("SISMEMBER", keyQueueConsumerGroups, consumerGroupId) == 0 then
            group_exists = false
        end
    end

    -- Case 1: A simple scheduled message is due. Move it to the pending queue.
    if newMessageId == '' then
        -- Always remove from scheduled queue first
        if redis.call("ZREM", keyQueueScheduled, scheduledMessageId) == 1 then
            redis.call("HINCRBY", keyQueueProperties, EQueuePropertyScheduledMessagesCount, -1)

            if group_exists then
                if queueType == EQueuePropertyQueueTypeFIFOQueue then
                    redis.call("LPUSH", keyQueuePending, scheduledMessageId)
                elseif queueType == EQueuePropertyQueueTypeLIFOQueue then
                    redis.call("RPUSH", keyQueuePending, scheduledMessageId)
                else -- Priority queue
                    redis.call("ZADD", keyQueuePriorityPending, newMessagePriority, scheduledMessageId)
                end
                redis.call("HINCRBY", keyQueueProperties, EQueuePropertyPendingMessagesCount, 1)

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
            else
                -- Group does not exist, dead-letter the message
                redis.call("RPUSH", keyQueueDeadLettered, scheduledMessageId)
                redis.call("HINCRBY", keyQueueProperties, EQueuePropertyDeadLetteredMessagesCount, 1)
                redis.call(
                        "HSET", keyScheduledMessage,
                        EMessagePropertyStatus, EMessagePropertyStatusDeadLettered,
                        EMessagePropertyDeadLetteredAt, messageDeadLetteredAt
                )
            end
            processed_count = processed_count + 1
        end
    else
        -- Case 2: A repeating message is due.
        if group_exists then
            -- Group exists: Publish a new message and reschedule the original.

            -- Reschedule the original message for its next occurrence
            redis.call("ZADD", keyQueueScheduled, scheduledMessageNextScheduleTimestamp, scheduledMessageId)

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
            local pKeys = {
                keyQueueProperties,
                keyQueuePriorityPending,
                keyQueuePending,
                keyQueueScheduled,
                keyQueueMessages,
                keyQueueConsumerGroups,
                keyMessage
            }
            local pArgs = {
                -- Queue properties and state values (13 values: ARGV[1-13])
                EQueuePropertyQueueType,
                EQueuePropertyMessagesCount,
                EQueuePropertyPendingMessagesCount,
                EQueuePropertyScheduledMessagesCount,
                EQueuePropertyQueueTypePriorityQueue,
                EQueuePropertyQueueTypeLIFOQueue,
                EQueuePropertyQueueTypeFIFOQueue,
                EQueuePropertyOperationalState,
                EQueuePropertyLockId,
                EQueueOperationalStateActive,
                EQueueOperationalStatePaused,
                EQueueOperationalStateStopped,
                EQueueOperationalStateLocked,

                -- Message priority and scheduling values (4 values: ARGV[14-17])
                newMessagePriority,
                '',  -- scheduledTimestamp (empty - message is pending, not scheduled)
                EMessagePropertyStatusScheduled,
                EMessagePropertyStatusPending,

                -- Message Property Keys (23 keys: ARGV[18-40])
                EMessagePropertyId,
                EMessagePropertyStatus,
                EMessagePropertyMessage,
                EMessagePropertyScheduledAt,
                EMessagePropertyPublishedAt,
                EMessagePropertyProcessingStartedAt,
                EMessagePropertyDeadLetteredAt,
                EMessagePropertyAcknowledgedAt,
                EMessagePropertyUnacknowledgedAt,
                EMessagePropertyLastUnacknowledgedAt,
                EMessagePropertyLastScheduledAt,
                EMessagePropertyRequeuedAt,
                EMessagePropertyRequeueCount,
                EMessagePropertyLastRequeuedAt,
                EMessagePropertyLastRetriedAttemptAt,
                EMessagePropertyScheduledCronFired,
                EMessagePropertyAttempts,
                EMessagePropertyScheduledRepeatCount,
                EMessagePropertyExpired,
                EMessagePropertyEffectiveScheduledDelay,
                EMessagePropertyScheduledTimes,
                EMessagePropertyScheduledMessageParentId,
                EMessagePropertyRequeuedMessageParentId,

                -- Message Property Values (23 values: ARGV[41-63])
                newMessageId,                    -- ID
                EMessagePropertyStatusPending,   -- STATUS
                newMessage,                      -- MESSAGE
                '',                              -- SCHEDULED_AT
                newMessagePublishedAt,           -- PUBLISHED_AT
                '',                              -- PROCESSING_STARTED_AT
                '',                              -- DEAD_LETTERED_AT
                '',                              -- ACKNOWLEDGED_AT
                '',                              -- UNACKNOWLEDGED_AT
                '',                              -- LAST_UNACKNOWLEDGED_AT
                '',                              -- LAST_SCHEDULED_AT
                '',                              -- REQUEUED_AT
                '0',                             -- REQUEUE_COUNT
                '',                              -- LAST_REQUEUED_AT
                '',                              -- LAST_RETRIED_ATTEMPT_AT
                '0',                             -- SCHEDULED_CRON_FIRED
                '0',                             -- ATTEMPTS
                '0',                             -- SCHEDULED_REPEAT_COUNT
                '0',                             -- EXPIRED
                '0',                             -- EFFECTIVE_SCHEDULED_DELAY
                '0',                             -- SCHEDULED_TIMES
                scheduledMessageId,              -- SCHEDULED_MESSAGE_PARENT_ID
                '',                              -- REQUEUED_MESSAGE_PARENT_ID

                -- Consumer Group ID (ARGV[64])
                consumerGroupId,

                -- Operation Lock ID (ARGV[65]) - empty for scheduled message processing
                ''
            }
            local result = publish_message(pKeys, pArgs)
            if result ~= 'OK' then
                return 'PUBLISH_ERROR:' .. newMessageId .. ':' .. result
            end
        else
            -- Group does not exist. Dead-letter the original repeating message to stop its cycle.
            -- The new message for this firing is simply discarded.
            if redis.call("ZREM", keyQueueScheduled, scheduledMessageId) == 1 then
                redis.call("RPUSH", keyQueueDeadLettered, scheduledMessageId)
                redis.call(
                        "HSET", keyScheduledMessage,
                        EMessagePropertyStatus, EMessagePropertyStatusDeadLettered,
                        EMessagePropertyDeadLetteredAt, messageDeadLetteredAt
                )
                redis.call("HINCRBY", keyQueueProperties, EQueuePropertyScheduledMessagesCount, -1)
                redis.call("HINCRBY", keyQueueProperties, EQueuePropertyDeadLetteredMessagesCount, 1)
            end
        end
        processed_count = processed_count + 1
    end
end

return processed_count
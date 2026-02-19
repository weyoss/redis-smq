--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Re-queues a message by creating a new message based on the original one.
-- The original message is updated to track requeue history:
--   - REQUEUED_AT: Set only on the first requeue.
--   - REQUEUE_COUNT: Incremented on each requeue.
--   - LAST_REQUEUED_AT: Updated on each requeue.
-- The new message is published to the pending queue by calling the 'publish_message' shared procedure.
-- If the target consumer group for a message does not exist, the message is not re-queued.
--
-- This script depends on 'shared-procedures/publish-message.lua'.
-- The content of 'shared-procedures/publish-message.lua' must be prepended to this script before loading it into Redis.
--
-- KEYS:
--   Static Keys (1-6):
--     KEYS[1]: keyQueueProperties
--     KEYS[2]: keyQueuePriorityPending
--     KEYS[3]: keyQueuePending
--     KEYS[4]: keyQueueMessages
--     KEYS[5]: keyQueueScheduled
--     KEYS[6]: keyQueueConsumerGroups
--   Dynamic Keys (7...): A repeating pair for each message being requeued.
--     - keyOriginalMessage
--     - keyNewMessage
--
-- ARGV:
--   ARGV[1-40]: A list of all EQueueProperty and EMessageProperty constants.
--   ARGV[41]: operationLockId  -- SINGLE lock ID for the entire batch
--   ARGV[42...]: A flat list of repeating parameters for each message being requeued.
--
-- ARGV structure:
--   - ARGV[1-40]: Constants (13 queue + 3 status + 24 message = 40)
--   - ARGV[41]: operationLockId (single parameter for entire batch)
--   - Then for each message (7 parameters):
--       1. newChildMessageId
--       2. newChildMessage (JSON)
--       3. newChildMessagePriority
--       4. newChildMessagePublishedAt
--       5. requeuedAt (timestamp for the first requeue)
--       6. lastRequeuedAt (timestamp for the last requeue)
--       7. consumerGroupId
--
-- Returns:
--   - A string with a detailed error message if the operation fails for any message.
--   - The number of successfully re-queued messages.

-- Static Keys
local keyQueueProperties = KEYS[1]
local keyQueuePriorityPending = KEYS[2]
local keyQueuePending = KEYS[3]
local keyQueueMessages = KEYS[4]
local keyQueueScheduled = KEYS[5]
local keyQueueConsumerGroups = KEYS[6]

-- Performance Optimization: Check if the queue exists ONCE before processing the batch.
if redis.call("EXISTS", keyQueueProperties) == 0 then
    return 0 -- Not an error, just nothing to do if the queue is gone.
end

-- Queue Property Constants (ARGV[1-13])
local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyMessagesCount = ARGV[2]
local EQueuePropertyPendingMessagesCount = ARGV[3]
local EQueuePropertyScheduledMessagesCount = ARGV[4]
local EQueuePropertyQueueTypePriorityQueue = ARGV[5]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[6]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[7]
local EQueuePropertyOperationalState = ARGV[8]   -- Operational state field
local EQueuePropertyLockId = ARGV[9]            -- Lock ID field
local EQueueOperationalStateActive = ARGV[10]    -- ACTIVE state value
local EQueueOperationalStatePaused = ARGV[11]    -- PAUSED state value
local EQueueOperationalStateStopped = ARGV[12]   -- STOPPED state value
local EQueueOperationalStateLocked = ARGV[13]    -- LOCKED state value

-- Message Status Constants (ARGV[14-16])
local EMessagePropertyStatusScheduled = ARGV[14]  -- Reordered to match publish_message
local EMessagePropertyStatusPending = ARGV[15]
local EMessagePropertyStatus = ARGV[16]           -- Generic status field

-- Message Property Constants (ARGV[17-40]) - 24 keys total
local EMessagePropertyId = ARGV[17]
local EMessagePropertyStatus_field = ARGV[18]     -- Renamed to avoid conflict with status constant
local EMessagePropertyMessage = ARGV[19]
local EMessagePropertyScheduledAt = ARGV[20]
local EMessagePropertyPublishedAt = ARGV[21]
local EMessagePropertyProcessingStartedAt = ARGV[22]
local EMessagePropertyDeadLetteredAt = ARGV[23]
local EMessagePropertyAcknowledgedAt = ARGV[24]
local EMessagePropertyUnacknowledgedAt = ARGV[25]
local EMessagePropertyLastUnacknowledgedAt = ARGV[26]
local EMessagePropertyLastScheduledAt = ARGV[27]
local EMessagePropertyRequeuedAt = ARGV[28]
local EMessagePropertyRequeueCount = ARGV[29]
local EMessagePropertyLastRequeuedAt = ARGV[30]
local EMessagePropertyLastRetriedAttemptAt = ARGV[31]
local EMessagePropertyScheduledCronFired = ARGV[32]
local EMessagePropertyAttempts = ARGV[33]
local EMessagePropertyScheduledRepeatCount = ARGV[34]
local EMessagePropertyExpired = ARGV[35]
local EMessagePropertyEffectiveScheduledDelay = ARGV[36]
local EMessagePropertyScheduledTimes = ARGV[37]
local EMessagePropertyScheduledMessageParentId = ARGV[38]
local EMessagePropertyRequeuedMessageParentId = ARGV[39]
-- Note: ARGV[40] is not used in this script (was DEAD_LETTERED_MESSAGES_COUNT in publish-scheduled)
-- but we need to account for it in the offset

-- Get the operation lock ID (single parameter for entire batch)
local operationLockId = ARGV[41] or ''

-- Loop constants
local INITIAL_ARGV_OFFSET = 41  -- Updated from 39 (constants up to 40 + 1 for operationLockId)
local INITIAL_KEY_OFFSET = 6
local PARAMS_PER_MESSAGE = 7
local KEYS_PER_MESSAGE = 2
local keyIndex = INITIAL_KEY_OFFSET + 1
local requeuedCount = 0

for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    -- Extract message-specific ARGV
    local newChildMessageId = ARGV[argvIndex]
    local newChildMessage = ARGV[argvIndex + 1]
    local newChildMessagePriority = ARGV[argvIndex + 2]
    local newChildMessagePublishedAt = ARGV[argvIndex + 3]
    local requeuedAt = ARGV[argvIndex + 4]
    local lastRequeuedAt = ARGV[argvIndex + 5]
    local consumerGroupId = ARGV[argvIndex + 6]

    -- Extract message-specific KEYS
    local keyOriginalMessage = KEYS[keyIndex]
    local keyNewMessage = KEYS[keyIndex + 1]
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    -- Fetch original message ID. Only proceed if the original message exists.
    local originalMessageId = redis.call("HGET", keyOriginalMessage, EMessagePropertyId)
    if originalMessageId then
        local group_exists = true
        if consumerGroupId and consumerGroupId ~= '' then
            if redis.call("SISMEMBER", keyQueueConsumerGroups, consumerGroupId) == 0 then
                group_exists = false
            end
        end

        if group_exists then
            -- CRITICAL: Try to publish the new message FIRST (validates ALL queue states)
            -- Only if this succeeds, update the original message
            local pKeys = {
                keyQueueProperties,
                keyQueuePriorityPending,
                keyQueuePending,
                keyQueueScheduled,
                keyQueueMessages,
                keyQueueConsumerGroups,
                keyNewMessage
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
                newChildMessagePriority,
                '',  -- scheduledTimestamp (empty - message is pending, not scheduled)
                EMessagePropertyStatusScheduled,
                EMessagePropertyStatusPending,

                -- Message Property Keys (23 keys: ARGV[18-40])
                EMessagePropertyId,
                EMessagePropertyStatus_field,    -- STATUS field key
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
                newChildMessageId,                -- ID
                EMessagePropertyStatusPending,    -- STATUS
                newChildMessage,                 -- MESSAGE
                '',                              -- SCHEDULED_AT
                newChildMessagePublishedAt,      -- PUBLISHED_AT
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
                '',                              -- SCHEDULED_MESSAGE_PARENT_ID
                originalMessageId,               -- REQUEUED_MESSAGE_PARENT_ID

                -- Consumer Group ID (ARGV[64])
                consumerGroupId,

                -- Operation Lock ID (ARGV[65]) - use the batch-level operationLockId
                operationLockId
            }
            local result = publish_message(pKeys, pArgs)
            if result ~= 'OK' then
                -- If the publish script fails (e.g., queue is STOPPED, LOCKED with wrong ID, etc.),
                -- stop immediately and return a detailed error.
                -- No changes have been made to the original message yet, so state is consistent.
                return 'REQUEUE_ERROR:' .. originalMessageId .. ':' .. result
            end

            -- Only AFTER successful publication, update the original message with requeue history
            redis.call(
                    "HSET", keyOriginalMessage,
                    EMessagePropertyRequeuedAt, requeuedAt,
                    EMessagePropertyLastRequeuedAt, lastRequeuedAt
            )
            redis.call("HINCRBY", keyOriginalMessage, EMessagePropertyRequeueCount, 1)

            requeuedCount = requeuedCount + 1
        end
        -- If group does not exist, we do nothing and the loop continues to the next message.
    end
end

return requeuedCount
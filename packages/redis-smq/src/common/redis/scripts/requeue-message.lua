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
--     KEYS[4]: keyQueuePublished
--     KEYS[5]: keyQueueScheduled
--     KEYS[6]: keyQueueConsumerGroups
--   Dynamic Keys (7...): A repeating pair for each message being requeued.
--     - keyOriginalMessage
--     - keyNewMessage
--
-- ARGV:
--   ARGV[1-39]: A list of all EQueueProperty, EMessagePropertyStatus, and EMessageProperty constants.
--   ARGV[40]: operationLockId  -- SINGLE lock ID for the entire batch
--   ARGV[41...]: A flat list of repeating parameters for each message being requeued.
--
-- ARGV structure:
--   - ARGV[1-13]: Queue property constants (13 values)
--   - ARGV[14-15]: Message status constants (2 values)
--   - ARGV[16-39]: Message property keys (24 values)
--   - ARGV[40]: operationLockId (single parameter for entire batch)
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
local keyQueuePublished = KEYS[4]
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
local EQueuePropertyOperationalState = ARGV[8]
local EQueuePropertyLockId = ARGV[9]
local EQueueOperationalStateActive = ARGV[10]
local EQueueOperationalStatePaused = ARGV[11]
local EQueueOperationalStateStopped = ARGV[12]
local EQueueOperationalStateLocked = ARGV[13]

-- Message Status Constants (ARGV[14-15])
local EMessagePropertyStatusScheduled = ARGV[14]
local EMessagePropertyStatusPending = ARGV[15]

-- Message Property Constants (ARGV[16-39]) - 24 keys total
local EMessagePropertyId = ARGV[16]
local EMessagePropertyStatus = ARGV[17]
local EMessagePropertyMessage = ARGV[18]
local EMessagePropertyScheduledAt = ARGV[19]
local EMessagePropertyPublishedAt = ARGV[20]
local EMessagePropertyProcessingStartedAt = ARGV[21]
local EMessagePropertyDeadLetteredAt = ARGV[22]
local EMessagePropertyAcknowledgedAt = ARGV[23]
local EMessagePropertyUnacknowledgedAt = ARGV[24]
local EMessagePropertyLastUnacknowledgedAt = ARGV[25]
local EMessagePropertyLastScheduledAt = ARGV[26]
local EMessagePropertyRequeuedAt = ARGV[27]
local EMessagePropertyRequeueCount = ARGV[28]
local EMessagePropertyLastRequeuedAt = ARGV[29]
local EMessagePropertyLastRetriedAttemptAt = ARGV[30]
local EMessagePropertyScheduledCronFired = ARGV[31]
local EMessagePropertyAttempts = ARGV[32]
local EMessagePropertyScheduledRepeatCount = ARGV[33]
local EMessagePropertyExpired = ARGV[34]
local EMessagePropertyEffectiveScheduledDelay = ARGV[35]
local EMessagePropertyScheduledTimes = ARGV[36]
local EMessagePropertyScheduledMessageParentId = ARGV[37]
local EMessagePropertyRequeuedMessageParentId = ARGV[38]
local EMessagePropertyLastProcessedAt = ARGV[39]

-- Get the operation lock ID (single parameter for entire batch)
local operationLockId = ARGV[40] or ''

-- Loop constants
local INITIAL_ARGV_OFFSET = 40
local INITIAL_KEY_OFFSET = 6
local PARAMS_PER_MESSAGE = 7
local KEYS_PER_MESSAGE = 2
local keyIndex = INITIAL_KEY_OFFSET + 1
local requeuedCount = 0

for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    -- Extract message-specific KEYS
    local keyOriginalMessage = KEYS[keyIndex]
    local keyNewMessage = KEYS[keyIndex + 1]
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    -- Extract message-specific ARGV
    local newChildMessageId = ARGV[argvIndex]
    local newChildMessage = ARGV[argvIndex + 1]
    local newChildMessagePriority = ARGV[argvIndex + 2]
    local newChildMessagePublishedAt = ARGV[argvIndex + 3]
    local requeuedAt = ARGV[argvIndex + 4]
    local lastRequeuedAt = ARGV[argvIndex + 5]
    local consumerGroupId = ARGV[argvIndex + 6]

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
                keyQueuePublished,
                keyQueueConsumerGroups,
                keyNewMessage
            }
            local pArgs = {
                -- Queue properties (ARGV[1-13])
                EQueuePropertyQueueType,                    -- ARGV[1]
                EQueuePropertyMessagesCount,                -- ARGV[2]
                EQueuePropertyPendingMessagesCount,         -- ARGV[3]
                EQueuePropertyScheduledMessagesCount,       -- ARGV[4]
                EQueuePropertyQueueTypePriorityQueue,       -- ARGV[5]
                EQueuePropertyQueueTypeLIFOQueue,           -- ARGV[6]
                EQueuePropertyQueueTypeFIFOQueue,           -- ARGV[7]
                EQueuePropertyOperationalState,             -- ARGV[8]
                EQueuePropertyLockId,                       -- ARGV[9]
                EQueueOperationalStateActive,               -- ARGV[10]
                EQueueOperationalStatePaused,               -- ARGV[11]
                EQueueOperationalStateStopped,              -- ARGV[12]
                EQueueOperationalStateLocked,               -- ARGV[13]

                -- Message priority and scheduling (ARGV[14-17])
                newChildMessagePriority,                    -- ARGV[14]
                '',                                         -- ARGV[15] (scheduledTimestamp - empty for pending)
                EMessagePropertyStatusScheduled,            -- ARGV[16]
                EMessagePropertyStatusPending,              -- ARGV[17]

                -- Message Property Keys (ARGV[18-41])
                EMessagePropertyId,                         -- ARGV[18]
                EMessagePropertyStatus,                     -- ARGV[19]
                EMessagePropertyMessage,                    -- ARGV[20]
                EMessagePropertyScheduledAt,                -- ARGV[21]
                EMessagePropertyPublishedAt,                -- ARGV[22]
                EMessagePropertyProcessingStartedAt,        -- ARGV[23]
                EMessagePropertyDeadLetteredAt,             -- ARGV[24]
                EMessagePropertyAcknowledgedAt,             -- ARGV[25]
                EMessagePropertyUnacknowledgedAt,           -- ARGV[26]
                EMessagePropertyLastUnacknowledgedAt,       -- ARGV[27]
                EMessagePropertyLastScheduledAt,            -- ARGV[28]
                EMessagePropertyRequeuedAt,                 -- ARGV[29]
                EMessagePropertyRequeueCount,               -- ARGV[30]
                EMessagePropertyLastRequeuedAt,             -- ARGV[31]
                EMessagePropertyLastRetriedAttemptAt,       -- ARGV[32]
                EMessagePropertyScheduledCronFired,         -- ARGV[33]
                EMessagePropertyAttempts,                   -- ARGV[34]
                EMessagePropertyScheduledRepeatCount,       -- ARGV[35]
                EMessagePropertyExpired,                    -- ARGV[36]
                EMessagePropertyEffectiveScheduledDelay,    -- ARGV[37]
                EMessagePropertyScheduledTimes,             -- ARGV[38]
                EMessagePropertyScheduledMessageParentId,   -- ARGV[39]
                EMessagePropertyRequeuedMessageParentId,    -- ARGV[40]
                EMessagePropertyLastProcessedAt,            -- ARGV[41]

                -- Message Property Values (ARGV[42-65])
                newChildMessageId,                          -- ARGV[42]
                EMessagePropertyStatusPending,              -- ARGV[43] (messageStatus)
                newChildMessage,                            -- ARGV[44] (message)
                '',                                         -- ARGV[45] (messageScheduledAt)
                newChildMessagePublishedAt,                 -- ARGV[46] (messagePublishedAt)
                '',                                         -- ARGV[47] (messageProcessingStartedAt)
                '',                                         -- ARGV[48] (messageDeadLetteredAt)
                '',                                         -- ARGV[49] (messageAcknowledgedAt)
                '',                                         -- ARGV[50] (messageUnacknowledgedAt)
                '',                                         -- ARGV[51] (messageLastUnacknowledgedAt)
                '',                                         -- ARGV[52] (messageLastScheduledAt)
                '',                                         -- ARGV[53] (messageRequeuedAt)
                '0',                                        -- ARGV[54] (messageRequeueCount)
                '',                                         -- ARGV[55] (messageLastRequeuedAt)
                '',                                         -- ARGV[56] (messageLastRetriedAttemptAt)
                '0',                                        -- ARGV[57] (messageScheduledCronFired)
                '0',                                        -- ARGV[58] (messageAttempts)
                '0',                                        -- ARGV[59] (messageScheduledRepeatCount)
                '0',                                        -- ARGV[60] (messageExpired)
                '0',                                        -- ARGV[61] (messageEffectiveScheduledDelay)
                '0',                                        -- ARGV[62] (messageScheduledTimes)
                '',                                         -- ARGV[63] (messageScheduledMessageParentId)
                originalMessageId,                          -- ARGV[64] (messageRequeuedMessageParentId)
                '',                                         -- ARGV[65] (messageLastProcessedAt)

                -- Consumer Group ID (ARGV[66])
                consumerGroupId,                            -- ARGV[66]

                -- Operation Lock ID (ARGV[67])
                operationLockId                             -- ARGV[67]
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
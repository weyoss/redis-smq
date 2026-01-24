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
--   ARGV[1-32]: A list of all EQueueProperty and EMessageProperty constants.
--   ARGV[33...]: A flat list of repeating parameters for each message being requeued.
--
-- ARGV structure per message (7 parameters):
--   1. newChildMessageId
--   2. newChildMessage (JSON)
--   3. newChildMessagePriority
--   4. newChildMessagePublishedAt
--   5. requeuedAt (timestamp for the first requeue)
--   6. lastRequeuedAt (timestamp for the last requeue)
--   7. consumerGroupId
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

-- Queue Property Constants
local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyMessagesCount = ARGV[2]
local EQueuePropertyPendingMessagesCount = ARGV[3]
local EQueuePropertyScheduledMessagesCount = ARGV[4]
local EQueuePropertyQueueTypePriorityQueue = ARGV[5]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[6]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[7]

-- Message Status Constants
local EMessagePropertyStatus = ARGV[8]
local EMessagePropertyStatusPending = ARGV[9]
local EMessagePropertyStatusScheduled = ARGV[10]

-- Message Property Constants
local EMessagePropertyId = ARGV[11]
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
            -- Update the original message with requeue history
            redis.call(
                "HSET", keyOriginalMessage,
                EMessagePropertyRequeuedAt, requeuedAt,
                EMessagePropertyLastRequeuedAt, lastRequeuedAt
            )
            redis.call("HINCRBY", keyOriginalMessage, EMessagePropertyRequeueCount, 1)

            -- Publish the new message by calling the publish_message shared procedure.
            local pKeys = {
                keyQueueProperties,
                keyQueuePriorityPending,
                keyQueuePending,
                keyQueueScheduled,
                keyQueueMessages,
                keyQueueConsumerGroups,
                keyNewMessage
            }
            -- The order of arguments must exactly match the 'publish-message.lua' script.
            local pArgs = {
                -- Queue properties (1-7)
                EQueuePropertyQueueType, EQueuePropertyMessagesCount, EQueuePropertyPendingMessagesCount, EQueuePropertyScheduledMessagesCount, EQueuePropertyQueueTypePriorityQueue, EQueuePropertyQueueTypeLIFOQueue, EQueuePropertyQueueTypeFIFOQueue,
                -- Message priority and scheduling (8-11)
                newChildMessagePriority, '', EMessagePropertyStatusScheduled, EMessagePropertyStatusPending,
                -- Message Property Keys (12-34, 23 keys)
                EMessagePropertyId, EMessagePropertyStatus, EMessagePropertyMessage, EMessagePropertyScheduledAt, EMessagePropertyPublishedAt, EMessagePropertyProcessingStartedAt, EMessagePropertyDeadLetteredAt, EMessagePropertyAcknowledgedAt, EMessagePropertyUnacknowledgedAt, EMessagePropertyLastUnacknowledgedAt, EMessagePropertyLastScheduledAt, EMessagePropertyRequeuedAt, EMessagePropertyRequeueCount, EMessagePropertyLastRequeuedAt, EMessagePropertyLastRetriedAttemptAt, EMessagePropertyScheduledCronFired, EMessagePropertyAttempts, EMessagePropertyScheduledRepeatCount, EMessagePropertyExpired, EMessagePropertyEffectiveScheduledDelay, EMessagePropertyScheduledTimes, EMessagePropertyScheduledMessageParentId, EMessagePropertyRequeuedMessageParentId,
                -- Message Property Values (35-57, 23 values)
                newChildMessageId, EMessagePropertyStatusPending, newChildMessage, '', newChildMessagePublishedAt, '', '', '', '', '', '', '', '0', '', '', '0', '0', '0', '0', '0', '0', '', originalMessageId,
                -- Consumer Group ID (58)
                consumerGroupId
            }
            local result = publish_message(pKeys, pArgs)
            if result ~= 'OK' then
                -- If the publish script fails, stop immediately and return a detailed error.
                -- This prevents leaving the system in an inconsistent state where the original
                -- message is marked as re-queued but the new message was never published.
                return 'REQUEUE_ERROR:' .. originalMessageId .. ':' .. result
            end
            requeuedCount = requeuedCount + 1
        end
        -- If group does not exist, we do nothing and the loop continues to the next message.
    end
end

return requeuedCount
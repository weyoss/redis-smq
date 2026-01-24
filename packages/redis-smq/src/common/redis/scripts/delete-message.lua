--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Deletes one or more messages from a queue.
-- This script is optimized for batch operations and ensures all queue counters are correctly updated.
--
-- KEYS:
--   Static Keys (1-9): All queue-related keys.
--   Dynamic Keys (10...): A list of message keys (keyMessage) to be deleted.
--
-- ARGV:
--   Static ARGV (1-19): All constants and queue property names.
--   Dynamic ARGV (20...): A list of message IDs to be deleted.
--
-- Returns:
--   A table with counts: {processedCount, successCount, notFoundCount, inProcessCount}

-- Static Keys
local keyQueueProperties = KEYS[1]
local keyQueueMessages = KEYS[2]
local keyQueuePending = KEYS[3]
local keyQueuePriorityPending = KEYS[4]
local keyQueueScheduled = KEYS[5]
local keyQueueAcknowledged = KEYS[6]
local keyQueueDL = KEYS[7]
local keyQueueDelayed = KEYS[8]
local keyQueueRequeued = KEYS[9]

-- Static ARGV (Constants and Queue Property Names)
local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyMessagesCount = ARGV[2]
local EQueuePropertyAcknowledgedMessagesCount = ARGV[3]
local EQueuePropertyDeadLetteredMessagesCount = ARGV[4]
local EQueuePropertyPendingMessagesCount = ARGV[5]
local EQueuePropertyScheduledMessagesCount = ARGV[6]
local EQueuePropertyDelayedMessagesCount = ARGV[7]
local EQueuePropertyRequeuedMessagesCount = ARGV[8]
local EQueueTypePriority = ARGV[9]
local EQueueTypeLIFO = ARGV[10]
local EQueueTypeFIFO = ARGV[11]
local EMessagePropertyStatus = ARGV[12]
local EMessageStatusProcessing = ARGV[13]
local EMessageStatusAcknowledged = ARGV[14]
local EMessageStatusPending = ARGV[15]
local EMessageStatusScheduled = ARGV[16]
local EMessageStatusDeadLettered = ARGV[17]
local EMessageStatusDelayed = ARGV[18]
local EMessageStatusRequeued = ARGV[19]

-- Constants
local INITIAL_KEY_OFFSET = 9
local INITIAL_ARGV_OFFSET = 19
local PARAMS_PER_MESSAGE = 1
local KEYS_PER_MESSAGE = 1

-- Validation
if ((#KEYS - INITIAL_KEY_OFFSET) * PARAMS_PER_MESSAGE) ~= ((#ARGV - INITIAL_ARGV_OFFSET) * KEYS_PER_MESSAGE) then
    return 'INVALID_ARGS_ERROR'
end

-- Counters for tracking results
local processedCount = 0
local successCount = 0
local notFoundCount = 0
local inProcessCount = 0

-- Fetch queue type once before the loop for efficiency
local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)

for i = 1, (#ARGV - INITIAL_ARGV_OFFSET) do
    local keyIndex = INITIAL_KEY_OFFSET + i
    local argvIndex = INITIAL_ARGV_OFFSET + i

    local messageKey = KEYS[keyIndex]
    local messageId = ARGV[argvIndex]

    processedCount = processedCount + 1

    -- Check if message exists and get its status
    local messageStatus = redis.call("HGET", messageKey, EMessagePropertyStatus)
    if messageStatus == false then
        notFoundCount = notFoundCount + 1
    elseif messageStatus == EMessageStatusProcessing then
        inProcessCount = inProcessCount + 1
    else
        local counterToDecrement = nil
        -- Remove from appropriate queue based on status
        if messageStatus == EMessageStatusAcknowledged then
            redis.call("LREM", keyQueueAcknowledged, 1, messageId)
            counterToDecrement = EQueuePropertyAcknowledgedMessagesCount
        elseif messageStatus == EMessageStatusDeadLettered then
            redis.call("LREM", keyQueueDL, 1, messageId)
            counterToDecrement = EQueuePropertyDeadLetteredMessagesCount
        elseif messageStatus == EMessageStatusScheduled then
            redis.call("ZREM", keyQueueScheduled, messageId)
            counterToDecrement = EQueuePropertyScheduledMessagesCount
        elseif messageStatus == EMessageStatusDelayed then
            redis.call("LREM", keyQueueDelayed, 1, messageId)
            counterToDecrement = EQueuePropertyDelayedMessagesCount
        elseif messageStatus == EMessageStatusRequeued then
            redis.call("LREM", keyQueueRequeued, 1, messageId)
            counterToDecrement = EQueuePropertyRequeuedMessagesCount
        elseif messageStatus == EMessageStatusPending then
            if queueType then
                if queueType == EQueueTypePriority then
                    redis.call("ZREM", keyQueuePriorityPending, messageId)
                elseif queueType == EQueueTypeFIFO or queueType == EQueueTypeLIFO then
                    redis.call("LREM", keyQueuePending, 1, messageId)
                end
            end
            counterToDecrement = EQueuePropertyPendingMessagesCount
        end

        -- Delete the message hash
        redis.call("DEL", messageKey)

        -- Remove the message ID from the queue's global message set
        redis.call("SREM", keyQueueMessages, messageId)

        -- Decrement the total message count and the status-specific count
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyMessagesCount, -1)
        if counterToDecrement then
            redis.call("HINCRBY", keyQueueProperties, counterToDecrement, -1)
        end

        successCount = successCount + 1
    end
end

-- Return an array with the results
return {processedCount, successCount, notFoundCount, inProcessCount}
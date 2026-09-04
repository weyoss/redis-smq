--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Deletes one or more messages from a queue, including their unacknowledgement history.
-- This script is optimized for batch operations and ensures all queue counters are correctly updated.
-- Respects queue operational state - requires valid lock ID when queue is LOCKED.
--
-- KEYS:
--   Static Keys (1-9): All queue-related keys.
--   Dynamic Keys (10...): A list of message keys (keyMessage) and history keys (keyMessageHistory) to be deleted.
--
-- ARGV:
--   Static ARGV (1-24): All constants and queue property names.
--   Dynamic ARGV (25...): A list of message IDs to be deleted.
--
-- Returns:
--   A table with counts: {processedCount, successCount, notFoundCount, inProcessCount}
--   Or an error string: 'QUEUE_LOCKED' or 'INVALID_LOCK'

-- Static Keys
local keyQueueProperties = KEYS[1]
local keyQueuePublished = KEYS[2]
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
-- Operational state constants
local EQueuePropertyOperationalState = ARGV[20]
local EQueueOperationalStateLocked = ARGV[21]
local EQueuePropertyLockId = ARGV[22]
local operationLockId = ARGV[23]

-- Loop constants
local INITIAL_KEY_OFFSET = 9
local INITIAL_ARGV_OFFSET = 23
local KEYS_PER_MESSAGE = 2  -- keyMessage and keyMessageHistory
local PARAMS_PER_MESSAGE = 1  -- messageId only

-- Check if queue exists
if redis.call("EXISTS", keyQueueProperties) == 0 then
    return 'QUEUE_NOT_FOUND'
end

-- Check operational state for LOCKED queue
local currentState = redis.call("HGET", keyQueueProperties, EQueuePropertyOperationalState)
local currentLockId = redis.call("HGET", keyQueueProperties, EQueuePropertyLockId)
currentLockId = currentLockId or ''

if currentState == EQueueOperationalStateLocked then
    -- Queue is locked, need valid lock ID to proceed with message deletion
    if not operationLockId or operationLockId == '' then
        return 'QUEUE_LOCKED'
    end

    -- Validate the provided lock ID matches current lock
    if currentLockId == '' or currentLockId ~= operationLockId then
        return 'INVALID_LOCK'
    end
end

-- Validation: Ensure the number of dynamic keys and args are proportional.
local dynamicKeysCount = #KEYS - INITIAL_KEY_OFFSET
local dynamicArgsCount = #ARGV - INITIAL_ARGV_OFFSET

-- If there are no dynamic keys or args, nothing to process
if dynamicKeysCount == 0 and dynamicArgsCount == 0 then
    return {0, 0, 0, 0}
end

-- Check that dynamic keys count is a multiple of KEYS_PER_MESSAGE
if dynamicKeysCount % KEYS_PER_MESSAGE ~= 0 then
    return 'INVALID_ARGS_ERROR'
end

-- Check that dynamic args count is a multiple of PARAMS_PER_MESSAGE
if dynamicArgsCount % PARAMS_PER_MESSAGE ~= 0 then
    return 'INVALID_ARGS_ERROR'
end

-- Calculate expected number of messages from keys and args
local expectedMessagesFromKeys = dynamicKeysCount / KEYS_PER_MESSAGE
local expectedMessagesFromArgs = dynamicArgsCount / PARAMS_PER_MESSAGE

-- Ensure both counts match
if expectedMessagesFromKeys ~= expectedMessagesFromArgs then
    return 'INVALID_ARGS_ERROR'
end

-- Counters for tracking results
local processedCount = 0
local successCount = 0
local notFoundCount = 0
local inProcessCount = 0

-- Fetch queue type once before the loop for efficiency
local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)

-- Process each message
local keyIndex = INITIAL_KEY_OFFSET + 1
for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    local messageKey = KEYS[keyIndex]
    local messageHistoryKey = KEYS[keyIndex + 1]
    local messageId = ARGV[argvIndex]

    keyIndex = keyIndex + KEYS_PER_MESSAGE
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
            redis.call("ZREM", keyQueueDelayed, messageId)
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

        -- Delete the message hash and its history
        redis.call("DEL", messageKey, messageHistoryKey)

        -- Remove the message ID from the queue's global message set
        redis.call("LREM", keyQueuePublished, 1, messageId)

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
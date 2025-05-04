-- Constants for queue properties and message statuses
local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyMessagesCount = ARGV[2]
local EQueuePropertyQueueTypePriorityQueue = ARGV[3]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[4]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[5]
local EMessagePropertyStatus = ARGV[6]
local EMessagePropertyStatusProcessing = ARGV[7]
local EMessagePropertyStatusAcknowledged = ARGV[8]
local EMessagePropertyStatusPending = ARGV[9]
local EMessagePropertyStatusScheduled = ARGV[10]
local EMessagePropertyStatusDeadLettered = ARGV[11]
local EMessagePropertyStatusUnackDelaying = ARGV[12]
local EMessagePropertyStatusUnackRequeuing = ARGV[13]

-- Response status constants
local STATUS = {
    OK = 'OK',
    MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
    MESSAGE_IN_PROCESS = 'MESSAGE_IN_PROCESS',
    INVALID_PARAMETERS = 'INVALID_PARAMETERS',
    PARTIAL_SUCCESS = 'PARTIAL_SUCCESS'
}

-- Key placeholders
local keys = {
    queueScheduled = '',
    queueDelayed = '',
    queueRequeued = '',
    message = '',
    queueProperties = '',
    queuePending = '',
    queueDL = '',
    queueAcknowledged = '',
    queuePriorityPending = '',
    queueMessages = '',
}

-- Offset trackers
local keyIndexOffset = 0
local argvIndexOffset = 13

-- Removes a message from the corresponding queue (scheduled, acknowledged, delayed, requeue, pending) based on status
local function removeFromStatusQueue(messageId, messageStatus)
    local deleted = 0

    if messageStatus == EMessagePropertyStatusAcknowledged then
        deleted = redis.call("LREM", keys.queueAcknowledged, 1, messageId)
    elseif messageStatus == EMessagePropertyStatusDeadLettered then
        deleted = redis.call("LREM", keys.queueDL, 1, messageId)
    elseif messageStatus == EMessagePropertyStatusScheduled then
        deleted = redis.call("ZREM", keys.queueScheduled, messageId)
    elseif messageStatus == EMessagePropertyStatusUnackDelaying then
        deleted = redis.call("LREM", keys.queueDelayed, 1, messageId)
    elseif messageStatus == EMessagePropertyStatusUnackRequeuing then
        deleted = redis.call("LREM", keys.queueRequeued, 1, messageId)
    elseif messageStatus == EMessagePropertyStatusPending then
        local queueType = redis.call("HGET", keys.queueProperties, EQueuePropertyQueueType)
        if queueType then
            if queueType == EQueuePropertyQueueTypePriorityQueue then
                deleted = redis.call("ZREM", keys.queuePriorityPending, messageId)
            elseif queueType == EQueuePropertyQueueTypeFIFOQueue or queueType == EQueuePropertyQueueTypeLIFOQueue then
                deleted = redis.call("LREM", keys.queuePending, 1, messageId)
            end
        end
    end

    return deleted
end

-- Deletes a message and returns the status
local function deleteMessage(messageId)
    -- Check if message exists and get its status
    local messageStatus = redis.call("HGET", keys.message, EMessagePropertyStatus)
    if not messageStatus then
        return STATUS.MESSAGE_NOT_FOUND
    end

    -- For messages in process, we'll just report the status but not attempt deletion
    if messageStatus == EMessagePropertyStatusProcessing then
        return STATUS.MESSAGE_IN_PROCESS
    end

    -- Try to remove the message from acknowledged, dl, scheduled, etc. based on message status
    removeFromStatusQueue(messageId, messageStatus)

    -- Delete the message
    redis.call("DEL", keys.message)

    -- Remove the message ID from queue messages
    redis.call("SREM", keys.queueMessages, messageId)

    -- Decrements the message count in queue properties
    redis.call("HINCRBY", keys.queueProperties, EQueuePropertyMessagesCount, -1)

    return STATUS.OK
end

-- Setup keys for a message
local function setupKeysForMessage(baseOffset)
    keys.queueScheduled = KEYS[baseOffset + 1]
    keys.queueDelayed = KEYS[baseOffset + 2]
    keys.queueRequeued = KEYS[baseOffset + 3]
    keys.message = KEYS[baseOffset + 4]
    keys.queueProperties = KEYS[baseOffset + 5]
    keys.queuePending = KEYS[baseOffset + 6]
    keys.queueDL = KEYS[baseOffset + 7]
    keys.queueAcknowledged = KEYS[baseOffset + 8]
    keys.queuePriorityPending = KEYS[baseOffset + 9]
    keys.queueMessages = KEYS[baseOffset + 10]
end

-- Main execution logic
local function main()
    -- Counters for tracking results
    local processedCount = 0
    local successCount = 0
    local notFoundCount = 0
    local inProcessCount = 0

    -- Check if we have enough arguments
    if #ARGV <= argvIndexOffset then
        return STATUS.INVALID_PARAMETERS
    end

    -- Process each message ID
    for i = argvIndexOffset + 1, #ARGV do
        local messageId = ARGV[i]
        processedCount = processedCount + 1

        -- Setup keys for this message
        setupKeysForMessage(keyIndexOffset)
        keyIndexOffset = keyIndexOffset + 10

        -- Try to delete the message
        local messageStatus = deleteMessage(messageId)

        -- Track results but continue processing regardless of status
        if messageStatus == STATUS.OK then
            successCount = successCount + 1
        elseif messageStatus == STATUS.MESSAGE_NOT_FOUND then
            notFoundCount = notFoundCount + 1
        elseif messageStatus == STATUS.MESSAGE_IN_PROCESS then
            inProcessCount = inProcessCount + 1
        end

        -- Always continue to the next message
    end

    -- Return an array instead of a table for compatibility with Redis
    -- Format: [processed, success, notFound, inProcess]
    return {
        processedCount,
        successCount,
        notFoundCount,
        inProcessCount
    }
end

-- Execute the main function and return the result
return main()
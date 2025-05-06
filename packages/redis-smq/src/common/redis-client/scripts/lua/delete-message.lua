local QUEUE_TYPE = ARGV[1]
local MSG_COUNT = ARGV[2]
local QUEUE_TYPE_PRIORITY = ARGV[3]
local QUEUE_TYPE_LIFO = ARGV[4]
local QUEUE_TYPE_FIFO = ARGV[5]
local MSG_STATUS = ARGV[6]
local MSG_STATUS_PROCESSING = ARGV[7]
local MSG_STATUS_ACKNOWLEDGED = ARGV[8]
local MSG_STATUS_PENDING = ARGV[9]
local MSG_STATUS_SCHEDULED = ARGV[10]
local MSG_STATUS_DEADLETTERED = ARGV[11]
local MSG_STATUS_UNACK_DELAYING = ARGV[12]
local MSG_STATUS_UNACK_REQUEUING = ARGV[13]

local STATUS_OK = 'OK'
local STATUS_MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND'
local STATUS_MESSAGE_IN_PROCESS = 'MESSAGE_IN_PROCESS'
local STATUS_INVALID_PARAMETERS = 'INVALID_PARAMETERS'

-- Counters for tracking results
local processedCount = 0
local successCount = 0
local notFoundCount = 0
local inProcessCount = 0

-- Constants for parameter counts
local INITIAL_KEY_OFFSET = 0
local INITIAL_ARGV_OFFSET = 13
local PARAMS_PER_MESSAGE = 1
local KEYS_PER_MESSAGE = 10

-- Validate parameters
if #ARGV <= INITIAL_ARGV_OFFSET then
    return 'INVALID_PARAMETERS'
end

--
local keyIndex = INITIAL_KEY_OFFSET + 1

for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    local messageId = ARGV[argvIndex]

    -- Setup direct key references for this message
    local queueScheduled = KEYS[keyIndex]
    local queueDelayed = KEYS[keyIndex + 1]
    local queueRequeued = KEYS[keyIndex + 2]
    local messageKey = KEYS[keyIndex + 3]
    local queueProperties = KEYS[keyIndex + 4]
    local queuePending = KEYS[keyIndex + 5]
    local queueDL = KEYS[keyIndex + 6]
    local queueAcknowledged = KEYS[keyIndex + 7]
    local queuePriorityPending = KEYS[keyIndex + 8]
    local queueMessages = KEYS[keyIndex + 9]

    -- Update keyIndex for next iteration
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    --
    processedCount = processedCount + 1

    -- Check if message exists and get its status
    local messageStatus = redis.call("HGET", messageKey, MSG_STATUS)
    if messageStatus == false then
        notFoundCount = notFoundCount + 1
    elseif messageStatus == MSG_STATUS_PROCESSING then
        inProcessCount = inProcessCount + 1
    else
        -- Remove from appropriate queue based on status
        if messageStatus == MSG_STATUS_ACKNOWLEDGED then
            redis.call("LREM", queueAcknowledged, 1, messageId)
        elseif messageStatus == MSG_STATUS_DEADLETTERED then
            redis.call("LREM", queueDL, 1, messageId)
        elseif messageStatus == MSG_STATUS_SCHEDULED then
            redis.call("ZREM", queueScheduled, messageId)
        elseif messageStatus == MSG_STATUS_UNACK_DELAYING then
            redis.call("LREM", queueDelayed, 1, messageId)
        elseif messageStatus == MSG_STATUS_UNACK_REQUEUING then
            redis.call("LREM", queueRequeued, 1, messageId)
        elseif messageStatus == MSG_STATUS_PENDING then
            local queueType = redis.call("HGET", queueProperties, QUEUE_TYPE)
            if queueType then
                if queueType == QUEUE_TYPE_PRIORITY then
                    redis.call("ZREM", queuePriorityPending, messageId)
                elseif queueType == QUEUE_TYPE_FIFO or queueType == QUEUE_TYPE_LIFO then
                    redis.call("LREM", queuePending, 1, messageId)
                end
            end
        end

        -- Delete the message
        redis.call("DEL", messageKey)

        -- Remove the message ID from queue messages
        redis.call("SREM", queueMessages, messageId)

        -- Decrements the message count in queue properties
        redis.call("HINCRBY", queueProperties, MSG_COUNT, -1)

        successCount = successCount + 1
    end
end

-- Return an array with the results
return {processedCount, successCount, notFoundCount, inProcessCount}

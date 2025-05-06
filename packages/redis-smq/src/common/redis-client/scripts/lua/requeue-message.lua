local keyFromQueue = KEYS[1]
local keyQueueProperties = KEYS[2]

local keyQueuePropertyQueueType = ARGV[1]
local typePriorityQueue = ARGV[2]
local typeLIFOQueue = ARGV[3]
local typeFIFOQueue = ARGV[4]
local EMessagePropertyStatus = ARGV[5]
local messageStatus = ARGV[6]
local EMessagePropertyState = ARGV[7]

-- Constants for parameter counts
local INITIAL_KEY_OFFSET = 2
local INITIAL_ARGV_OFFSET = 7
local PARAMS_PER_MESSAGE = 3
local KEYS_PER_MESSAGE = 3

-- Validate parameters
if #ARGV <= INITIAL_ARGV_OFFSET then
    return 'INVALID_PARAMETERS'
end

--
local keyIndex = INITIAL_KEY_OFFSET + 1

-- Process each message batch
for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    -- Extract message parameters in sequence
    local messageId = ARGV[argvIndex]
    local messagePriority = ARGV[argvIndex + 1]
    local messageState = ARGV[argvIndex + 2]

    -- Extract keys for current message
    local keyQueuePriority = KEYS[keyIndex]
    local keyQueuePending = KEYS[keyIndex + 1]
    local keyMessage = KEYS[keyIndex + 2]

    -- Update keyIndex for next iteration
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    -- Try to remove the message from the source queue
    local result = redis.call("LREM", keyFromQueue, 1, messageId)

    -- Only proceed if message was found and removed
    if result then
        -- Get queue type
        local queueType = redis.call("HGET", keyQueueProperties, keyQueuePropertyQueueType)

        -- Handle priority queue
        if queueType == typePriorityQueue and messagePriority ~= nil and messagePriority ~= '' then
            redis.call("ZADD", keyQueuePriority, messagePriority, messageId)

            -- Update message properties
            redis.call(
                "HSET", keyMessage,
                EMessagePropertyStatus, messageStatus,
                EMessagePropertyState, messageState
            )
        -- Handle LIFO/FIFO queues
        elseif (queueType == typeLIFOQueue or queueType == typeFIFOQueue) and
               (messagePriority == nil or messagePriority == '') then
            -- Use direct conditional for better performance
            if queueType == typeLIFOQueue then
                redis.call("RPUSH", keyQueuePending, messageId)
            else
                redis.call("LPUSH", keyQueuePending, messageId)
            end

            -- Update message properties
            redis.call(
                "HSET", keyMessage,
                EMessagePropertyStatus, messageStatus,
                EMessagePropertyState, messageState
            )
        else
            -- If we get here, the queue type doesn't match the message priority configuration
            return 'QUEUE_TYPE_MISMATCH'
        end
    else
        -- Message not found in the source queue
        return 'MESSAGE_NOT_FOUND'
    end
end

return 'OK'
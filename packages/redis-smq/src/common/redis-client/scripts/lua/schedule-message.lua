local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyMessagesCount = ARGV[2]
local EMessagePropertyMessage = ARGV[3]
local EMessagePropertyStatus = ARGV[4]
local EMessagePropertyStatusScheduled = ARGV[5]
local EMessagePropertyState = ARGV[6]
local scheduleFromDelayed = ARGV[7]

-- Constants for parameter counts
local INITIAL_KEY_OFFSET = 0
local INITIAL_ARGV_OFFSET = 7
local PARAMS_PER_MESSAGE = 4
local KEYS_PER_MESSAGE = 5

--
if (#ARGV <= INITIAL_ARGV_OFFSET) then
    return 'INVALID_PARAMETERS'
end

--
local keyIndex = INITIAL_KEY_OFFSET + 1

-- Process messages in batches
for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    -- Extract message parameters
    local messageId = ARGV[argvIndex]
    local message = ARGV[argvIndex + 1]
    local scheduleTimestamp = ARGV[argvIndex + 2]
    local messageState = ARGV[argvIndex + 3]

    -- Set keys for this message
    local keyQueueMessages = KEYS[keyIndex]
    local keyQueueProperties = KEYS[keyIndex + 1]
    local keyMessage = KEYS[keyIndex + 2]
    local keyQueueScheduled = KEYS[keyIndex + 3]
    local keyQueueDelayed = KEYS[keyIndex + 4]

    -- Update keyIndex for next iteration
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    -- Check if queue exists
    local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)
    if queueType == false then
        return 'QUEUE_NOT_FOUND'
    end

    -- Process the message based on its source
    if scheduleFromDelayed == '1' then
        -- Update existing message from delayed queue
        redis.call("LREM", keyQueueDelayed, 1, messageId)
        redis.call("HSET", keyMessage,
                  EMessagePropertyStatus, EMessagePropertyStatusScheduled,
                  EMessagePropertyState, messageState)
    else
        -- Save new message
        redis.call("SADD", keyQueueMessages, messageId)
        redis.call("HSET", keyMessage,
                  EMessagePropertyMessage, message,
                  EMessagePropertyStatus, EMessagePropertyStatusScheduled,
                  EMessagePropertyState, messageState)
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyMessagesCount, 1)
    end

    -- Add to scheduled queue
    redis.call("ZADD", keyQueueScheduled, scheduleTimestamp, messageId)
end

return 'OK'
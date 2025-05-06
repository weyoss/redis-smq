local EMessagePropertyStatus = ARGV[1]
local EMessagePropertyStatusPending = ARGV[2]
local EMessagePropertyState = ARGV[3]
local EQueuePropertyQueueType = ARGV[4]
local EQueuePropertyQueueTypePriorityQueue = ARGV[5]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[6]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[7]
local EQueuePropertyMessagesCount = ARGV[8]
local EMessagePropertyMessage = ARGV[9]

--
local INITIAL_KEY_OFFSET = 0
local INITIAL_ARGV_OFFSET = 9
local PARAMS_PER_MESSAGE = 7
local KEYS_PER_MESSAGE = 7

-- Validate parameters
if #ARGV <= INITIAL_ARGV_OFFSET then
    return 'INVALID_PARAMETERS'
end

--
local keyIndex = INITIAL_KEY_OFFSET + 1

for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    -- Extract message parameters
    local messageId = ARGV[argvIndex]
    local message = ARGV[argvIndex + 1]
    local messageState = ARGV[argvIndex + 2]
    local messagePriority = ARGV[argvIndex + 3]
    local scheduledMessageId = ARGV[argvIndex + 4]
    local scheduledMessageNextScheduleTimestamp = ARGV[argvIndex + 5]
    local scheduledMessageState = ARGV[argvIndex + 6]

    -- Extract keys for current message
    local keyMessage = KEYS[keyIndex]
    local keyQueuePending = KEYS[keyIndex + 1]
    local keyQueueMessages = KEYS[keyIndex + 2]
    local keyQueueProperties = KEYS[keyIndex + 3]
    local keyQueuePriorityPending = KEYS[keyIndex + 4]
    local keyQueueScheduled = KEYS[keyIndex + 5]
    local keyScheduledMessage = KEYS[keyIndex + 6]

    -- Update keyIndex for next iteration
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    -- Get queue type
    local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)

    -- Skip processing if queue type is missing, assuming queue has been deleted
    if queueType ~= false then
        -- Check if queue type is valid
        if queueType ~= EQueuePropertyQueueTypeLIFOQueue and
           queueType ~= EQueuePropertyQueueTypeFIFOQueue and
           queueType ~= EQueuePropertyQueueTypePriorityQueue then
            return 'ERROR_INVALID_QUEUE_TYPE'
        end

        -- Case 1: No message ID provided, use scheduled message directly
        if messageId == '' then
            -- Publish the scheduled message
            if queueType == EQueuePropertyQueueTypeFIFOQueue then
                redis.call("LPUSH", keyQueuePending, scheduledMessageId)
            elseif queueType == EQueuePropertyQueueTypeLIFOQueue then
                redis.call("RPUSH", keyQueuePending, scheduledMessageId)
            else -- Priority queue
                redis.call("ZADD", keyQueuePriorityPending, messagePriority, scheduledMessageId)
            end

            -- Remove from scheduled
            redis.call("ZREM", keyQueueScheduled, scheduledMessageId)

            -- Update scheduled message properties
            redis.call(
                "HSET", keyScheduledMessage,
                EMessagePropertyState, scheduledMessageState,
                EMessagePropertyStatus, EMessagePropertyStatusPending
            )

        else
            -- Case 2: Message ID provided, publish new message and reschedule the message
            -- Check if we have the next schedule timestamp
            if scheduledMessageNextScheduleTimestamp == "0" then
                return 'ERROR_NEXT_SCHEDULE_TIMESTAMP_REQUIRED'
            end

            -- Publish the message
            if queueType == EQueuePropertyQueueTypeFIFOQueue then
                redis.call("LPUSH", keyQueuePending, messageId)
            elseif queueType == EQueuePropertyQueueTypeLIFOQueue then
                redis.call("RPUSH", keyQueuePending, messageId)
            else -- Priority queue
                redis.call("ZADD", keyQueuePriorityPending, messagePriority, messageId)
            end

            -- Add to queue messages
            redis.call("SADD", keyQueueMessages, messageId)
            redis.call(
                "HSET", keyMessage,
                EMessagePropertyStatus, EMessagePropertyStatusPending,
                EMessagePropertyState, messageState,
                EMessagePropertyMessage, message
            )
            redis.call("HINCRBY", keyQueueProperties, EQueuePropertyMessagesCount, 1)

            -- Reschedule message
            redis.call("ZADD", keyQueueScheduled, scheduledMessageNextScheduleTimestamp, scheduledMessageId)
            redis.call("HSET", keyScheduledMessage, EMessagePropertyState, scheduledMessageState)
        end
    end
end

return 'OK'
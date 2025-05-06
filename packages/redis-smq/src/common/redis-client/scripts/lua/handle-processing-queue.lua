local ERetryActionDelay = ARGV[1]
local ERetryActionRequeue = ARGV[2]
local ERetryActionDeadLetter = ARGV[3]
local storeMessages = ARGV[4]
local expireStoredMessages = ARGV[5]
local storedMessagesSize = ARGV[6]
local EMessagePropertyStatus = ARGV[7]
local EMessageUnacknowledgedCauseOfflineConsumer = ARGV[8]
local EMessageUnacknowledgedCauseOfflineHandler = ARGV[9]

--
local INITIAL_KEY_OFFSET = 0
local INITIAL_ARGV_OFFSET = 9
local PARAMS_PER_MESSAGE = 7
local KEYS_PER_MESSAGE = 9

--
if (#ARGV <= INITIAL_ARGV_OFFSET) then
    return 'INVALID_PARAMETERS'
end

--
local keyIndex = INITIAL_KEY_OFFSET + 1

--
for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    -- Read all values for this group directly
    local queue = ARGV[argvIndex]
    local consumerId = ARGV[argvIndex + 1]
    local messageId = ARGV[argvIndex + 2]
    local retryAction = ARGV[argvIndex + 3]
    local messageDeadLetteredCause = ARGV[argvIndex + 4]
    local messageUnacknowledgedCause = ARGV[argvIndex + 5]
    local messageStatus = ARGV[argvIndex + 6]

    -- Get keys for this group directly
    local keyQueueProcessing = KEYS[keyIndex]
    local keyQueueDelayed = KEYS[keyIndex + 1]
    local keyQueueRequeued = KEYS[keyIndex + 2]
    local keyQueueDL = KEYS[keyIndex + 3]
    local keyQueueProcessingQueues = KEYS[keyIndex + 4]
    local keyQueueConsumers = KEYS[keyIndex + 5]
    local keyConsumerQueues = KEYS[keyIndex + 6]
    local keyQueueProperties = KEYS[keyIndex + 7]
    local keyMessage = KEYS[keyIndex + 8]

    -- Update keyIndex for next iteration
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    -- Process message
    if messageId ~= '' then
        if retryAction == ERetryActionRequeue then
            redis.call("RPOPLPUSH", keyQueueProcessing, keyQueueRequeued)
        elseif retryAction == ERetryActionDelay then
            redis.call("RPOPLPUSH", keyQueueProcessing, keyQueueDelayed)
        else
            if storeMessages == '1' then
                redis.call("LREM", keyQueueProcessing, 1, messageId)
                redis.call("RPUSH", keyQueueDL, messageId)
                if expireStoredMessages ~= '0' then
                    redis.call("PEXPIRE", keyQueueDL, expireStoredMessages)
                end
                if storedMessagesSize ~= '0' then
                    -- storedMessagesSize should be negative for proper trimming (to keep newest messages)
                    redis.call("LTRIM", keyQueueDL, storedMessagesSize, -1)
                end
            else
                redis.call("RPOP", keyQueueProcessing)
            end
        end

        -- Update message status
        redis.call("HSET", keyMessage, EMessagePropertyStatus, messageStatus)
    end

    -- Handle offline consumer/handler
    if messageUnacknowledgedCause == EMessageUnacknowledgedCauseOfflineConsumer or
       messageUnacknowledgedCause == EMessageUnacknowledgedCauseOfflineHandler then
        -- Delete processing queue
        if keyQueueProcessing ~= '' then
            redis.call("HDEL", keyQueueProcessingQueues, keyQueueProcessing)
            redis.call("DEL", keyQueueProcessing)
        end

        -- Remove queue consumer
        if queue ~= '' then
            redis.call("HDEL", keyQueueConsumers, consumerId)
            redis.call("SREM", keyConsumerQueues, queue)
            local size = redis.call("SCARD", keyConsumerQueues)
            if size == 0 then
                redis.call("DEL", keyConsumerQueues)
            end
        end
    end
end

return 'OK'
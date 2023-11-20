local keyProcessingQueues = KEYS[1]
local keyHeartbeats = KEYS[2]
local keyHeartbeatsTimestamps = KEYS[3]
local keyDelayedMessages = KEYS[4]
local keyRequeueMessages = KEYS[5]

---

local ERetryActionDelay = ARGV[1]
local ERetryActionRequeue = ARGV[2]
local ERetryActionDeadLetter = ARGV[3]
local storeMessages = ARGV[4]
local expireStoredMessages = ARGV[5]
local storedMessagesSize = ARGV[6]
local EMessagePropertyStatus = ARGV[7]
local EMessageUnacknowledgedCauseOfflineConsumer = ARGV[8]
local EMessageUnacknowledgedCauseOfflineHandler = ARGV[9]

---

local keyIndexOffset = 5
local argvIndexOffset = 9

---

local keyQueueProcessing = ''
local keyQueueDL = ''
local keyQueueProcessingQueues = ''
local keyQueueConsumers = ''
local keyConsumerQueues = ''
local keyQueueProperties = ''
local keyMessage = ''

local queue = ''
local consumerId = ''
local messageId = ''
local retryAction = ''
local messageDeadLetteredCause = ''
local messageUnacknowledgedCause = ''
local messageStatus = ''

---

local function updateMessageStatus()
    redis.call("HMSET", keyMessage, EMessagePropertyStatus, messageStatus)
end

local function removeQueueConsumer()
    if queue ~= '' then
        redis.call("HDEL", keyQueueConsumers, consumerId)
        redis.call("SREM", keyConsumerQueues, queue)
    end
end

local function deleteConsumer()
    redis.call("HDEL", keyHeartbeats, consumerId)
    redis.call("ZREM", keyHeartbeatsTimestamps, consumerId)
    redis.call("DEL", keyConsumerQueues)
end

local function retryMessage()
    if messageId ~= '' then
        if retryAction == ERetryActionRequeue then
            redis.call("RPOPLPUSH", keyQueueProcessing, keyRequeueMessages)
        elseif retryAction == ERetryActionDelay then
            redis.call("RPOPLPUSH", keyQueueProcessing, keyDelayedMessages)
        else
            if storeMessages == '1' then
                redis.call("LREM", keyQueueProcessing, 1, messageId)
                redis.call("RPUSH", keyQueueDL, messageId)
                if expireStoredMessages ~= '0' then
                    redis.call("PEXPIRE", keyQueueDL, expireStoredMessages)
                end
                if storedMessagesSize ~= '0' then
                    redis.call("LTRIM", keyQueueDL, storedMessagesSize, -1)
                end
            else
                redis.call("RPOP", keyQueueProcessing)
            end
        end
        updateMessageStatus();
    end
end

local function deleteProcessingQueue()
    if keyQueueProcessing ~= '' then
        redis.call("SREM", keyProcessingQueues, keyQueueProcessing)
        redis.call("HDEL", keyQueueProcessingQueues, keyQueueProcessing)
        redis.call("DEL", keyQueueProcessing)
    end
end

---

if #ARGV > argvIndexOffset then
    for index in pairs(ARGV) do
        if (index > argvIndexOffset) then
            local relativeIndex = index % 7
            if relativeIndex == 3 then
                queue = ARGV[index]
                keyQueueProcessing = KEYS[keyIndexOffset + 1]
                keyQueueDL = KEYS[keyIndexOffset + 2]
                keyQueueProcessingQueues = KEYS[keyIndexOffset + 3]
                keyQueueConsumers = KEYS[keyIndexOffset + 4]
                keyConsumerQueues = KEYS[keyIndexOffset + 5]
                keyQueueProperties = KEYS[keyIndexOffset + 6]
                keyMessage = KEYS[keyIndexOffset + 7]
                keyIndexOffset = keyIndexOffset + 7
            elseif relativeIndex == 4 then
                consumerId = ARGV[index]
            elseif relativeIndex == 5 then
                messageId = ARGV[index]
            elseif relativeIndex == 6 then
                retryAction = ARGV[index]
            elseif relativeIndex == 0 then
                messageDeadLetteredCause = ARGV[index]
            elseif relativeIndex == 1 then
                messageUnacknowledgedCause = ARGV[index]
            elseif relativeIndex == 2 then
                messageStatus = ARGV[index]
                retryMessage()
                if messageUnacknowledgedCause == EMessageUnacknowledgedCauseOfflineConsumer or messageUnacknowledgedCause == EMessageUnacknowledgedCauseOfflineHandler then
                    deleteProcessingQueue()
                    removeQueueConsumer()
                end
            end
        end
    end
    if messageUnacknowledgedCause == EMessageUnacknowledgedCauseOfflineConsumer then
        deleteConsumer()
    end
    return 'OK'
end

return 'INVALID_PARAMETERS'


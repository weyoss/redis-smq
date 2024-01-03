local keyScheduledMessages = KEYS[1]
local keyDelayedMessages = KEYS[2]
local keyRequeueMessages = KEYS[3]

---

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

---

local keyMessage = ''
local keyQueueProperties = ''
local keyQueuePending = ''
local keyQueueDL = ''
local keyQueueAcknowledged = ''
local keyQueueScheduled = ''
local keyPriorityQueuePending = ''

---

local messageId = ''

---

local keyIndexOffset = 3
local argvIndexOffset = 13

---

local function updateQueue()
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyMessagesCount, -1)
end

local function deleteMessage()
    local messageStatus = redis.call("HGET", keyMessage, EMessagePropertyStatus)
    if messageStatus == false then
        return 'MESSAGE_NOT_FOUND'
    end
    if messageStatus == EMessagePropertyStatusProcessing then
        return 'MESSAGE_IN_PROCESS'
    end
    local deleted = 0;
    if messageStatus == EMessagePropertyStatusAcknowledged then
        deleted = redis.call("LREM", keyQueueAcknowledged, 1, messageId)
    elseif messageStatus == EMessagePropertyStatusDeadLettered then
        deleted = redis.call("LREM", keyQueueDL, 1, messageId)
    elseif messageStatus == EMessagePropertyStatusScheduled then
        deleted = redis.call("ZREM", keyScheduledMessages, messageId)
        redis.call("ZREM", keyQueueScheduled, messageId)
    elseif messageStatus == EMessagePropertyStatusUnackDelaying then
        deleted = redis.call("LREM", keyDelayedMessages, 1, messageId)
    elseif messageStatus == EMessagePropertyStatusUnackRequeuing then
        deleted = redis.call("LREM", keyRequeueMessages, 1, messageId)
    elseif messageStatus == EMessagePropertyStatusPending then
        local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)
        if queueType ~= false then
            if queueType == EQueuePropertyQueueTypePriorityQueue then
                deleted = redis.call("ZREM", keyPriorityQueuePending, messageId)
            end
            if queueType == EQueuePropertyQueueTypeFIFOQueue or queueType == EQueuePropertyQueueTypeLIFOQueue then
                deleted = redis.call("LREM", keyQueuePending, 1, messageId)
            end
        end
    end
    if deleted == 1 then
        redis.call("DEL", keyMessage)
        return 'OK'
    end
    return 'MESSAGE_NOT_DELETED'
end


local deleteMessageStatus = 'INVALID_PARAMETERS'

if #ARGV > argvIndexOffset then
    for index in pairs(ARGV) do
        if (index > argvIndexOffset) then
            messageId = ARGV[index]
            keyMessage = KEYS[keyIndexOffset + 1]
            keyQueueProperties = KEYS[keyIndexOffset + 2]
            keyQueuePending = KEYS[keyIndexOffset + 3]
            keyQueueDL = KEYS[keyIndexOffset + 4]
            keyQueueAcknowledged = KEYS[keyIndexOffset + 5]
            keyQueueScheduled = KEYS[keyIndexOffset + 6]
            keyPriorityQueuePending = KEYS[keyIndexOffset + 7]
            keyIndexOffset = keyIndexOffset + 7
            deleteMessageStatus = deleteMessage()
            if deleteMessageStatus ~= 'OK' then
                break
            end
            updateQueue()
        end
    end
end

return deleteMessageStatus

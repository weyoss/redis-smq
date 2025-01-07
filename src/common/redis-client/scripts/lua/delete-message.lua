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

local keyQueueScheduled = ''
local keyQueueDelayed = ''
local keyQueueRequeued = ''
local keyMessage = ''
local keyQueueProperties = ''
local keyQueuePending = ''
local keyQueueDL = ''
local keyQueueAcknowledged = ''
local keyQueuePriorityPending = ''

---

local messageId = ''

---

local keyIndexOffset = 0
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
        deleted = redis.call("ZREM", keyQueueScheduled, messageId)
    elseif messageStatus == EMessagePropertyStatusUnackDelaying then
        deleted = redis.call("LREM", keyQueueDelayed, 1, messageId)
    elseif messageStatus == EMessagePropertyStatusUnackRequeuing then
        deleted = redis.call("LREM", keyQueueRequeued, 1, messageId)
    elseif messageStatus == EMessagePropertyStatusPending then
        local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)
        if queueType ~= false then
            if queueType == EQueuePropertyQueueTypePriorityQueue then
                deleted = redis.call("ZREM", keyQueuePriorityPending, messageId)
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
            keyQueueScheduled = KEYS[keyIndexOffset + 1]
            keyQueueDelayed = KEYS[keyIndexOffset + 2]
            keyQueueRequeued = KEYS[keyIndexOffset + 3]
            keyMessage = KEYS[keyIndexOffset + 4]
            keyQueueProperties = KEYS[keyIndexOffset + 5]
            keyQueuePending = KEYS[keyIndexOffset + 6]
            keyQueueDL = KEYS[keyIndexOffset + 7]
            keyQueueAcknowledged = KEYS[keyIndexOffset + 8]
            keyQueuePriorityPending = KEYS[keyIndexOffset + 9]
            keyIndexOffset = keyIndexOffset + 9
            deleteMessageStatus = deleteMessage()
            if deleteMessageStatus ~= 'OK' then
                break
            end
            updateQueue()
        end
    end
end

return deleteMessageStatus

local keyFromQueue = KEYS[1]
local keyQueueProperties = KEYS[2]

---

local keyQueuePropertyQueueType = ARGV[1]
local typePriorityQueue = ARGV[2]
local typeLIFOQueue = ARGV[3]
local typeFIFOQueue = ARGV[4]
local EMessagePropertyStatus = ARGV[5]
local messageStatus = ARGV[6]
local EMessagePropertyState = ARGV[7]

---

local keyQueuePriority = ''
local keyQueuePending = ''
local keyMessage = ''

local messageId = ''
local messagePriority = ''
local messageState = ''

---

local keyIndexOffset = 2
local argvIndexOffset = 7

---

local function updateMessage()
    redis.call(
            "HMSET", keyMessage,
            EMessagePropertyStatus, messageStatus,
            EMessagePropertyState, messageState
    )
end

local function requeue()
    local result = redis.call("LREM", keyFromQueue, 1, messageId)
    if result then
        local queueType = redis.call("HGET", keyQueueProperties, keyQueuePropertyQueueType)
        if queueType == typePriorityQueue and not (messagePriority == nil or messagePriority == '') then
            redis.call("ZADD", keyQueuePriority, messagePriority, messageId)
            return 'OK'
        elseif (queueType == typeLIFOQueue or queueType == typeFIFOQueue) and (messagePriority == nil or messagePriority == '') then
            if queueType == typeLIFOQueue then
                redis.call("RPUSH", keyQueuePending, messageId)
            else
                redis.call("LPUSH", keyQueuePending, messageId)
            end
            return 'OK'
        end
    end
    return 'MESSAGE_NOT_FOUND'
end

local result = 'INVALID_PARAMETERS'
if #ARGV > argvIndexOffset then
    for index in pairs(ARGV) do
        if (index > argvIndexOffset) then
            local idx = index % 3
            if idx == 2 then
                messageId = ARGV[index]
                keyQueuePriority = KEYS[keyIndexOffset + 1]
                keyQueuePending = KEYS[keyIndexOffset + 2]
                keyMessage = KEYS[keyIndexOffset + 3]
                keyIndexOffset = keyIndexOffset + 3;
            elseif idx == 0 then
                messagePriority = ARGV[index]
            elseif idx == 1 then
                messageState = ARGV[index]
                result = requeue()
                if result == 'OK' then
                    updateMessage()
                else
                    break
                end
            end
        end
    end
end

return result
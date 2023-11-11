local keyScheduledMessages = KEYS[1]
local keyDelayedMessages = KEYS[2]
---

local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyMessagesCount = ARGV[2]
local EMessagePropertyMessage = ARGV[3]
local EMessagePropertyStatus = ARGV[4]
local EMessagePropertyStatusScheduled = ARGV[5]
local EMessagePropertyState = ARGV[6]
local scheduleFromDelayed = ARGV[7]

---

local keyQueueProperties = ''
local keyMessage = ''
local keyQueueScheduled = ''

---

local messageId = ''
local message = ''
local scheduleTimestamp = ''
local keyQueueMessages = ''
local messageState = ''

---

local keyIndexOffset = 2
local argvIndexOffset = 7

---

local queueProperties = {nil, nil}

local function checkQueue()
    queueProperties = redis.call("HMGET", keyQueueProperties, EQueuePropertyQueueType, EQueuePropertyMessagesCount)
    local queueType = queueProperties[1]
    if queueType == false then
        return 'QUEUE_NOT_FOUND'
    end
    return 'OK'
end

local function updateMessageState()
    redis.call(
            "HSET", keyMessage,
            EMessagePropertyStatus, EMessagePropertyStatusScheduled,
            EMessagePropertyState, messageState
    )
end

local function saveMessage()
    redis.call("SADD", keyQueueMessages, messageId)
    redis.call(
            "HSET", keyMessage,
            EMessagePropertyMessage, message,
            EMessagePropertyStatus, EMessagePropertyStatusScheduled,
            EMessagePropertyState, messageState
    )
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyMessagesCount, 1)
end

if #ARGV > argvIndexOffset then
    for index in pairs(ARGV) do
        if (index > argvIndexOffset) then
            local idx = index % 5
            if idx == 3 then
                messageId = ARGV[index]
                keyQueueProperties = KEYS[keyIndexOffset + 1]
                keyMessage = KEYS[keyIndexOffset + 2]
                keyQueueScheduled = KEYS[keyIndexOffset + 3]
                keyIndexOffset = keyIndexOffset + 3
            elseif idx == 4 then
                message = ARGV[index]
            elseif idx == 0 then
                scheduleTimestamp = ARGV[index]
            elseif idx == 1 then
                keyQueueMessages = ARGV[index]
            elseif idx == 2 then
                messageState = ARGV[index]
                local found = checkQueue()
                if found == 'OK' then
                    if scheduleFromDelayed == '1' then
                        redis.call("LREM", keyDelayedMessages, 1, messageId)
                        updateMessageState()
                    else
                        saveMessage()
                    end
                    redis.call("ZADD", keyScheduledMessages, scheduleTimestamp, messageId)
                    redis.call("ZADD", keyQueueScheduled, scheduleTimestamp, messageId)
                else
                    return found
                end
            end
        end
    end
    return 'OK'
end

return 'INVALID_PARAMETERS'

local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyMessagesCount = ARGV[2]
local EMessagePropertyMessage = ARGV[3]
local EMessagePropertyStatus = ARGV[4]
local EMessagePropertyStatusScheduled = ARGV[5]
local EMessagePropertyState = ARGV[6]
local scheduleFromDelayed = ARGV[7]

---

local keyQueueMessages = ''
local keyQueueProperties = ''
local keyMessage = ''
local keyQueueScheduled = ''
local keyQueueDelayed = ''

---

local messageId = ''
local message = ''
local scheduleTimestamp = ''
local messageState = ''

---

local keyIndexOffset = 0
local argvIndexOffset = 7

---

local queueProperties = { nil, nil }

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
            local idx = index % 4
            if idx == 0 then
                messageId = ARGV[index]
                keyQueueMessages = KEYS[keyIndexOffset + 1]
                keyQueueProperties = KEYS[keyIndexOffset + 2]
                keyMessage = KEYS[keyIndexOffset + 3]
                keyQueueScheduled = KEYS[keyIndexOffset + 4]
                keyQueueDelayed = KEYS[keyIndexOffset + 5]
                keyIndexOffset = keyIndexOffset + 5
            elseif idx == 1 then
                message = ARGV[index]
            elseif idx == 2 then
                scheduleTimestamp = ARGV[index]
            elseif idx == 3 then
                messageState = ARGV[index]
                local found = checkQueue()
                if found == 'OK' then
                    if scheduleFromDelayed == '1' then
                        redis.call("LREM", keyQueueDelayed, 1, messageId)
                        updateMessageState()
                    else
                        saveMessage()
                    end
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

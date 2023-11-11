local keyScheduledMessages = KEYS[1]

---

local EMessagePropertyStatus = ARGV[1]
local EMessagePropertyStatusPending = ARGV[2]
local EMessagePropertyState = ARGV[3]
local EQueuePropertyQueueType = ARGV[4]
local EQueuePropertyQueueTypePriorityQueue = ARGV[5]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[6]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[7]
local EQueuePropertyMessagesCount = ARGV[8]
local EMessagePropertyMessage = ARGV[9]

---

local keyMessage = ''
local keyQueuePending = ''
local keyQueueProperties = ''
local keyPriorityQueuePending = ''
local keyQueueScheduled = ''
local keyScheduledMessage = ''

local messageId = ''
local messagePriority = ''
local message = ''
local messageState = ''
local keyQueueMessages = ''
local scheduledMessageId = ''
local scheduledMessageNextScheduleTimestamp = ''
local scheduledMessageState = ''

---

local keyIndexOffset = 1
local argvIndexOffset = 9

---

local function publishMessage(queueType)
    if queueType == EQueuePropertyQueueTypeLIFOQueue then
        redis.call("RPUSH", keyQueuePending, messageId)
    elseif queueType == EQueuePropertyQueueTypeFIFOQueue then
        redis.call("LPUSH", keyQueuePending, messageId)
    else
        redis.call("ZADD", keyPriorityQueuePending, messagePriority, messageId)
    end
    redis.call("SADD", keyQueueMessages, messageId)
    redis.call(
            "HMSET", keyMessage,
            EMessagePropertyStatus, EMessagePropertyStatusPending,
            EMessagePropertyState, messageState,
            EMessagePropertyMessage, message
    )
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyMessagesCount, 1)
end

local function deleteScheduledMessage(queueExists)
    redis.call("ZREM", keyScheduledMessages, scheduledMessageId)
    redis.call("ZREM", keyQueueScheduled, scheduledMessageId)
    redis.call("DEL", keyScheduledMessage)
    if queueExists == true then
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyMessagesCount, -1)
    end
end

local function scheduleMessage()
    if scheduledMessageNextScheduleTimestamp == "0" then
        deleteScheduledMessage(true)
    else
        redis.call("ZADD", keyScheduledMessages, scheduledMessageNextScheduleTimestamp, scheduledMessageId)
        redis.call("ZADD", keyQueueScheduled, scheduledMessageNextScheduleTimestamp, scheduledMessageId)
        redis.call("HSET", keyScheduledMessage, EMessagePropertyState, scheduledMessageState)
    end
end

local function handleMessage()
    local properties = redis.call("HMGET", keyQueueProperties, EQueuePropertyQueueType)
    local queueType = properties[1]
    if (queueType == false) or (queueType ~= EQueuePropertyQueueTypeLIFOQueue and queueType ~= EQueuePropertyQueueTypeFIFOQueue and queueType ~= EQueuePropertyQueueTypePriorityQueue) then
        deleteScheduledMessage(false)
    else
        publishMessage(queueType)
        scheduleMessage()
    end
end

if #ARGV > argvIndexOffset then
    for index in pairs(ARGV) do
        if (index > argvIndexOffset) then
            local idx = index % 8
            if idx == 2 then
                messageId = ARGV[index]
                keyMessage = KEYS[keyIndexOffset + 1]
                keyQueuePending = KEYS[keyIndexOffset + 2]
                keyQueueProperties = KEYS[keyIndexOffset + 3]
                keyPriorityQueuePending = KEYS[keyIndexOffset + 4]
                keyQueueScheduled = KEYS[keyIndexOffset + 5]
                keyScheduledMessage = KEYS[keyIndexOffset + 6]
                keyIndexOffset = keyIndexOffset + 6
            elseif idx == 3 then
                messagePriority = ARGV[index]
            elseif idx == 4 then
                message = ARGV[index]
            elseif idx == 5 then
                messageState = ARGV[index]
            elseif idx == 6 then
                keyQueueMessages = ARGV[index]
            elseif idx == 7 then
                scheduledMessageId = ARGV[index]
            elseif idx == 0 then
                scheduledMessageNextScheduleTimestamp = ARGV[index]
            elseif idx == 1 then
                scheduledMessageState = ARGV[index]
                handleMessage()
            end
        end
    end
    return 'OK'
end

return 'INVALID_PARAMETERS'
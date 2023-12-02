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
local keyQueueMessages = ''
local keyQueueProperties = ''
local keyPriorityQueuePending = ''
local keyQueueScheduled = ''
local keyScheduledMessage = ''

local messageId = ''
local message = ''
local messageState = ''
local messagePriority = ''
local scheduledMessageId = ''
local scheduledMessageNextScheduleTimestamp = ''
local scheduledMessageState = ''

---

local keyIndexOffset = 1
local argvIndexOffset = 9

---

local function addToQueueMessages()
    redis.call("SADD", keyQueueMessages, messageId)
    redis.call(
            "HMSET", keyMessage,
            EMessagePropertyStatus, EMessagePropertyStatusPending,
            EMessagePropertyState, messageState,
            EMessagePropertyMessage, message
    )
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyMessagesCount, 1)
end

local function publishMessage(queueType, msgId)
    if queueType == EQueuePropertyQueueTypeLIFOQueue then
        redis.call("RPUSH", keyQueuePending, msgId)
    elseif queueType == EQueuePropertyQueueTypeFIFOQueue then
        redis.call("LPUSH", keyQueuePending, msgId)
    else
        redis.call("ZADD", keyPriorityQueuePending, messagePriority, msgId)
    end
end

local function deletedScheduledMessage(updateMessageCount)
    redis.call("DEL", keyScheduledMessage)
    if updateMessageCount == true then
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyMessagesCount, -1)
    end
end

local function removeFromScheduled()
    redis.call("ZREM", keyScheduledMessages, scheduledMessageId)
    redis.call("ZREM", keyQueueScheduled, scheduledMessageId)
end

local function updateScheduledMessageProperties(status )
    if status == '' then
        redis.call("HSET", keyScheduledMessage, EMessagePropertyState, scheduledMessageState)
    else
        redis.call(
            "HMSET", keyScheduledMessage,
            EMessagePropertyState, scheduledMessageState,
            EMessagePropertyStatus, status
        )
    end
end

local function scheduleMessage()
    redis.call("ZADD", keyScheduledMessages, scheduledMessageNextScheduleTimestamp, scheduledMessageId)
    redis.call("ZADD", keyQueueScheduled, scheduledMessageNextScheduleTimestamp, scheduledMessageId)
end

local function handleMessage()
    local properties = redis.call("HMGET", keyQueueProperties, EQueuePropertyQueueType)
    local queueType = properties[1]
    if (queueType == false) then
        removeFromScheduled()
        deletedScheduledMessage(false)
    elseif (queueType ~= EQueuePropertyQueueTypeLIFOQueue and queueType ~= EQueuePropertyQueueTypeFIFOQueue and queueType ~= EQueuePropertyQueueTypePriorityQueue) then
        removeFromScheduled()
        deletedScheduledMessage(true)
    elseif messageId == '' then
        publishMessage(queueType, scheduledMessageId)
        removeFromScheduled()
        updateScheduledMessageProperties(EMessagePropertyStatusPending)
    else
        publishMessage(queueType, messageId)
        addToQueueMessages();
        if scheduledMessageNextScheduleTimestamp == "0" then
            removeFromScheduled()
            deletedScheduledMessage(true)
        else
            scheduleMessage()
            updateScheduledMessageProperties('')
        end
    end
end

if #ARGV > argvIndexOffset then
    for index in pairs(ARGV) do
        if (index > argvIndexOffset) then
            local idx = index % 7
            if idx == 3 then
                messageId = ARGV[index]
                keyMessage = KEYS[keyIndexOffset + 1]
                keyQueuePending = KEYS[keyIndexOffset + 2]
                keyQueueProperties = KEYS[keyIndexOffset + 3]
                keyQueueMessages = KEYS[keyIndexOffset + 4]
                keyPriorityQueuePending = KEYS[keyIndexOffset + 5]
                keyQueueScheduled = KEYS[keyIndexOffset + 6]
                keyScheduledMessage = KEYS[keyIndexOffset + 7]
                keyIndexOffset = keyIndexOffset + 7
            elseif idx == 4 then
                message = ARGV[index]
            elseif idx == 5 then
                messageState = ARGV[index]
            elseif idx == 6 then
                messagePriority = ARGV[index]
            elseif idx == 0 then
                scheduledMessageId = ARGV[index]
            elseif idx == 1 then
                scheduledMessageNextScheduleTimestamp = ARGV[index]
            elseif idx == 2 then
                scheduledMessageState = ARGV[index]
                handleMessage()
            end
        end
    end
    return 'OK'
end

return 'INVALID_PARAMETERS'
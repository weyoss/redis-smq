local keyQueueProperties = KEYS[1]
local keyPriorityQueue = KEYS[2]
local keyQueuePending = KEYS[3]
local keyMessage = KEYS[4]

---

local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyMessagesCount = ARGV[2]
local EQueuePropertyQueueTypePriorityQueue = ARGV[3]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[4]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[5]
local messagePriority = ARGV[6]
local keyQueueMessages = ARGV[7]
local messageId = ARGV[8]
local EMessagePropertyStatus = ARGV[9]
local messageStatus = ARGV[10]
local EMessagePropertyState = ARGV[11]
local messageState = ARGV[12]
local EMessagePropertyMessage = ARGV[13]
local message = ARGV[14]

local queueProperties = redis.call("HMGET", keyQueueProperties, EQueuePropertyQueueType)

local function saveMessage()
    redis.call("SADD", keyQueueMessages, messageId)
    redis.call(
            "HMSET", keyMessage,
            EMessagePropertyStatus, messageStatus,
            EMessagePropertyState, messageState,
            EMessagePropertyMessage, message
    )
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyMessagesCount, 1)
end

local queueType = queueProperties[1]
if queueType == false then
    return 'QUEUE_NOT_FOUND'
end

if queueType == EQueuePropertyQueueTypePriorityQueue then
    if messagePriority == nil or messagePriority == '' then
        return 'MESSAGE_PRIORITY_REQUIRED'
    end
    redis.call("ZADD", keyPriorityQueue, messagePriority, messageId)
else
    if not(messagePriority == nil or messagePriority == '') then
       return 'PRIORITY_QUEUING_NOT_ENABLED'
    end
    if queueType == EQueuePropertyQueueTypeLIFOQueue then
       redis.call("RPUSH", keyQueuePending, messageId)
    elseif queueType == EQueuePropertyQueueTypeFIFOQueue then
       redis.call("LPUSH", keyQueuePending, messageId)
    else
       return 'UNKNOWN_QUEUE_TYPE'
    end
end

saveMessage()
return 'OK'


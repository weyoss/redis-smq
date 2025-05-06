local keyQueueProperties = KEYS[1]
local keyPriorityQueue = KEYS[2]
local keyQueuePending = KEYS[3]
local keyQueueMessages = KEYS[4]
local keyMessage = KEYS[5]

local EQueuePropertyQueueType = ARGV[1]
local EQueuePropertyMessagesCount = ARGV[2]
local EQueuePropertyQueueTypePriorityQueue = ARGV[3]
local EQueuePropertyQueueTypeLIFOQueue = ARGV[4]
local EQueuePropertyQueueTypeFIFOQueue = ARGV[5]
local messagePriority = ARGV[6]
local messageId = ARGV[7]
local EMessagePropertyStatus = ARGV[8]
local messageStatus = ARGV[9]
local EMessagePropertyState = ARGV[10]
local messageState = ARGV[11]
local EMessagePropertyMessage = ARGV[12]
local message = ARGV[13]

-- Get queue type with a single field fetch
local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)

-- Early return if queue doesn't exist
if queueType == false then
    return 'QUEUE_NOT_FOUND'
end

-- Handle different queue types
if queueType == EQueuePropertyQueueTypePriorityQueue then
    -- Check if priority is provided for priority queue
    if messagePriority == nil or messagePriority == '' then
        return 'MESSAGE_PRIORITY_REQUIRED'
    end
    redis.call("ZADD", keyPriorityQueue, messagePriority, messageId)
else
    -- Check if priority is incorrectly provided for non-priority queue
    if not (messagePriority == nil or messagePriority == '') then
        return 'PRIORITY_QUEUING_NOT_ENABLED'
    end

    -- Handle LIFO and FIFO queues
    if queueType == EQueuePropertyQueueTypeLIFOQueue then
        redis.call("RPUSH", keyQueuePending, messageId)
    elseif queueType == EQueuePropertyQueueTypeFIFOQueue then
        redis.call("LPUSH", keyQueuePending, messageId)
    else
        return 'UNKNOWN_QUEUE_TYPE'
    end
end

-- Add message to queue and set its properties
redis.call("SADD", keyQueueMessages, messageId)
redis.call(
    "HSET", keyMessage,
    EMessagePropertyStatus, messageStatus,
    EMessagePropertyState, messageState,
    EMessagePropertyMessage, message
)
redis.call("HINCRBY", keyQueueProperties, EQueuePropertyMessagesCount, 1)

return 'OK'
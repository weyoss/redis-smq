local keyQueueConsumerGroups = KEYS[1]
local keyQueuePending = KEYS[2]
local keyQueuePendingPriority = KEYS[3]
local keyQueueProperties = KEYS[4]

local queuePropertiesQueueType = ARGV[1]
local typePriorityQueue = ARGV[2]
local typeLIFOQueue = ARGV[3]
local typeFIFOQueue = ARGV[4]
local groupId = ARGV[5]

-- Get queue type once and validate it exists
local queueType = redis.call("HGET", keyQueueProperties, queuePropertiesQueueType)
if queueType == false then
    return 'QUEUE_NOT_FOUND'
end

-- Determine which key to check based on queue type (only once)
local pendingKey
if queueType == typePriorityQueue then
    pendingKey = keyQueuePendingPriority
else
    pendingKey = keyQueuePending
end

-- Check if the queue is empty using the appropriate command
local count = 0
if queueType == typePriorityQueue then
    count = redis.call("ZCARD", pendingKey)
else
    count = redis.call("LLEN", pendingKey)
end

-- Return early if the queue is not empty
if count > 0 then
    return 'CONSUMER_GROUP_NOT_EMPTY'
end

-- Remove the consumer group
redis.call("SREM", keyQueueConsumerGroups, groupId)

-- Delete the pending queue
redis.call("DEL", pendingKey)

return 'OK'
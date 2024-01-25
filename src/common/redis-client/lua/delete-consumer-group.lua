local keyQueueConsumerGroups = KEYS[1]
local keyQueuePending = KEYS[2]
local keyQueuePendingPriority = KEYS[3]
local keyQueueProperties = KEYS[4]

local queuePropertiesQueueType = ARGV[1]
local typePriorityQueue = ARGV[2]
local typeLIFOQueue = ARGV[3]
local typeFIFOQueue = ARGV[4]
local groupId = ARGV[5]

local queueType = redis.call("HGET", keyQueueProperties, queuePropertiesQueueType)
if queueType == false then
    return 'QUEUE_NOT_FOUND'
end

local count = 0;
if queueType == typePriorityQueue then
    count = redis.call("ZCARD", keyQueuePendingPriority)
elseif queueType == typeLIFOQueue or queueType == typeFIFOQueue then
    count = redis.call("LLEN", keyQueuePending)
end
if count > 0 then
    return 'CONSUMER_GROUP_NOT_EMPTY'
end

redis.call("SREM", keyQueueConsumerGroups, groupId)
if queueType == typePriorityQueue then
    redis.call("DEL", keyQueuePendingPriority)
elseif queueType == typeLIFOQueue or queueType == typeFIFOQueue then
    redis.call("DEL", keyQueuePending)
end

return 'OK'
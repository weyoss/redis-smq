local keyNamespaces = KEYS[1]
local keyNsQueues = KEYS[2]
local keyQueues = KEYS[3]
local keyQueueProperties = KEYS[4]

local namespace = ARGV[1]
local queue = ARGV[2]
local queuePropertiesQueueType = ARGV[3]
local queueType = ARGV[4]
local queuePropertiesQueueDeliveryModel = ARGV[5]
local deliveryModel = ARGV[6]

-- Check if queue already exists
if redis.call("SISMEMBER", keyQueues, queue) == 1 then
    return 'QUEUE_EXISTS'
end

--
redis.call("SADD", keyQueues, queue)
redis.call("SADD", keyNsQueues, queue)
redis.call("SADD", keyNamespaces, namespace)

--
redis.call("HSET", keyQueueProperties,
           queuePropertiesQueueType, queueType,
           queuePropertiesQueueDeliveryModel, deliveryModel)

return 'OK'
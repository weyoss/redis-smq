local keyNamespaces = KEYS[1]
local keyNsQueues = KEYS[2]
local keyQueues = KEYS[3]
local keyQueueProperties = KEYS[4]
local keyQueuePropertiesQueueType = KEYS[5]

---

local namespace = ARGV[1]
local queue = ARGV[2]
local queueType = ARGV[3]

if redis.call("SISMEMBER", keyQueues, queue) == 0 then
    redis.call("SADD", keyQueues, queue)
    redis.call("SADD", keyNsQueues, queue)
    redis.call("SADD", keyNamespaces, namespace)
    redis.call("HSET", keyQueueProperties, keyQueuePropertiesQueueType, queueType)
    return 1
end
return 0
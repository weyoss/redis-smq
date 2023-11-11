local keyQueues = KEYS[1]
local keyQueueConsumers = KEYS[2]
local keyConsumerQueues = KEYS[3]
local keyProcessingQueues = KEYS[4]
local keyQueueProcessingQueues = KEYS[5]

---

local consumerId = ARGV[1]
local consumerInfo = ARGV[2]
local queue = ARGV[3]
local consumerProcessingQueue = ARGV[4]

if redis.call("SISMEMBER", keyQueues, queue) == 1 then
    redis.call("SADD", keyConsumerQueues, queue)
    redis.call("HSET",keyQueueConsumers, consumerId, consumerInfo)
    redis.call("HSET", keyQueueProcessingQueues, consumerProcessingQueue, consumerId)
    redis.call("SADD", keyProcessingQueues, consumerProcessingQueue)
    return 1
end
return 0
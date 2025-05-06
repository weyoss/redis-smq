local keyQueues = KEYS[1]
local keyQueueConsumers = KEYS[2]
local keyConsumerQueues = KEYS[3]
local keyQueueProcessingQueues = KEYS[4]

local consumerId = ARGV[1]
local consumerInfo = ARGV[2]
local queue = ARGV[3]
local consumerProcessingQueue = ARGV[4]

-- Early return if queue doesn't exist
if redis.call("SISMEMBER", keyQueues, queue) == 0 then
    return 0
end

-- Execute all operations in sequence without conditional branching
redis.call("SADD", keyConsumerQueues, queue)

--
redis.call("HSET", keyQueueConsumers, consumerId, consumerInfo)
redis.call("HSET", keyQueueProcessingQueues, consumerProcessingQueue, consumerId)

return 1
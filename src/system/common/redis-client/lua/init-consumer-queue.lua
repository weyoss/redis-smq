--- KEYS[1] keyQueues (set)
--- KEYS[2] keyQueueConsumers (hash)
--- KEYS[3] keyConsumerQueues (set)
--- KEYS[4] keyProcessingQueues (set)
--- KEYS[5] keyQueueProcessingQueues (hash)
--- ARGV[1] consumerId
--- ARGV[2] consumerInfo
--- ARGV[3] queue
--- ARGV[4] consumerProcessingQueue
if redis.call("SISMEMBER", KEYS[1], ARGV[3]) == 1 then
    redis.call("SADD", KEYS[3], ARGV[3])
    redis.call("HSET", KEYS[2], ARGV[1], ARGV[2])
    redis.call("HSET", KEYS[5], ARGV[4], ARGV[1])
    redis.call("SADD", KEYS[4], ARGV[4])
    return 1
end
return 0
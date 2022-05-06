--- KEYS[1] keyNamespaces (set)
--- KEYS[2] keyNsQueues (set)
--- KEYS[3] keyQueues (set)
--- KEYS[4] keyQueueSettings (hash)
--- KEYS[5] keyQueueSettingsPriorityQueuing
--- ARGV[1] namespace
--- ARGV[2] queue
--- ARGV[3] priorityQueuing
if redis.call("SISMEMBER", KEYS[3], ARGV[2]) == 0 then
    redis.call("SADD", KEYS[3], ARGV[2])
    redis.call("SADD", KEYS[2], ARGV[2])
    redis.call("SADD", KEYS[1], ARGV[1])
    redis.call("HSET", KEYS[4], KEYS[5], ARGV[3])
    return 1
end
return 0
--- KEYS[1] keyNamespaces
--- KEYS[2] keyNsQueues
--- KEYS[3] keyQueues (set)
--- KEYS[4] keyQueuePendingWithPriority (hash)
--- KEYS[5] keyQueuePriority (sorted set)
--- KEYS[6] keyQueuePending (list)
--- ARGV[1] namespace
--- ARGV[2] queue
--- ARGV[3] message id
--- ARGV[4] message
--- ARGV[5] messagePriority
if redis.call("SISMEMBER", KEYS[1], ARGV[1]) == 0 then
    redis.call("SADD", KEYS[1], ARGV[1])
end
if redis.call("SISMEMBER", KEYS[2], ARGV[2]) == 0 then
    redis.call("SADD", KEYS[2], ARGV[2])
end
if redis.call("SISMEMBER", KEYS[3], ARGV[2]) == 0 then
    redis.call("SADD", KEYS[3], ARGV[2])
end
if ARGV[5] == nil or ARGV[5] == '' then
    redis.call("RPUSH", KEYS[6], ARGV[4])
else
    redis.call("HSET", KEYS[4], ARGV[3], ARGV[4])
    redis.call("ZADD", KEYS[5], ARGV[5], ARGV[3])
end
return 1
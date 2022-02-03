--- KEYS[1] keyQueues (set)
--- KEYS[2] keyQueuePendingWithPriority (hash)
--- KEYS[3] keyQueuePriority (sorted set)
--- KEYS[4] keyQueuePending (list)
--- ARGV[1] queue
--- ARGV[2] message id
--- ARGV[3] message
--- ARGV[4] messagePriority
if redis.call("SISMEMBER", KEYS[1], ARGV[1]) == 0 then
    redis.call("SADD", KEYS[1], ARGV[1])
end
if ARGV[4] == nil or ARGV[4] == '' then
    redis.call("RPUSH", KEYS[4], ARGV[3])
else
    redis.call("HSET", KEYS[2], ARGV[2], ARGV[3])
    redis.call("ZADD", KEYS[3], ARGV[4], ARGV[2])
end
return 1
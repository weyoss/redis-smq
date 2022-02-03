--- KEYS[1] keyQueues (set)
--- KEYS[2] keyQueuePendingWithPriority (hash)
--- KEYS[3] keyQueuePriority (sorted set)
--- KEYS[4] keyQueuePending (list)
--- KEYS[5] from (list)
--- ARGV[1] queue
--- ARGV[2] message id
--- ARGV[3] message
--- ARGV[4] messagePriority
--- ARGV[5] fromMessage
if redis.call("SISMEMBER", KEYS[1], ARGV[1]) == 1 then
    local result = redis.call("LREM", KEYS[5], 1, ARGV[5])
    if result then
        if ARGV[4] == nil or ARGV[4] == '' then
            redis.call("RPUSH", KEYS[4], ARGV[3])
        else
            redis.call("HSET", KEYS[2], ARGV[2], ARGV[3])
            redis.call("ZADD", KEYS[3], ARGV[4], ARGV[2])
        end
        return 1
    end
end
return 0
--- KEYS[1] keyQueues (set)
--- KEYS[2] keyQueuePendingWithPriority (hash)
--- KEYS[3] keyQueuePriority (sorted set)
--- KEYS[4] keyQueuePending (list)
--- KEYS[5] keyScheduledMessages (sorted set)
--- KEYS[6] keyScheduledMessagesIndex (hash)
--- ARGV[1] queue
--- ARGV[2] message id
--- ARGV[3] message
--- ARGV[4] messagePriority
--- ARGV[5] nextScheduleTimestamp

if redis.call("SISMEMBER", KEYS[1], ARGV[1]) == 1 then
    if ARGV[4] == nil or ARGV[4] == '' then
        redis.call("RPUSH", KEYS[4], ARGV[3])
    else
        redis.call("HSET", KEYS[2], ARGV[2], ARGV[3])
        redis.call("ZADD", KEYS[3], ARGV[4], ARGV[2])
    end
    if ARGV[5] == '0' then
        redis.call("ZREM", KEYS[5], ARGV[2])
        redis.call("HDEL", KEYS[6], ARGV[2])
    else
        redis.call("ZADD", KEYS[5], ARGV[5], ARGV[2])
        redis.call("HSET", KEYS[6], ARGV[2], ARGV[3])
    end
    return 1
else
    redis.call("ZREM", KEYS[5], ARGV[2])
    redis.call("HDEL", KEYS[6], ARGV[2])
    return 0
end
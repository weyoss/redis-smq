--- KEYS[1] keyQueues (set)
--- KEYS[2] queue
--- KEYS[3] message id
--- KEYS[4] message

--- KEYS[5] messagePriority
--- KEYS[6] keyQueuePendingWithPriority (hash)
--- KEYS[7] keyQueuePriority (sorted set)

--- KEYS[8] keyQueuePending (list)

--- KEYS[9] nextScheduleTimestamp
--- KEYS[10] keyScheduledMessages (sorted set)
--- KEYS[11] keyScheduledMessagesIndex (hash)
if redis.call("SISMEMBER", KEYS[1], KEYS[2]) == 1 then
    if KEYS[5] == nil or KEYS[5] == '' then
        redis.call("RPUSH", KEYS[8], KEYS[4])
    else
        redis.call("HSET", KEYS[6], KEYS[3], KEYS[4])
        redis.call("ZADD", KEYS[7], KEYS[5], KEYS[3])
    end
    if KEYS[9] == '0' then
        redis.call("ZREM", KEYS[10], KEYS[3])
        redis.call("HDEL", KEYS[11], KEYS[3])
    else
        redis.call("ZADD", KEYS[10], KEYS[9], KEYS[3])
        redis.call("HSET", KEYS[11], KEYS[3], KEYS[4])
    end
    return 1
else
    redis.call("ZREM", KEYS[10], KEYS[3])
    redis.call("HDEL", KEYS[11], KEYS[3])
    return 0
end
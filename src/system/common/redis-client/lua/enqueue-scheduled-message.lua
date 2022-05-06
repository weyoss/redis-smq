--- KEYS[1] keyQueuesSettings (hash)
--- KEYS[2] keyQueuesSettingsPriorityQueuing
--- KEYS[3] keyQueuePendingWithPriority (hash)
--- KEYS[4] keyQueuePriority (sorted set)
--- KEYS[5] keyQueuePending (list)
--- KEYS[6] keyScheduledMessages (sorted set)
--- KEYS[7] keyScheduledMessagesIndex (hash)
--- ARGV[1] message id
--- ARGV[2] message
--- ARGV[3] messagePriority
--- ARGV[4] nextScheduleTimestamp
local priorityQueuing = redis.call("HGET", KEYS[1], KEYS[2])
if (priorityQueuing == 'true' and not(ARGV[3] == nil or ARGV[3] == '')) or (priorityQueuing == 'false' and (ARGV[3] == nil or ARGV[3] == '')) then
    if priorityQueuing == 'true' and not(ARGV[3] == nil or ARGV[3] == '') then
        redis.call("HSET", KEYS[3], ARGV[1], ARGV[2])
        redis.call("ZADD", KEYS[4], ARGV[3], ARGV[1])
    else
        redis.call("RPUSH", KEYS[5], ARGV[2])
    end
    if ARGV[4] == '0' then
        redis.call("ZREM", KEYS[6], ARGV[1])
        redis.call("HDEL", KEYS[7], ARGV[1])
    else
        redis.call("ZADD", KEYS[6], ARGV[4], ARGV[1])
        redis.call("HSET", KEYS[7], ARGV[1], ARGV[2])
    end
    return 1
else
    redis.call("ZREM", KEYS[6], ARGV[1])
    redis.call("HDEL", KEYS[7], ARGV[1])
    return 0
end

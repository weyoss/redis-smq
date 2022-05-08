--- KEYS[1] keyQueueSettings
--- KEYS[2] keyQueueSettingsPriorityQueuing
--- KEYS[3] keyQueuePendingPriorityMessages (hash)
--- KEYS[4] keyQueuePendingPriorityMessageIds (sorted set)
--- KEYS[5] keyQueuePending (list)
--- ARGV[1] message id
--- ARGV[2] message
--- ARGV[3] messagePriority
local priorityQueuing = redis.call("HGET", KEYS[1], KEYS[2])
if priorityQueuing == 'true' and not(ARGV[3] == nil or ARGV[3] == '') then
    redis.call("HSET", KEYS[3], ARGV[1], ARGV[2])
    redis.call("ZADD", KEYS[4], ARGV[3], ARGV[1])
    return 1
elseif priorityQueuing == 'false' and (ARGV[3] == nil or ARGV[3] == '') then
    redis.call("RPUSH", KEYS[5], ARGV[2])
    return 1
end
return 0


--- KEYS[1] keyQueueSettings
--- KEYS[2] keyQueueSettingsQueueType
--- KEYS[3] keyQueuePendingPriorityMessages (hash)
--- KEYS[4] keyQueuePendingPriorityMessageIds (sorted set)
--- KEYS[5] keyQueuePending (list)
--- ARGV[1] message id
--- ARGV[2] message
--- ARGV[3] messagePriority
local queueType = redis.call("HGET", KEYS[1], KEYS[2])
if queueType == false then
    return 'QUEUE_NOT_FOUND'
end
if queueType == '2' then
    if ARGV[3] == nil or ARGV[3] == '' then
        return 'MESSAGE_PRIORITY_REQUIRED'
    end
    redis.call("HSET", KEYS[3], ARGV[1], ARGV[2])
    redis.call("ZADD", KEYS[4], ARGV[3], ARGV[1])
    return 'OK'
end
if not(ARGV[3] == nil or ARGV[3] == '') then
   return 'PRIORITY_QUEUING_NOT_ENABLED'
end
if queueType == '0' then
    redis.call("RPUSH", KEYS[5], ARGV[2])
elseif queueType == '1' then
    redis.call("LPUSH", KEYS[5], ARGV[2])
else
    return 'UNKNOWN_QUEUE_TYPE'
end
return 'OK'


--- KEYS[1] keyQueueSettings
--- KEYS[2] keyQueueSettingsPriorityQueuing
--- KEYS[3] keyScheduledMessages (sorted set)
--- KEYS[4] keyScheduledMessagesIndex (hash)
--- ARGV[1] message id
--- ARGV[2] message
--- ARGV[3] scheduleTimestamp
--- ARGV[4] message priority
local priorityQueuing = redis.call("HGET", KEYS[1], KEYS[2])
if (priorityQueuing == false) then
    return 'QUEUE_NOT_FOUND'
end
if priorityQueuing == 'true' then
    if ARGV[4] == nil or ARGV[4] == '' then
        return 'MESSAGE_PRIORITY_REQUIRED'
    end
elseif not(ARGV[4] == nil or ARGV[4] == '') then
    return 'PRIORITY_QUEUING_NOT_ENABLED'
end
redis.call("ZADD", KEYS[3], ARGV[3], ARGV[1])
redis.call("HSET", KEYS[4], ARGV[1], ARGV[2])
return 'OK'
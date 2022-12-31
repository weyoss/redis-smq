--- KEYS[1] keyQueuesSettings (hash)
--- KEYS[2] keyQueuesSettingsQueueType
--- KEYS[3] keyQueuePendingWithPriority (hash)
--- KEYS[4] keyQueuePriority (sorted set)
--- KEYS[5] keyQueuePending (list)
--- KEYS[6] keyScheduledMessages (sorted set)
--- KEYS[7] keyScheduledMessagesIndex (hash)
--- ARGV[1] message id
--- ARGV[2] message
--- ARGV[3] messagePriority
--- ARGV[4] nextScheduleTimestamp

local function deleteMessage()
    redis.call("ZREM", KEYS[6], ARGV[1])
    redis.call("HDEL", KEYS[7], ARGV[1])
end

local function publishMessage(queueType)
    if queueType == "0" or queueType == "1" then
        if not(ARGV[3] == nil or ARGV[3] == '') then
            return "PRIORITY_QUEUING_NOT_ENABLED"
        end
        if queueType == "0" then
            redis.call("RPUSH", KEYS[5], ARGV[2])
        else
            redis.call("LPUSH", KEYS[5], ARGV[2])
        end
        return "OK"
    end
    if queueType == "2" then
        if ARGV[3] == nil or ARGV[3] == "" then
            return "MESSAGE_PRIORITY_REQUIRED"
        end
        redis.call("HSET", KEYS[3], ARGV[1], ARGV[2])
        redis.call("ZADD", KEYS[4], ARGV[3], ARGV[1])
        return "OK"
    end
    return "UNKNOWN_QUEUE_TYPE"
end

local function scheduleMessage()
    if ARGV[4] == "0" then
        deleteMessage()
    else
        redis.call("ZADD", KEYS[6], ARGV[4], ARGV[1])
        redis.call("HSET", KEYS[7], ARGV[1], ARGV[2])
    end
end

local queueType = redis.call("HGET", KEYS[1], KEYS[2])
if queueType == false then
    deleteMessage()
    return "QUEUE_NOT_FOUND"
end

local result = publishMessage(queueType)
if result == "OK" then
    scheduleMessage()
else
    deleteMessage()
end

return result

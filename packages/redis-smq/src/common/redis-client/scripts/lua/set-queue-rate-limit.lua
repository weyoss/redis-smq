local keyQueueProperties = KEYS[1]

local EQueuePropertyRateLimit = ARGV[1]
local rateLimit = ARGV[2]

-- Early return if queue doesn't exist
if redis.call("EXISTS", keyQueueProperties) == 0 then
    return 'QUEUE_NOT_FOUND'
end

-- Set the rate limit property
redis.call("HSET", keyQueueProperties, EQueuePropertyRateLimit, rateLimit)
return 'OK'
local keyQueueProperties = KEYS[1]

---

local EQueuePropertyRateLimit = ARGV[1]
local rateLimit = ARGV[2]

local result = redis.call("EXISTS", keyQueueProperties)
if result == 0 then
    return 'QUEUE_NOT_FOUND';
end

redis.call("HSET", keyQueueProperties, EQueuePropertyRateLimit, rateLimit)
return 'OK'
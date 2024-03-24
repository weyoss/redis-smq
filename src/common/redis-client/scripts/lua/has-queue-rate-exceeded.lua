local keyQueueRateLimitCounter = KEYS[1]

---

local rateLimitLimit = ARGV[1]
local rateLimitExpire = ARGV[2]

local result = redis.call("GET", keyQueueRateLimitCounter)
if result == false then
    redis.call("SET", keyQueueRateLimitCounter, rateLimitLimit)
    redis.call("PEXPIRE", keyQueueRateLimitCounter, rateLimitExpire);
    return 0
end
local count = tonumber(result)
if count <= 1 then
    return 1
end
redis.call("DECR", keyQueueRateLimitCounter)
return 0
local keyQueueRateLimitCounter = KEYS[1]

local rateLimitLimit = tonumber(ARGV[1])
local rateLimitExpire = tonumber(ARGV[2])

-- Get the current counter value
local count = redis.call("GET", keyQueueRateLimitCounter)

-- If counter doesn't exist, initialize it
if count == false then
    -- Use SET with EX option to combine SET and EXPIRE into one command
    redis.call("SET", keyQueueRateLimitCounter, rateLimitLimit, "PX", rateLimitExpire)
    return 0
end

-- Convert to number
count = tonumber(count)

-- Check if rate limit is exceeded
if count <= 1 then
    return 1
end

-- Decrement the counter
redis.call("DECR", keyQueueRateLimitCounter)
return 0
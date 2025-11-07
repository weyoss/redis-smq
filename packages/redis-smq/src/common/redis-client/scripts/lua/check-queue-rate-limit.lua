-- Description:
-- Atomically checks and decrements a rate-limit counter.
-- This script is safe from race conditions and correctly implements the rate limit logic.
--
-- KEYS[1]: key (the key for the rate-limit counter)
--
-- ARGV[1]: limit (the maximum number of operations allowed)
-- ARGV[2]: expireMs (the expiration time for the window, in milliseconds)
--
-- Returns:
--   - 0 if the rate limit is NOT exceeded.
--   - 1 if the rate limit IS exceeded.

local key = KEYS[1]
local limit = ARGV[1]
local expireMs = ARGV[2]

-- Atomically set the key with an expiration ONLY if it does not exist.
-- This prevents race conditions during the initialization of the counter.
local isNew = redis.call("SET", key, limit, "PX", expireMs, "NX")

-- If the key was newly set, this is the first request in the window.
-- We decrement the counter to consume one slot for this request.
if isNew then
    redis.call("DECR", key)
    return 0 -- Not exceeded
end

-- If the key already existed, atomically decrement it and check its value.
-- DECR returns the value of the key *after* the decrement operation.
local currentValue = redis.call("DECR", key)

-- If the counter is now less than 0, the limit has been exceeded.
if currentValue < 0 then
    return 1 -- Exceeded
end

-- Otherwise, the operation is allowed.
return 0 -- Not exceeded
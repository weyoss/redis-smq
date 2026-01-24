--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Atomically sets or removes the rate limit for a given queue.
--
-- KEYS[1]: keyQueueProperties (the hash key where queue properties are stored)
--
-- ARGV[1]: EQueuePropertyRateLimit (the name of the rate limit field in the hash)
-- ARGV[2]: rateLimit (the new rate limit value as a JSON string, or an empty string to remove it)
--
-- Returns:
--   - 'OK' on success.
--   - 'QUEUE_NOT_FOUND' if the queue does not exist.

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
--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
--   Atomically clears the rate limit for a queue by removing its
--   configuration from the queue properties and deleting its counter.
--
-- Arguments:
--   KEYS[1]: The key for the queue properties hash.
--   KEYS[2]: The key for the queue rate limit counter.
--
--   ARGV[1]: The field name of the rate limit property to be deleted from the hash (e.g., 'rateLimit').
--
-- Returns:
--   OK: Success.
--   QUEUE_NOT_FOUND: Queue not found.
--

local keyQueueProperties = KEYS[1]
local keyQueueRateLimitCounter = KEYS[2]

local keyQueuePropertiesRateLimit = ARGV[1]

if redis.call("EXISTS", keyQueueProperties) == 0 then
    return 'QUEUE_NOT_FOUND'
end

redis.call('HDEL', keyQueueProperties, keyQueuePropertiesRateLimit)
redis.call('DEL', keyQueueRateLimitCounter)

return 'OK'
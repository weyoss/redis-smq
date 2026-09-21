--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Retrieves the current operational state of a queue
--
-- KEYS[1]: keyQueueProperties - Queue properties hash
--
-- ARGV[1]: EQueuePropertyOperationalState - Field name for operational state
--
-- Returns:
--   - The current queue operational state
--   - 'QUEUE_NOT_FOUND' if the queue does not exist.
--

-- Static Keys
local keyQueueProperties = KEYS[1]

-- Arguments
local EQueuePropertyOperationalState = ARGV[1]

-- Validate queue exists
if redis.call("EXISTS", keyQueueProperties) == 0 then
    return 'QUEUE_NOT_FOUND'
end

-- Get current state
return redis.call("HGET", keyQueueProperties, EQueuePropertyOperationalState)

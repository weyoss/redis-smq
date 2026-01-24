--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
--   Atomically deletes a queue and all of its associated data structures.
--   This script is Redis Cluster compatible and expects all keys to be provided
--   by the calling client. It performs all safety checks before deletion.
--
-- KEYS[1]: Global queues set key.
-- KEYS[2]: Namespace queues set key.
-- KEYS[3]: Queue properties hash key.
-- KEYS[4]: Queue exchange bindings set key.
-- KEYS[5]: Queue consumers set key.
-- KEYS[6...n]: Heartbeat keys for queue consumers.
-- KEYS[n+1...m]: All other keys associated with the queue to be deleted.
--
-- ARGV[1]: Stringified queue parameters JSON.
-- ARGV[2]: EQueuePropertyMessagesCount
-- ARGV[3]: The number of heartbeat keys being passed in the KEYS array.
-- ARGV[4...k]: The list of expected consumer IDs from the client.
--
-- Returns:
--   OK: Success
--   QUEUE_NOT_FOUND: Queue not found
--   QUEUE_NOT_EMPTY: Queue not empty
--   QUEUE_HAS_ACTIVE_CONSUMERS: Queue has active consumers
--   QUEUE_HAS_BOUND_EXCHANGE: Queue has bound exchanges
--   CONSUMER_SET_MISMATCH: Consumer set has changed (stale data)
--

local queueParamsStr = ARGV[1]
local EQueuePropertyMessagesCount = ARGV[2]
local heartbeatKeysCount = tonumber(ARGV[3])

-- Return codes
local E_SUCCESS = 'OK'
local E_QUEUE_NOT_FOUND = 'QUEUE_NOT_FOUND'
local E_QUEUE_NOT_EMPTY = 'QUEUE_NOT_EMPTY'
local E_QUEUE_HAS_ACTIVE_CONSUMERS = 'QUEUE_HAS_ACTIVE_CONSUMERS'
local E_QUEUE_HAS_BOUND_EXCHANGES = 'QUEUE_HAS_BOUND_EXCHANGE'
local E_CONSUMER_SET_MISMATCH = 'CONSUMER_SET_MISMATCH'

-- Fixed key indices from the KEYS array
local KEY_QUEUES = 1
local KEY_NS_QUEUES = 2
local KEY_PROPERTIES = 3
local KEY_EXCHANGE_BINDINGS = 4
local KEY_QUEUE_CONSUMERS = 5
local HEARTBEAT_KEYS_START_INDEX = 6

-- 1. Get queue properties
local props = redis.call('HGETALL', KEYS[KEY_PROPERTIES])
if #props == 0 then
  return E_QUEUE_NOT_FOUND
end

-- Convert HGETALL reply to a key-value table
local queueProperties = {}
for i = 1, #props, 2 do
  queueProperties[props[i]] = props[i+1]
end

-- 2. Check for messages
if queueProperties[EQueuePropertyMessagesCount] ~= '0' then
  return E_QUEUE_NOT_EMPTY
end

-- 3. Check for bound exchanges
local boundExchangesCount = redis.call('SCARD', KEYS[KEY_EXCHANGE_BINDINGS])
if boundExchangesCount > 0 then
  return E_QUEUE_HAS_BOUND_EXCHANGES
end

-- 4. Verify consumer set to prevent race conditions
local expectedConsumerIds = {}
for i = 4, #ARGV do
    table.insert(expectedConsumerIds, ARGV[i])
end
local actualConsumerIds = redis.call('HKEYS', KEYS[KEY_QUEUE_CONSUMERS])

if #expectedConsumerIds ~= #actualConsumerIds then
  return E_CONSUMER_SET_MISMATCH
end

if #expectedConsumerIds > 0 then
  local actualConsumersSet = {}
  for _, consumerId in ipairs(actualConsumerIds) do
    actualConsumersSet[consumerId] = true
  end
  for _, consumerId in ipairs(expectedConsumerIds) do
    if not actualConsumersSet[consumerId] then
      return E_CONSUMER_SET_MISMATCH
    end
  end
end

-- 5. Check for active consumers
if heartbeatKeysCount > 0 then
  local heartbeatKeys = {}
  local lastHeartbeatKeyIndex = HEARTBEAT_KEYS_START_INDEX + heartbeatKeysCount - 1
  for i = HEARTBEAT_KEYS_START_INDEX, lastHeartbeatKeyIndex do
    table.insert(heartbeatKeys, KEYS[i])
  end
  local heartbeats = redis.call('MGET', unpack(heartbeatKeys))
  for i = 1, #heartbeats do
    if heartbeats[i] then
      return E_QUEUE_HAS_ACTIVE_CONSUMERS
    end
  end
end

-- All checks passed. Proceed with deletion.

-- 6. Remove queue from global and namespace sets
redis.call('SREM', KEYS[KEY_QUEUES], queueParamsStr)
redis.call('SREM', KEYS[KEY_NS_QUEUES], queueParamsStr)

-- 7. Delete all other keys
-- All keys from the properties key onwards are to be deleted.
local keysToDelete = {}
for i = KEY_PROPERTIES, #KEYS do
    table.insert(keysToDelete, KEYS[i])
end

if #keysToDelete > 0 then
  redis.call('DEL', unpack(keysToDelete))
end

return E_SUCCESS
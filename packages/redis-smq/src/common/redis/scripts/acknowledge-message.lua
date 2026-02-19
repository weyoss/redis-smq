--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Atomically acknowledges a message. It removes the message from the processing
-- queue, updates its status, and adjusts queue counters.
-- This script is safe from race conditions.
-- Respects queue operational state - returns specific error codes when queue state prevents acknowledgement.
--
-- KEYS[1]: keyQueueProcessing
-- KEYS[2]: keyQueueAcknowledged
-- KEYS[3]: keyQueueProperties
-- KEYS[4]: keyMessage
--
-- ARGV[1]: messageId (the ID of the message to acknowledge)
-- ARGV[2]: EMessagePropertyStatus
-- ARGV[3]: EMessagePropertyStatusAcknowledged
-- ARGV[4]: EMessagePropertyAcknowledgedAt
-- ARGV[5]: EQueuePropertyAcknowledgedCount
-- ARGV[6]: EQueuePropertyProcessingCount
-- ARGV[7]: storeMessages (flag: '1' or '0')
-- ARGV[8]: expireStoredMessages (expiration time in ms, or '0')
-- ARGV[9]: storedMessagesSize (max size of acknowledged queue, or '0')
-- ARGV[10]: messageAcknowledgedAt (acknowledgement time in ms)
-- ARGV[11]: EQueuePropertyOperationalState (field name for operational state)
-- ARGV[12]: EQueueOperationalStateActive (ACTIVE state enum value)
-- ARGV[13]: EQueueOperationalStatePaused (PAUSED state enum value)
-- ARGV[14]: EQueueOperationalStateStopped (STOPPED state enum value)
-- ARGV[15]: EQueueOperationalStateLocked (LOCKED state enum value)
--
-- Returns:
--   1: If the message was successfully acknowledged.
--   0: If the message was not found in the processing queue (already processed or moved).
--   'QUEUE_STOPPED': Queue is in STOPPED state.
--   'QUEUE_LOCKED': Queue is in LOCKED state.
--   'QUEUE_INVALID_STATE': Queue is in an unknown state.

-- Static Keys
local keyQueueProcessing = KEYS[1]
local keyQueueAcknowledged = KEYS[2]
local keyQueueProperties = KEYS[3]
local keyMessage = KEYS[4]

-- Arguments
local messageId = ARGV[1]
local EMessagePropertyStatus = ARGV[2]
local EMessagePropertyStatusAcknowledged = ARGV[3]
local EMessagePropertyAcknowledgedAt = ARGV[4]
local EQueuePropertyAcknowledgedCount = ARGV[5]
local EQueuePropertyProcessingCount = ARGV[6]
local storeMessages = ARGV[7]
local expireStoredMessages = ARGV[8]
local storedMessagesSize = ARGV[9]
local messageAcknowledgedAt = ARGV[10]
-- Operational state constants (new)
local EQueuePropertyOperationalState = ARGV[11]
local EQueueOperationalStateActive = ARGV[12]
local EQueueOperationalStatePaused = ARGV[13]
local EQueueOperationalStateStopped = ARGV[14]
local EQueueOperationalStateLocked = ARGV[15]

-- Get current operational state
local currentState = redis.call("HGET", keyQueueProperties, EQueuePropertyOperationalState)
if currentState == false then
    -- Default to ACTIVE if operational state is not set
    currentState = EQueueOperationalStateActive
end

-- Validate queue operational state for message acknowledgement
if currentState == EQueueOperationalStateStopped then
    -- Queue is completely stopped, no processing allowed
    return 'QUEUE_STOPPED'
elseif currentState == EQueueOperationalStateLocked then
    -- Queue is locked, message processing operations cannot be performed
    return 'QUEUE_LOCKED'
elseif currentState == EQueueOperationalStatePaused or currentState == EQueueOperationalStateActive then
    -- Queue is paused or active, message acknowledgements are allowed
    -- Continue with the acknowledgement logic
else
    -- Unknown state, skip processing as a safety measure
    return 'QUEUE_INVALID_STATE'
end

-- Atomically remove the message from the processing queue.
-- LREM returns the number of elements removed. If it's 0, the message was not found.
-- This is the key to preventing race conditions and double-acknowledgements.
local removed = redis.call("LREM", keyQueueProcessing, 1, messageId)
if removed == 0 then
    return 0
end

-- Update message status to 'acknowledged'.
redis.call(
    "HSET", keyMessage,
    EMessagePropertyStatus, EMessagePropertyStatusAcknowledged,
    EMessagePropertyAcknowledgedAt, messageAcknowledgedAt
)

-- Update queue counters.
redis.call("HINCRBY", keyQueueProperties, EQueuePropertyAcknowledgedCount, 1)
redis.call("HINCRBY", keyQueueProperties, EQueuePropertyProcessingCount, -1)

-- Handle optional storage of acknowledged messages.
if storeMessages == '1' then
    -- Add to acknowledged queue
    redis.call("RPUSH", keyQueueAcknowledged, messageId)

    -- Apply expiration if configured
    if expireStoredMessages ~= '0' then
        redis.call("PEXPIRE", keyQueueAcknowledged, expireStoredMessages)
    end

    -- Trim the queue if size limit is set
    if storedMessagesSize ~= '0' then
        -- storedMessagesSize is passed as a negative value for proper trimming (to keep newest messages)
        redis.call("LTRIM", keyQueueAcknowledged, storedMessagesSize, -1)
    end
end

-- Return 1 to indicate success.
return 1
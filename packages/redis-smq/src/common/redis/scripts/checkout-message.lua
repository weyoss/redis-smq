--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Atomically fetches a message for processing.
-- It first checks if the message status is 'pending'. If it is, it updates the
-- status to 'processing', increments the attempt counter, and returns the
-- complete message data.
-- Respects queue operational state - returns specific error codes when queue state prevents checkout.
--
-- KEYS[1]: keyMessage
-- KEYS[2]: keyQueueProperties
--
-- ARGV[1]: EMessagePropertyProcessingStartedAt
-- ARGV[2]: EMessagePropertyLastProcessedAt
-- ARGV[3]: messageProcessingStartedAt (timestamp)
-- ARGV[4]: EMessagePropertyStatus
-- ARGV[5]: EMessagePropertyStatusProcessing
-- ARGV[6]: EMessagePropertyStatusPending
-- ARGV[7]: EMessagePropertyAttempts
-- ARGV[8]: EQueuePropertyProcessingMessagesCount
-- ARGV[9]: EQueuePropertyPendingMessagesCount
-- ARGV[10]: EQueuePropertyOperationalState (field name for operational state)
-- ARGV[11]: EQueueOperationalStateActive (ACTIVE state enum value)
-- ARGV[12]: EQueueOperationalStatePaused (PAUSED state enum value)
-- ARGV[13]: EQueueOperationalStateStopped (STOPPED state enum value)
-- ARGV[14]: EQueueOperationalStateLocked (LOCKED state enum value)
--
-- Returns:
--   - The message data as a list of keys and values if successful.
--   - 'MESSAGE_NOT_FOUND' if the message does not exist.
--   - 'MESSAGE_NOT_PENDING' if the message is not in a 'pending' state.
--   - 'QUEUE_STOPPED' if the queue is in STOPPED state.
--   - 'QUEUE_LOCKED' if the queue is in LOCKED state.
--   - 'QUEUE_INVALID_STATE' if the queue is in an unknown state.

local keyMessage = KEYS[1]
local keyQueueProperties = KEYS[2]

local EMessagePropertyProcessingStartedAt = ARGV[1]
local EMessagePropertyLastProcessedAt = ARGV[2]
local messageProcessingStartedAt = ARGV[3]
local EMessagePropertyStatus = ARGV[4]
local EMessagePropertyStatusProcessing = ARGV[5]
local EMessagePropertyStatusPending = ARGV[6]
local EMessagePropertyAttempts = ARGV[7]
local EQueuePropertyProcessingMessagesCount = ARGV[8]
local EQueuePropertyPendingMessagesCount = ARGV[9]
-- Operational state constants
local EQueuePropertyOperationalState = ARGV[10]
local EQueueOperationalStateActive = ARGV[11]
local EQueueOperationalStatePaused = ARGV[12]
local EQueueOperationalStateStopped = ARGV[13]
local EQueueOperationalStateLocked = ARGV[14]

-- Get current operational state
local currentState = redis.call("HGET", keyQueueProperties, EQueuePropertyOperationalState)
if currentState == false then
    -- Default to ACTIVE if operational state is not set
    currentState = EQueueOperationalStateActive
end

-- Validate queue operational state for message checkout
if currentState == EQueueOperationalStateStopped then
    -- Queue is completely stopped, no message checkout allowed
    -- Application should stop consuming from this queue
    return 'QUEUE_STOPPED'
elseif currentState == EQueueOperationalStateLocked then
    -- Queue is locked, message checkout operations cannot be performed
    -- Application should stop consuming from this queue
    return 'QUEUE_LOCKED'
elseif currentState == EQueueOperationalStatePaused then
    -- Queue is paused, message checkout is allowed (messages can be processed)
    -- Application can continue processing in-flight messages
    -- Continue with the checkout logic
elseif currentState == EQueueOperationalStateActive then
    -- Queue is active, message checkout is allowed
    -- Continue with the checkout logic
else
    -- Unknown state, skip processing as a safety measure
    -- Application should stop consuming from this queue
    return 'QUEUE_INVALID_STATE'
end

-- Atomically get the current status of the message.
local messageProps = redis.call("HMGET",
    keyMessage,
    EMessagePropertyStatus,
    EMessagePropertyProcessingStartedAt
)

-- Only proceed if the message exists
if messageProps[1] == false then
    return 'MESSAGE_NOT_FOUND'
end

-- Return error if message is already processing,
-- or is in another state (e.g., acknowledged, dead-lettered).
if messageProps[1] ~= EMessagePropertyStatusPending then
    return 'MESSAGE_NOT_PENDING'
end

-- The message is available. Claim it by setting its status to 'processing'.
if messageProps[2] == '' then
    redis.call("HMSET", keyMessage,
        EMessagePropertyStatus, EMessagePropertyStatusProcessing,
        EMessagePropertyProcessingStartedAt, messageProcessingStartedAt,
        EMessagePropertyLastProcessedAt, messageProcessingStartedAt
    )
else
    redis.call("HMSET", keyMessage,
        EMessagePropertyStatus, EMessagePropertyStatusProcessing,
        EMessagePropertyLastProcessedAt, messageProcessingStartedAt
    )
end

-- Atomically increment the delivery attempts counter.
redis.call("HINCRBY", keyMessage, EMessagePropertyAttempts, 1)

-- Update queue counters.
redis.call("HINCRBY", keyQueueProperties, EQueuePropertyProcessingMessagesCount, 1)
redis.call("HINCRBY", keyQueueProperties, EQueuePropertyPendingMessagesCount, -1)

-- Now that the message is safely claimed and updated, return its full data.
return redis.call("HGETALL", keyMessage)
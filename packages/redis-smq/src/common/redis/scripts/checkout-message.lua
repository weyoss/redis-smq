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
-- ARGV[2]: messageProcessingStartedAt (timestamp)
-- ARGV[3]: EMessagePropertyStatus
-- ARGV[4]: EMessagePropertyStatusProcessing
-- ARGV[5]: EMessagePropertyStatusPending
-- ARGV[6]: EMessagePropertyAttempts
-- ARGV[7]: EQueuePropertyProcessingMessagesCount
-- ARGV[8]: EQueuePropertyPendingMessagesCount
-- ARGV[9]: EQueuePropertyOperationalState (field name for operational state)
-- ARGV[10]: EQueueOperationalStateActive (ACTIVE state enum value)
-- ARGV[11]: EQueueOperationalStatePaused (PAUSED state enum value)
-- ARGV[12]: EQueueOperationalStateStopped (STOPPED state enum value)
-- ARGV[13]: EQueueOperationalStateLocked (LOCKED state enum value)
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
local messageProcessingStartedAt = ARGV[2]
local EMessagePropertyStatus = ARGV[3]
local EMessagePropertyStatusProcessing = ARGV[4]
local EMessagePropertyStatusPending = ARGV[5]
local EMessagePropertyAttempts = ARGV[6]
local EQueuePropertyProcessingMessagesCount = ARGV[7]
local EQueuePropertyPendingMessagesCount = ARGV[8]
-- Operational state constants
local EQueuePropertyOperationalState = ARGV[9]
local EQueueOperationalStateActive = ARGV[10]
local EQueueOperationalStatePaused = ARGV[11]
local EQueueOperationalStateStopped = ARGV[12]
local EQueueOperationalStateLocked = ARGV[13]

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
local currentStatus = redis.call("HGET", keyMessage, EMessagePropertyStatus)

-- Only proceed if the message exists
if currentStatus == false then
    return 'MESSAGE_NOT_FOUND'
end

-- Return error if message is already processing,
-- or is in another state (e.g., acknowledged, dead-lettered).
if currentStatus ~= EMessagePropertyStatusPending then
    return 'MESSAGE_NOT_PENDING'
end

-- The message is available. Claim it by setting its status to 'processing'.
redis.call("HMSET", keyMessage,
    EMessagePropertyStatus, EMessagePropertyStatusProcessing,
    EMessagePropertyProcessingStartedAt, messageProcessingStartedAt
)

-- Atomically increment the delivery attempts counter.
redis.call("HINCRBY", keyMessage, EMessagePropertyAttempts, 1)

-- Update queue counters.
redis.call("HINCRBY", keyQueueProperties, EQueuePropertyProcessingMessagesCount, 1)
redis.call("HINCRBY", keyQueueProperties, EQueuePropertyPendingMessagesCount, -1)

-- Now that the message is safely claimed and updated, return its full data.
return redis.call("HGETALL", keyMessage)
--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Atomically acknowledges one or multiple messages. It removes messages from the processing
-- queue, updates their status, and adjusts queue counters.
-- This script is safe from race conditions.
-- Respects queue operational state - returns specific error codes when queue state prevents acknowledgement.
--
-- KEYS[1]: keyQueueProcessing
-- KEYS[2]: keyQueueAcknowledged
-- KEYS[3]: keyQueueProperties
-- KEYS[4...]: keyMessage(s) - one per message
--
-- ARGV[1]: storeMessages (flag: '1' or '0')
-- ARGV[2]: expireStoredMessages (expiration time in ms, or '0')
-- ARGV[3]: storedMessagesSize (max size of acknowledged queue, or '0')
-- ARGV[4]: messageAcknowledgedAt (acknowledgement time in ms)
-- ARGV[5]: EQueuePropertyOperationalState (field name for operational state)
-- ARGV[6]: EQueueOperationalStateActive (ACTIVE state enum value)
-- ARGV[7]: EQueueOperationalStatePaused (PAUSED state enum value)
-- ARGV[8]: EQueueOperationalStateStopped (STOPPED state enum value)
-- ARGV[9]: EQueueOperationalStateLocked (LOCKED state enum value)
-- ARGV[10]: EMessagePropertyStatus (field name for message status)
-- ARGV[11]: EMessagePropertyStatusAcknowledged (ACKNOWLEDGED status value)
-- ARGV[12]: EMessagePropertyAcknowledgedAt (field name for acknowledged timestamp)
-- ARGV[13]: EQueuePropertyAcknowledgedCount (field name for acknowledged count)
-- ARGV[14]: EQueuePropertyProcessingCount (field name for processing count)
-- ARGV[15...]: messageId(s) - one per message
--
-- Returns:
--   'QUEUE_NOT_FOUND': Queue does not exist.
--   'QUEUE_STOPPED': Queue is in STOPPED state.
--   'QUEUE_LOCKED': Queue is in LOCKED state.
--   'QUEUE_INVALID_STATE': Queue is in an unknown state.
--   Otherwise, array of results per message where each element is:
--     1: Message was successfully acknowledged.
--     0: Message was not found in the processing queue.

local keyQueueProcessing = KEYS[1]
local keyQueueAcknowledged = KEYS[2]
local keyQueueProperties = KEYS[3]

-- Operational state constants
local EQueuePropertyOperationalState = ARGV[5]
local EQueueOperationalStateActive = ARGV[6]
local EQueueOperationalStatePaused = ARGV[7]
local EQueueOperationalStateStopped = ARGV[8]
local EQueueOperationalStateLocked = ARGV[9]

-- Message constants
local EMessagePropertyStatus = ARGV[10]
local EMessagePropertyStatusAcknowledged = ARGV[11]
local EMessagePropertyAcknowledgedAt = ARGV[12]

-- Queue counter fields
local EQueuePropertyAcknowledgedCount = ARGV[13]
local EQueuePropertyProcessingCount = ARGV[14]

-- Script-specific arguments
local storeMessages = ARGV[1]
local expireStoredMessages = ARGV[2]
local storedMessagesSize = ARGV[3]
local messageAcknowledgedAt = ARGV[4]

if redis.call("EXISTS", keyQueueProperties) == 0 then
    return 'QUEUE_NOT_FOUND'
end

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

local results = {}
local ackCount = 0
local messageIndex = 1
local acknowledgedIds = {}

-- Process each message: messageIds start at ARGV[15]
for argvIndex = 15, #ARGV do
    local messageId = ARGV[argvIndex]
    local keyMessage = KEYS[3 + messageIndex]  -- KEYS[4] for first message, KEYS[5] for second, etc.

    -- Atomically remove the message from the processing queue.
    -- LREM returns the number of elements removed. If it's 0, the message was not found.
    -- This is the key to preventing race conditions and double-acknowledgements.
    local removed = redis.call("LREM", keyQueueProcessing, 1, messageId)

    if removed > 0 then
        -- Update message status to 'acknowledged'.
        redis.call(
                "HSET", keyMessage,
                EMessagePropertyStatus, EMessagePropertyStatusAcknowledged,
                EMessagePropertyAcknowledgedAt, messageAcknowledgedAt
        )

        results[messageIndex] = 1
        ackCount = ackCount + 1
        acknowledgedIds[ackCount] = messageId
    else
        results[messageIndex] = 0
    end

    messageIndex = messageIndex + 1
end

if ackCount > 0 then
    -- Update queue counters.
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyAcknowledgedCount, ackCount)
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyProcessingCount, -ackCount)

    if storeMessages == '1' then
        -- Push all acknowledged IDs in one batch
        redis.call("RPUSH", keyQueueAcknowledged, unpack(acknowledgedIds))

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
end

return results
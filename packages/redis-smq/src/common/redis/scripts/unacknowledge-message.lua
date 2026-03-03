--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- This script atomically recovers messages from a consumer's processing queue,
-- deciding whether to requeue them for another attempt or move them to the dead-letter queue.
-- It also cleans up resources associated with the dead consumer and is optimized for
-- safe, atomic batch operations.
-- Respects queue operational state - returns specific error codes when queue state prevents unacknowledgement.
--
-- KEYS:
--   Static Keys (1-3): All queue-related keys except consumer-specific ones.
--   Dynamic Keys (4...): A repeating triplet of [keyQueueProcessing, keyMessage] for each message.
--
-- ARGV:
--   Static ARGV (1-20): All constants.
--   Dynamic ARGV (21...): A flat list of parameters for each message.
--
-- ARGV structure per message (9 parameters):
--   1. messageId
--   2. retryAction
--   3. deadLetteredAt
--   4. messageExpired
--   5. unacknowledgedAt
--   6. lastUnacknowledgedAt
--
-- Returns:
--   The number of messages that were successfully unacknowledged.
--   'QUEUE_NOT_FOUND': Queue does not exist.
--   'QUEUE_STOPPED': Queue is in STOPPED state.
--   'QUEUE_LOCKED': Queue is in LOCKED state.
--   'QUEUE_INVALID_STATE': Queue is in an unknown state.

-- Static Keys
local keyQueueRequeued = KEYS[1]
local keyQueueDL = KEYS[2]
local keyQueueProperties = KEYS[3]

-- Static ARGV
local ERetryActionDelay = ARGV[1]
local ERetryActionRequeue = ARGV[2]
local storeMessages = ARGV[3]
local expireStoredMessages = ARGV[4]
local storedMessagesSize = ARGV[5]
local EMessagePropertyStatus = ARGV[6]
local EQueuePropertyProcessingMessagesCount = ARGV[7]
local EQueuePropertyDeadLetteredMessagesCount = ARGV[8]
local EQueuePropertyRequeuedMessagesCount = ARGV[9]
local EMessagePropertyStatusUnackRequeuing = ARGV[10]
local EMessagePropertyStatusDeadLettered = ARGV[11]
local EMessagePropertyDeadLetteredAt = ARGV[12]
local EMessagePropertyUnacknowledgedAt = ARGV[13]
local EMessagePropertyLastUnacknowledgedAt = ARGV[14]
local EMessagePropertyExpired = ARGV[15]
-- Operational state constants (new)
local EQueuePropertyOperationalState = ARGV[16]
local EQueueOperationalStateActive = ARGV[17]
local EQueueOperationalStatePaused = ARGV[18]
local EQueueOperationalStateStopped = ARGV[19]
local EQueueOperationalStateLocked = ARGV[20]

-- Loop constants
local INITIAL_KEY_OFFSET = 3
local INITIAL_ARGV_OFFSET = 20
local PARAMS_PER_MESSAGE = 6
local KEYS_PER_MESSAGE = 2
local E_INVALID_ARGS_ERROR_REPLY = "Mismatch between the number of keys and arguments provided."

if redis.call("EXISTS", keyQueueProperties) == 0 then
    return 'QUEUE_NOT_FOUND'
end

-- Get current operational state (check once for the entire batch)
local currentState = redis.call("HGET", keyQueueProperties, EQueuePropertyOperationalState)
if currentState == false then
    -- Default to ACTIVE if operational state is not set
    currentState = EQueueOperationalStateActive
end

-- Validate queue operational state for message unacknowledgement
if currentState == EQueueOperationalStateStopped then
    -- Queue is completely stopped, no processing allowed
    return 'QUEUE_STOPPED'
elseif currentState == EQueueOperationalStateLocked then
    -- Queue is locked, message processing operations cannot be performed
    return 'QUEUE_LOCKED'
elseif currentState == EQueueOperationalStatePaused or currentState == EQueueOperationalStateActive then
    -- Queue is paused or active, message unacknowledgements are allowed
    -- Continue with the unacknowledgement logic
else
    -- Unknown state, skip processing as a safety measure
    return 'QUEUE_INVALID_STATE'
end

-- Validation: Ensure the number of dynamic keys and args are proportional.
if ((#KEYS - INITIAL_KEY_OFFSET) * PARAMS_PER_MESSAGE) ~= ((#ARGV - INITIAL_ARGV_OFFSET) * KEYS_PER_MESSAGE) then
    return redis.error_reply(E_INVALID_ARGS_ERROR_REPLY)
end

-- If there are no dynamic arguments, there is nothing to do.
if #ARGV == INITIAL_ARGV_OFFSET then
    return 0
end

local keyIndex = INITIAL_KEY_OFFSET + 1
local processedCount = 0
local deadLetteredCount = 0
local requeuedCount = 0

for argvIndex = INITIAL_ARGV_OFFSET + 1, #ARGV, PARAMS_PER_MESSAGE do
    -- Read all values for this message
    local messageId = ARGV[argvIndex]
    local retryAction = ARGV[argvIndex + 1]
    local deadLetteredAt = ARGV[argvIndex + 2]
    local messageExpired = ARGV[argvIndex + 3]
    local unacknowledgedAt = ARGV[argvIndex + 4]
    local lastUnacknowledgedAt = ARGV[argvIndex + 5]

    -- Get dynamic keys for this message
    local keyQueueProcessing = KEYS[keyIndex]
    local keyMessage = KEYS[keyIndex + 1]
    keyIndex = keyIndex + KEYS_PER_MESSAGE

    -- Process message only if it exists and can be claimed
    if messageId ~= '' then
        -- Atomically remove the message from the processing queue.
        -- If LREM returns 0, the message was not found (already processed or moved).
        if redis.call("LREM", keyQueueProcessing, 1, messageId) == 1 then
            local status
            if (retryAction == ERetryActionRequeue) or (retryAction == ERetryActionDelay)  then
                status = EMessagePropertyStatusUnackRequeuing
                redis.call("RPUSH", keyQueueRequeued, messageId)
                requeuedCount = requeuedCount + 1
            else -- Dead-letter
                status = EMessagePropertyStatusDeadLettered
                if storeMessages == '1' then
                    redis.call("RPUSH", keyQueueDL, messageId)
                    if expireStoredMessages ~= '0' then
                        redis.call("PEXPIRE", keyQueueDL, expireStoredMessages)
                    end
                    if storedMessagesSize ~= '0' then
                        redis.call("LTRIM", keyQueueDL, storedMessagesSize, -1)
                    end
                end
                deadLetteredCount = deadLetteredCount + 1
            end

            redis.call(
                "HSET", keyMessage,
                EMessagePropertyStatus, status,
                EMessagePropertyUnacknowledgedAt, unacknowledgedAt,
                EMessagePropertyLastUnacknowledgedAt, lastUnacknowledgedAt,
                EMessagePropertyDeadLetteredAt, deadLetteredAt,
                EMessagePropertyExpired, messageExpired
            )
            processedCount = processedCount + 1
        end
    end
end

-- Update queue counters once per batch for performance.
if processedCount > 0 then
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyProcessingMessagesCount, -processedCount)
end
if deadLetteredCount > 0 then
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyDeadLetteredMessagesCount, deadLetteredCount)
end
if requeuedCount > 0 then
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyRequeuedMessagesCount, requeuedCount)
end

return processedCount
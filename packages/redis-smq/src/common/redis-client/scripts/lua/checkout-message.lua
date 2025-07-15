-- Description:
-- Atomically fetches a message for processing.
-- It first checks if the message status is 'pending'. If it is, it updates the
-- status to 'processing', increments the attempt counter, and returns the
-- complete message data.
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
--
-- Returns:
--   - The message data as a list of keys and values if successful.
--   - 'false' if the message does not exist or is not in a 'pending' state.

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

-- Atomically get the current status of the message.
local currentStatus = redis.call("HGET", keyMessage, EMessagePropertyStatus)

-- Only proceed if the message exists and its status is 'pending'.
-- This check is the core of the atomic operation.
if currentStatus ~= EMessagePropertyStatusPending then
    -- Return false if the message doesn't exist, is already processing,
    -- or is in another state (e.g., acknowledged, dead-lettered).
    return false
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
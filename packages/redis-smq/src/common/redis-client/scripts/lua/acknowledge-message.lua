local keyQueueProcessing = KEYS[1]
local keyQueueAcknowledged = KEYS[2]
local keyMessage = KEYS[3]

local EMessagePropertyStatus = ARGV[1]
local EMessagePropertyStatusAcknowledged = ARGV[2]
local storeMessages = ARGV[3]
local expireStoredMessages = ARGV[4]
local storedMessagesSize = ARGV[5]

-- Get the message ID from the processing queue
local messageId = redis.call("LPOP", keyQueueProcessing)

-- If no message was found, return early
if messageId == false then
    return nil
end

-- Update message status immediately
redis.call("HSET", keyMessage, EMessagePropertyStatus, EMessagePropertyStatusAcknowledged)

-- Only perform storage operations if needed
if storeMessages == '1' then
    -- Add to acknowledged queue
    redis.call("RPUSH", keyQueueAcknowledged, messageId)

    -- Apply expiration if configured
    if expireStoredMessages ~= '0' then
        redis.call("PEXPIRE", keyQueueAcknowledged, expireStoredMessages)
    end

    -- Trim the queue if size limit is set
    if storedMessagesSize ~= '0' then
        -- storedMessagesSize should be negative for proper trimming (to keep newest messages)
        redis.call("LTRIM", keyQueueAcknowledged, storedMessagesSize, -1)
    end
end

return messageId
local keyQueueProcessing = KEYS[1]
local keyQueueAcknowledged = KEYS[2]
local keyMessage = KEYS[3]

---

local EMessagePropertyStatus = ARGV[1]
local EMessagePropertyStatusAcknowledged = ARGV[2]
local storeMessages = ARGV[3]
local expireStoredMessages = ARGV[4]
local storedMessagesSize = ARGV[5]

local function updateMessageStatus()
    redis.call("HMSET", keyMessage, EMessagePropertyStatus, EMessagePropertyStatusAcknowledged)
end

local messageId = redis.call("LPOP", keyQueueProcessing)
if storeMessages == '1' then
    redis.call("RPUSH", keyQueueAcknowledged, messageId)
    if expireStoredMessages ~= '0' then
        redis.call("PEXPIRE", keyQueueAcknowledged, expireStoredMessages)
    end
    if storedMessagesSize ~= '0' then
        local result = redis.call("LTRIM", keyQueueAcknowledged, storedMessagesSize, -1)
        return result
    end
end
updateMessageStatus()
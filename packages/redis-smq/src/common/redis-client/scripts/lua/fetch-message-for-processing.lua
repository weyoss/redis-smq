local keyMessage = KEYS[1]

local EMessagePropertyStatus = ARGV[1]
local EMessagePropertyState = ARGV[2]
local EMessagePropertyMessage = ARGV[3]
local EMessagePropertyStatusProcessing = ARGV[4]

-- Fetch only the required fields in a single operation
local result = redis.call("HMGET", keyMessage, EMessagePropertyState, EMessagePropertyMessage)

-- Early return if either field is missing
if result[1] == false or result[2] == false then
    return false
end

-- Update the message status to processing
redis.call("HSET", keyMessage, EMessagePropertyStatus, EMessagePropertyStatusProcessing)

-- Return the message data
return result
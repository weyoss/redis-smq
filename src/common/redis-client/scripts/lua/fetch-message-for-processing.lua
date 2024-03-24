local keyMessage = KEYS[1]

local EMessagePropertyStatus = ARGV[1]
local EMessagePropertyState = ARGV[2]
local EMessagePropertyMessage = ARGV[3]
local EMessagePropertyStatusProcessing = ARGV[4]

local result = redis.call("HMGET", keyMessage, EMessagePropertyState, EMessagePropertyMessage)
if result[1] ~= false and result[2] ~= false then
    redis.call("HSET", keyMessage, EMessagePropertyStatus, EMessagePropertyStatusProcessing)
    return result
end

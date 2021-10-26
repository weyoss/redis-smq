--- KEYS[1] priority_queue
--- KEYS[2] processing_queue
local result = redis.call("ZRANGE", KEYS[1], 0, 0)
if #(result) then
    local message = result[1]
    redis.call("ZREM", KEYS[1], message)
    redis.call("RPUSH", KEYS[2], message)
    return message
end
return nil
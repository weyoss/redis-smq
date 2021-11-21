--- KEYS[1] source list key
--- KEYS[2] destination list key
if redis.call("EXISTS", KEYS[1]) == 1 then
    local result = redis.call("LRANGE", KEYS[1], 0, 0)
    if #(result) then
        local message = result[1]
        redis.call("LREM", KEYS[1], 1, message)
        redis.call("RPUSH", KEYS[2], message)
        return message
    end
end
return nil
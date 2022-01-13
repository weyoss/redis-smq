--- KEYS[1] sorted set key
--- KEYS[2] list key
if redis.call("EXISTS", KEYS[1]) == 1 then
    local result = redis.call("ZRANGE", KEYS[1], 0, 0)
    if #(result) then
        local message = result[1]
        redis.call("ZREM", KEYS[1], message)
        redis.call("RPUSH", KEYS[2], message)
        return message
    end
end
return nil
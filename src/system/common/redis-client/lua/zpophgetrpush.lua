--- KEYS[1] sorted set key
--- KEYS[2] hash key
--- KEYS[3] list key
if redis.call("EXISTS", KEYS[1]) == 1 then
    local result = redis.call("ZRANGE", KEYS[1], 0, 0)
    if #(result) then
        local messageId = result[1]
        local message = redis.call("HGET", KEYS[2], messageId)
        redis.call("ZREM", KEYS[1], messageId)
        redis.call("HDEL", KEYS[2], messageId)
        redis.call("RPUSH", KEYS[3], message)
        return message
    end
end
return nil
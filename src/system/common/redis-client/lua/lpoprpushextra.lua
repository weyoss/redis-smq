--- KEYS[1] source list key
--- KEYS[2] destination list key
--- ARGV[1] queue_size
--- ARGV[2] expire
if redis.call("EXISTS", KEYS[1]) == 1 then
    local result = redis.call("LRANGE", KEYS[1], 0, 0)
    if #(result) then
        local message = result[1]
        redis.call("LREM", KEYS[1], 1, message)
        redis.call("RPUSH", KEYS[2], message)
        if ARGV[1] ~= '0' then
            redis.call("LTRIM", KEYS[2], ARGV[1], -1)
        end
        if ARGV[2] ~= '0' then
            redis.call("PEXPIRE", KEYS[2], ARGV[2])
        end
        return message
    end
end
return nil
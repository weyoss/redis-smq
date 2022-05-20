--- KEYS[1] key_counter
--- ARGV[1] rate_limit
--- ARGV[2] expire 
local result = redis.call("GET", KEYS[1])
if result == false then
    redis.call("SET", KEYS[1], ARGV[1])
    redis.call("PEXPIRE", KEYS[1], ARGV[2]);
    return 0
end
local count = tonumber(result)
if count <= 1 then
    return 1
end
redis.call("DECR", KEYS[1])
return 0
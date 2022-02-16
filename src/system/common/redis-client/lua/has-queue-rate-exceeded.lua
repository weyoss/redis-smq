--- KEYS[1] key_counter
--- ARGV[1] rate_limit
--- ARGV[2] expire 
local count = redis.call("GET", KEYS[1])
if count == nil then
    count = ARGV[1]
end
count = tonumber(count)
if count <= 0 then
    return 1
else
 count = count - 1
 redis.call("SET", KEYS[1], count)
 redis.call("PEXPIRE", KEYS[1], ARGV[2], "NX");
 return 0
end


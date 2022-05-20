--- KEYS[1] lock_key
--- ARGV[1] lock_id
--- ARGV[2] ttl
if redis.call("get",KEYS[1]) == ARGV[1] then
    return redis.call("PEXPIRE", KEYS[1], ARGV[2])
end
return 0

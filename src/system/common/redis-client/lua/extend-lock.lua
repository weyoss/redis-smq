--- KEYS[1] lock_key
--- KEYS[2] lock_id
--- KEYS[3] ttl
if redis.call("get",KEYS[1]) == KEYS[2] then
    return redis.call("PEXPIRE", KEYS[1], KEYS[3])
else
    return 0
end

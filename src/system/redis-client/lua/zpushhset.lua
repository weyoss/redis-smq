--- KEYS[1] sorted set key
--- KEYS[2] hash key
--- KEYS[3] score key
--- KEYS[4] message id key
--- KEYS[5] message key
redis.call("ZADD", KEYS[1], KEYS[3], KEYS[4])
redis.call("HSET", KEYS[2], KEYS[4], KEYS[5])
return 1
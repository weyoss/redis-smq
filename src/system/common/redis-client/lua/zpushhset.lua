--- KEYS[1] sorted set key
--- KEYS[2] hash key
--- ARGV[1] score key
--- ARGV[2] message id key
--- ARGV[3] message key
redis.call("ZADD", KEYS[1], ARGV[1], ARGV[2])
redis.call("HSET", KEYS[2], ARGV[2], ARGV[3])
return 1
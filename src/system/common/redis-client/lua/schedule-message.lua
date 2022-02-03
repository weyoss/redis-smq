--- KEYS[1] keyQueues (set)
--- KEYS[2] keyScheduledMessages (sorted set)
--- KEYS[3] keyScheduledMessagesIndex (hash)
--- ARGV[1] queue
--- ARGV[2] message id
--- ARGV[3] message
--- ARGV[4] scheduleTimestamp
redis.call("SADD", KEYS[1], ARGV[1])
redis.call("ZADD", KEYS[2], ARGV[4], ARGV[2])
redis.call("HSET", KEYS[3], ARGV[2], ARGV[3])
return 1

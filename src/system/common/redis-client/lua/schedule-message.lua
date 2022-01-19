--- KEYS[1] keyQueues (set)
--- KEYS[2] queue
--- KEYS[3] message id
--- KEYS[4] message

--- KEYS[5] scheduleTimestamp
--- KEYS[6] keyScheduledMessages (sorted set)
--- KEYS[7] keyScheduledMessagesIndex (hash)
redis.call("SADD", KEYS[1], KEYS[2])
redis.call("ZADD", KEYS[6], KEYS[5], KEYS[3])
redis.call("HSET", KEYS[7], KEYS[3], KEYS[4])
return 1

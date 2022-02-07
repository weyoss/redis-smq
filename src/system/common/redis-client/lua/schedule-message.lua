--- KEYS[1] keyNamespaces
--- KEYS[2] keyNsQueues
--- KEYS[3] keyQueues (set)
--- KEYS[4] keyScheduledMessages (sorted set)
--- KEYS[5] keyScheduledMessagesIndex (hash)
--- ARGV[1] namespace
--- ARGV[2] queue
--- ARGV[3] message id
--- ARGV[4] message
--- ARGV[5] scheduleTimestamp

if redis.call("SISMEMBER", KEYS[1], ARGV[1]) == 0 then
    redis.call("SADD", KEYS[1], ARGV[1])
end
if redis.call("SISMEMBER", KEYS[2], ARGV[2]) == 0 then
    redis.call("SADD", KEYS[2], ARGV[2])
end
if redis.call("SISMEMBER", KEYS[3], ARGV[2]) == 0 then
    redis.call("SADD", KEYS[3], ARGV[2])
end
redis.call("ZADD", KEYS[4], ARGV[5], ARGV[3])
redis.call("HSET", KEYS[5], ARGV[3], ARGV[4])
return 1

--- KEYS[1] queue
--- KEYS[2] message
--- KEYS[3] message_priority
--- KEYS[4] key_message_metadata
--- KEYS[5] message_metadata_enqueued
--- KEYS[6] key_queue_metadata
--- KEYS[7] key_queue_metadata_enqueued
if (KEYS[3] == "-1") then
    redis.call("LPUSH", KEYS[1], KEYS[2])
else
    redis.call("ZADD", KEYS[1], KEYS[3], KEYS[2])
end
redis.call("RPUSH", KEYS[4], KEYS[5])
redis.call("HINCRBY", KEYS[6], KEYS[7], 1)
return "OK"
--- KEYS[1] scheduled_messages_queue
--- KEYS[2] message
--- KEYS[3] schedule_timestamp
--- KEYS[4] key_metadata_message
--- KEYS[5] message_metadata_scheduled
--- KEYS[6] key_metadata_queue
--- KEYS[7] queue_metadata_scheduled
redis.call("ZADD", KEYS[1], KEYS[3], KEYS[2])
redis.call("RPUSH", KEYS[4], KEYS[5])
redis.call("HINCRBY", KEYS[6], KEYS[7], 1)
return "OK"
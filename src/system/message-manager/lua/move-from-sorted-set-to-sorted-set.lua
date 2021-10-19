--- KEYS[1] src_queue
--- KEYS[2] dst_queue
--- KEYS[3] message
--- KEYS[4] new_message
--- KEYS[5] message_priority
--- KEYS[6] key_metadata_message
--- KEYS[7] src_message_metadata
--- KEYS[8] dst_message_metadata
--- KEYS[9] key_metadata_queue
--- KEYS[10] src_queue_metadata_property
--- KEYS[11] dst_queue_metadata_property
if redis.call("EXISTS", KEYS[1]) == 1 then
    if redis.call("ZREM", KEYS[1], KEYS[3]) == 1 then
        redis.call("ZADD", KEYS[2], KEYS[5], KEYS[4])
        redis.call("RPUSH", KEYS[6], KEYS[7])
        redis.call("RPUSH", KEYS[6], KEYS[8])
        redis.call("HINCRBY", KEYS[9], KEYS[10], -1)
        redis.call("HINCRBY", KEYS[9], KEYS[11], 1)
        return "OK"
    end
end
return nil
--- KEYS[1] src_queue
--- KEYS[2] dst_queue
--- KEYS[3] message
--- KEYS[4] new_message
--- KEYS[5] key_metadata_message
--- KEYS[6] src_message_metadata
--- KEYS[7] dst_message_metadata
--- KEYS[8] key_metadata_queue
--- KEYS[9] src_queue_metadata_property
--- KEYS[10] dst_queue_metadata_property
if redis.call("EXISTS", KEYS[1]) == 1 then
    if redis.call("ZREM", KEYS[1], KEYS[3]) == 1 then
        redis.call("LPUSH", KEYS[2], KEYS[4])
        redis.call("RPUSH", KEYS[5], KEYS[6])
        redis.call("RPUSH", KEYS[5], KEYS[7])
        redis.call("HINCRBY", KEYS[8], KEYS[9], -1)
        redis.call("HINCRBY", KEYS[8], KEYS[10], 1)
        return "OK"
    end
end
return nil
--- KEYS[1] processing_queue
--- KEYS[2] dst_queue
--- KEYS[3] message
--- KEYS[4] new_message
--- KEYS[5] timestamp
--- KEYS[6] key_message_metadata
--- KEYS[7] message_metadata_acknowledged
--- KEYS[8] key_queue_metadata
--- KEYS[9] queue_metadata_pending
--- KEYS[10] queue_metadata_acknowledged
if redis.call("EXISTS", KEYS[1]) == 1 then
    if redis.call("LREM", KEYS[1], 1, KEYS[3]) == 1 then
        redis.call("ZADD", KEYS[2], KEYS[5], KEYS[4])
        redis.call("RPUSH", KEYS[6], KEYS[7])
        redis.call("HINCRBY", KEYS[8], KEYS[9], -1)
        redis.call("HINCRBY", KEYS[8], KEYS[10], 1)
        return "OK"
    end
end
return nil
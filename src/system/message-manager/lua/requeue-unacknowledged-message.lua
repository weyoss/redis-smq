--- KEYS[1] processing_queue
--- KEYS[2] dst_queue
--- KEYS[3] message
--- KEYS[4] new_message
--- KEYS[5] timestamp
--- KEYS[6] key_metadata_message
--- KEYS[7] message_metadata_unacknowledged
--- KEYS[8] message_metadata_enqueued
if redis.call("EXISTS", KEYS[1]) == 1 then
    if redis.call("LREM", KEYS[1], 1, KEYS[3]) == 1 then
        if (KEYS[5] == "-1") then
            redis.call("LPUSH", KEYS[2], KEYS[4])
        else
            redis.call("ZADD", KEYS[2], KEYS[5], KEYS[4])
        end
        redis.call("RPUSH", KEYS[6], KEYS[7])
        redis.call("RPUSH", KEYS[6], KEYS[8])
        return "OK"
    end
end
return nil
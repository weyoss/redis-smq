--- KEYS[1] src_queue
--- KEYS[2] dst_queue
--- KEYS[3] message
--- KEYS[4] new_message
--- KEYS[5] message_priority
--- KEYS[6] key_metadata_message
--- KEYS[7] message_metadata_enqueued
--- KEYS[8] key_metadata_queue
--- KEYS[9] queue_metadata_scheduled
--- KEYS[10] queue_metadata_enqueued
--- KEYS[11] next_schedule_timestamp
if redis.call("EXISTS", KEYS[1]) == 1 then
    local removed = redis.call("ZREM", KEYS[1], KEYS[3])
    if removed == 1 then
        if (KEYS[5] == "-1") then
            redis.call("LPUSH", KEYS[2], KEYS[4])
        else
            redis.call("ZADD", KEYS[2], KEYS[5], KEYS[4])
        end
        redis.call("RPUSH", KEYS[6], KEYS[7])
        redis.call("HINCRBY", KEYS[8], KEYS[9], -1)
        redis.call("HINCRBY", KEYS[8], KEYS[10], 1)
        if (KEYS[11] ~= "-1") then
            redis.call("ZADD", KEYS[1], KEYS[11], KEYS[4])
            redis.call("HINCRBY", KEYS[8], KEYS[9], 1)
        end
        return KEYS[4]
    else
        return KEYS[3]
    end
end
return nil
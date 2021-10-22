--- KEYS[1] priority_queue
--- KEYS[2] message
--- KEYS[3] key_message_metadata
--- KEYS[4] message_metadata_deleted
--- KEYS[5] key_queue_metadata
--- KEYS[6] queue_metadata_deleted
if redis.call("EXISTS", KEYS[1]) == 1 then
    if redis.call("LREM", KEYS[1], 1, KEYS[2]) == 1 then
        redis.call("RPUSH", KEYS[3], KEYS[4])
        redis.call("HINCRBY", KEYS[5], KEYS[6], -1)
        return "OK"
    end
end
return nil
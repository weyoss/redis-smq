--- KEYS[1] priority_queue
--- KEYS[2] message
--- KEYS[3] keyMetadataMessage
--- KEYS[4] metadataMessage
--- KEYS[5] keyMetadataQueue
--- KEYS[6] EQueueMetadataType
if redis.call("EXISTS", KEYS[1]) == 1 then
    if redis.call("ZREM", KEYS[1], KEYS[2]) == 1 then
        redis.call("RPUSH", KEYS[3], KEYS[4])
        redis.call("HINCRBY", KEYS[5], KEYS[6], -1)
        return "OK"
    end
end
return nil
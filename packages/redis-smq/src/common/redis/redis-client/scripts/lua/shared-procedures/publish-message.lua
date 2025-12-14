-- This is a library file and is not meant to be executed directly.
-- It should be prepended to other Lua scripts before they are loaded into Redis.

local function publish_message(keys, args)
    -- KEYS
    local keyQueueProperties = keys[1]
    local keyPriorityQueue = keys[2]
    local keyQueuePending = keys[3]
    local keyQueueScheduled = keys[4]
    local keyQueueMessages = keys[5]
    local keyQueueConsumerGroups = keys[6]
    local keyMessage = keys[7]

    -- ARGV
    -- Queue properties (1-7)
    local EQueuePropertyQueueType = args[1]
    local EQueuePropertyMessagesCount = args[2]
    local EQueuePropertyPendingMessagesCount = args[3]
    local EQueuePropertyScheduledMessagesCount = args[4]
    local EQueuePropertyQueueTypePriorityQueue = args[5]
    local EQueuePropertyQueueTypeLIFOQueue = args[6]
    local EQueuePropertyQueueTypeFIFOQueue = args[7]

    -- Message priority and scheduling (8-11)
    local messagePriority = args[8]
    local scheduledTimestamp = args[9]
    local EMessagePropertyStatusScheduled = args[10]
    local EMessagePropertyStatusPending = args[11]

    -- Message Property Keys (12-34)
    local EMessagePropertyId = args[12]
    local EMessagePropertyStatus = args[13]
    local EMessagePropertyMessage = args[14]
    local EMessagePropertyScheduledAt = args[15]
    local EMessagePropertyPublishedAt = args[16]
    local EMessagePropertyProcessingStartedAt = args[17]
    local EMessagePropertyDeadLetteredAt = args[18]
    local EMessagePropertyAcknowledgedAt = args[19]
    local EMessagePropertyUnacknowledgedAt = args[20]
    local EMessagePropertyLastUnacknowledgedAt = args[21]
    local EMessagePropertyLastScheduledAt = args[22]
    local EMessagePropertyRequeuedAt = args[23]
    local EMessagePropertyRequeueCount = args[24]
    local EMessagePropertyLastRequeuedAt = args[25]
    local EMessagePropertyLastRetriedAttemptAt = args[26]
    local EMessagePropertyScheduledCronFired = args[27]
    local EMessagePropertyAttempts = args[28]
    local EMessagePropertyScheduledRepeatCount = args[29]
    local EMessagePropertyExpired = args[30]
    local EMessagePropertyEffectiveScheduledDelay = args[31]
    local EMessagePropertyScheduledTimes = args[32]
    local EMessagePropertyScheduledMessageParentId = args[33]
    local EMessagePropertyRequeuedMessageParentId = args[34]

    -- Message Property Values (35-57)
    local messageId = args[35]
    local messageStatus = args[36]
    local message = args[37]
    local messageScheduledAt = args[38]
    local messagePublishedAt = args[39]
    local messageProcessingStartedAt = args[40]
    local messageDeadLetteredAt = args[41]
    local messageAcknowledgedAt = args[42]
    local messageUnacknowledgedAt = args[43]
    local messageLastUnacknowledgedAt = args[44]
    local messageLastScheduledAt = args[45]
    local messageRequeuedAt = args[46]
    local messageRequeueCount = args[47]
    local messageLastRequeuedAt = args[48]
    local messageLastRetriedAttemptAt = args[49]
    local messageScheduledCronFired = args[50]
    local messageAttempts = args[51]
    local messageScheduledRepeatCount = args[52]
    local messageExpired = args[53]
    local messageEffectiveScheduledDelay = args[54]
    local messageScheduledTimes = args[55]
    local messageScheduledMessageParentId = args[56]
    local messageRequeuedMessageParentId = args[57]

    -- Consumer Group ID (58)
    local consumerGroupId = args[58]

    -- Get queue type with a single field fetch
    local queueType = redis.call("HGET", keyQueueProperties, EQueuePropertyQueueType)

    -- Early return if queue doesn't exist
    if queueType == false then
        return 'QUEUE_NOT_FOUND'
    end

    -- If a consumer group ID is provided, verify it exists.
    if consumerGroupId and consumerGroupId ~= '' then
        if redis.call("SISMEMBER", keyQueueConsumerGroups, consumerGroupId) == 0 then
            return 'CONSUMER_GROUP_NOT_FOUND'
        end
    end

    -- Idempotency check: prevent overwriting an existing message
    if redis.call("SISMEMBER", keyQueueMessages, messageId) == 1 then
        return 'MESSAGE_ALREADY_EXISTS'
    end

    if messageStatus == EMessagePropertyStatusPending then
        -- Handle different queue types
        if queueType == EQueuePropertyQueueTypePriorityQueue then
            if messagePriority == nil or messagePriority == '' then
                return 'MESSAGE_PRIORITY_REQUIRED'
            end
            redis.call("ZADD", keyPriorityQueue, messagePriority, messageId)
        else
            if not (messagePriority == nil or messagePriority == '') then
                return 'PRIORITY_QUEUING_NOT_ENABLED'
            end
            if queueType == EQueuePropertyQueueTypeLIFOQueue then
                redis.call("RPUSH", keyQueuePending, messageId)
            elseif queueType == EQueuePropertyQueueTypeFIFOQueue then
                redis.call("LPUSH", keyQueuePending, messageId)
            else
                return 'UNKNOWN_QUEUE_TYPE'
            end
        end
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyPendingMessagesCount, 1)
    else
        -- Add to scheduled queue
        redis.call("ZADD", keyQueueScheduled, scheduledTimestamp, messageId)
        redis.call("HINCRBY", keyQueueProperties, EQueuePropertyScheduledMessagesCount, 1)
    end

    -- Add message to queue's global message set
    redis.call("SADD", keyQueueMessages, messageId)

    -- For maximum script performance, all properties are passed directly to a
    -- single HSET command. This eliminates conditional checks and table overhead.
    -- The trade-off is that empty strings will be stored in Redis for unset properties.
    redis.call("HSET", keyMessage,
            EMessagePropertyId, messageId,
            EMessagePropertyStatus, messageStatus,
            EMessagePropertyMessage, message,
            EMessagePropertyScheduledAt, messageScheduledAt,
            EMessagePropertyPublishedAt, messagePublishedAt,
            EMessagePropertyProcessingStartedAt, messageProcessingStartedAt,
            EMessagePropertyDeadLetteredAt, messageDeadLetteredAt,
            EMessagePropertyAcknowledgedAt, messageAcknowledgedAt,
            EMessagePropertyUnacknowledgedAt, messageUnacknowledgedAt,
            EMessagePropertyLastUnacknowledgedAt, messageLastUnacknowledgedAt,
            EMessagePropertyLastScheduledAt, messageLastScheduledAt,
            EMessagePropertyRequeuedAt, messageRequeuedAt,
            EMessagePropertyRequeueCount, messageRequeueCount,
            EMessagePropertyLastRequeuedAt, messageLastRequeuedAt,
            EMessagePropertyLastRetriedAttemptAt, messageLastRetriedAttemptAt,
            EMessagePropertyScheduledCronFired, messageScheduledCronFired,
            EMessagePropertyAttempts, messageAttempts,
            EMessagePropertyScheduledRepeatCount, messageScheduledRepeatCount,
            EMessagePropertyExpired, messageExpired,
            EMessagePropertyEffectiveScheduledDelay, messageEffectiveScheduledDelay,
            EMessagePropertyScheduledTimes, messageScheduledTimes,
            EMessagePropertyScheduledMessageParentId, messageScheduledMessageParentId,
            EMessagePropertyRequeuedMessageParentId, messageRequeuedMessageParentId
    )

    -- Increment total messages count
    redis.call("HINCRBY", keyQueueProperties, EQueuePropertyMessagesCount, 1)

    return 'OK'
end
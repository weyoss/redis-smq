--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
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
    -- Queue properties (1-12)
    local EQueuePropertyQueueType = args[1]
    local EQueuePropertyMessagesCount = args[2]
    local EQueuePropertyPendingMessagesCount = args[3]
    local EQueuePropertyScheduledMessagesCount = args[4]
    local EQueuePropertyQueueTypePriorityQueue = args[5]
    local EQueuePropertyQueueTypeLIFOQueue = args[6]
    local EQueuePropertyQueueTypeFIFOQueue = args[7]
    local EQueuePropertyOperationalState = args[8]
    local EQueuePropertyLockId = args[9]
    local EQueueOperationalStateActive = args[10]
    local EQueueOperationalStatePaused = args[11]
    local EQueueOperationalStateStopped = args[12]
    local EQueueOperationalStateLocked = args[13]

    -- Message priority and scheduling (14-17)
    local messagePriority = args[14]
    local scheduledTimestamp = args[15]
    local EMessagePropertyStatusScheduled = args[16]
    local EMessagePropertyStatusPending = args[17]

    -- Message Property Keys (18-40)
    local EMessagePropertyId = args[18]
    local EMessagePropertyStatus = args[19]
    local EMessagePropertyMessage = args[20]
    local EMessagePropertyScheduledAt = args[21]
    local EMessagePropertyPublishedAt = args[22]
    local EMessagePropertyProcessingStartedAt = args[23]
    local EMessagePropertyDeadLetteredAt = args[24]
    local EMessagePropertyAcknowledgedAt = args[25]
    local EMessagePropertyUnacknowledgedAt = args[26]
    local EMessagePropertyLastUnacknowledgedAt = args[27]
    local EMessagePropertyLastScheduledAt = args[28]
    local EMessagePropertyRequeuedAt = args[29]
    local EMessagePropertyRequeueCount = args[30]
    local EMessagePropertyLastRequeuedAt = args[31]
    local EMessagePropertyLastRetriedAttemptAt = args[32]
    local EMessagePropertyScheduledCronFired = args[33]
    local EMessagePropertyAttempts = args[34]
    local EMessagePropertyScheduledRepeatCount = args[35]
    local EMessagePropertyExpired = args[36]
    local EMessagePropertyEffectiveScheduledDelay = args[37]
    local EMessagePropertyScheduledTimes = args[38]
    local EMessagePropertyScheduledMessageParentId = args[39]
    local EMessagePropertyRequeuedMessageParentId = args[40]

    -- Message Property Values (41-63)
    local messageId = args[41]
    local messageStatus = args[42]
    local message = args[43]
    local messageScheduledAt = args[44]
    local messagePublishedAt = args[45]
    local messageProcessingStartedAt = args[46]
    local messageDeadLetteredAt = args[47]
    local messageAcknowledgedAt = args[48]
    local messageUnacknowledgedAt = args[49]
    local messageLastUnacknowledgedAt = args[50]
    local messageLastScheduledAt = args[51]
    local messageRequeuedAt = args[52]
    local messageRequeueCount = args[53]
    local messageLastRequeuedAt = args[54]
    local messageLastRetriedAttemptAt = args[55]
    local messageScheduledCronFired = args[56]
    local messageAttempts = args[57]
    local messageScheduledRepeatCount = args[58]
    local messageExpired = args[59]
    local messageEffectiveScheduledDelay = args[60]
    local messageScheduledTimes = args[61]
    local messageScheduledMessageParentId = args[62]
    local messageRequeuedMessageParentId = args[63]

    -- Consumer Group ID (64)
    local consumerGroupId = args[64]

    -- Lock ID for locked queue access (65) - New: optional lock ID for publishing to locked queues
    local operationLockId = args[65]

    -- Get queue type and operational state with a single multi-get call
    local queueProps = redis.call("HMGET", keyQueueProperties,
        EQueuePropertyQueueType,
        EQueuePropertyOperationalState,
        EQueuePropertyLockId)

    local queueType = queueProps[1]
    local operationalState = queueProps[2]
    local currentLockId = queueProps[3]

    -- Early return if queue doesn't exist
    if queueType == false then
        return 'QUEUE_NOT_FOUND'
    end

    -- Check queue operational state
    if operationalState == false then
        -- Default to ACTIVE if operational state is not set
        operationalState = EQueueOperationalStateActive
    end

    -- Validate queue state for publishing
    if operationalState == EQueueOperationalStateStopped then
        -- Queue is completely stopped, no publishing allowed
        return 'QUEUE_STOPPED'
    elseif operationalState == EQueueOperationalStateLocked then
        -- Queue is locked, check if operationLockId matches
        if not operationLockId or operationLockId == '' or
           not currentLockId or currentLockId == '' or
           operationLockId ~= currentLockId then
            return 'QUEUE_LOCKED'
        end
        -- Lock ID matches, allow publishing
    elseif operationalState == EQueueOperationalStatePaused then
        -- Queue is paused, publishing is allowed (only consumption is blocked)
        -- This is allowed, so continue
    elseif operationalState == EQueueOperationalStateActive then
        -- Queue is active, publishing is allowed
        -- This is allowed, so continue
    else
        -- Unknown state, reject as a safety measure
        return 'QUEUE_INVALID_STATE'
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
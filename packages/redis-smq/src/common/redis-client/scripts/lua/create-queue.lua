-- Description:
-- Creates a new queue and atomically initializes all of its properties,
-- including counters, rate limits, and exchange bindings.
--
-- KEYS[1]: keyNamespaces
-- KEYS[2]: keyNsQueues
-- KEYS[3]: keyQueues
-- KEYS[4]: keyQueueProperties
--
-- ARGV:
-- ARGV[1-2]: General queue parameters (namespace, queue)
-- ARGV[3-18]: All queue property keys and their corresponding values.
--
-- Returns:
--   - 'OK' on success
--   - 'QUEUE_EXISTS' if the queue already exists

-- Static Keys
local keyNamespaces = KEYS[1]
local keyNsQueues = KEYS[2]
local keyQueues = KEYS[3]
local keyQueueProperties = KEYS[4]

-- Arguments
local namespace = ARGV[1]
local queue = ARGV[2]
local queuePropertiesQueueType = ARGV[3]
local queueType = ARGV[4]
local queuePropertiesQueueDeliveryModel = ARGV[5]
local deliveryModel = ARGV[6]
local queuePropertiesRateLimit = ARGV[7]
local rateLimit = ARGV[8]
local queuePropertiesFanoutExchange = ARGV[9]
local fanoutExchange = ARGV[10]
local queuePropertiesMessagesCount = ARGV[11]
local queuePropertiesAcknowledgedMessagesCount = ARGV[12]
local queuePropertiesDeadLetteredMessagesCount = ARGV[13]
local queuePropertiesPendingMessagesCount = ARGV[14]
local queuePropertiesScheduledMessagesCount = ARGV[15]
local queuePropertiesProcessingMessagesCount = ARGV[16]
local queuePropertiesDelayedMessagesCount = ARGV[17]
local queuePropertiesRequeuedMessagesCount = ARGV[18]

-- Check if queue already exists to prevent overwriting
if redis.call("SISMEMBER", keyQueues, queue) == 1 then
    return 'QUEUE_EXISTS'
end

-- Add queue to the global and namespace-specific sets
redis.call("SADD", keyQueues, queue)
redis.call("SADD", keyNsQueues, queue)
redis.call("SADD", keyNamespaces, namespace)

-- Set all properties in one atomic command.
-- Optional properties like rateLimit and exchange are set unconditionally.
-- The client is responsible for passing an empty string ('') if they are not set.
redis.call("HSET", keyQueueProperties,
        queuePropertiesQueueType, queueType,
        queuePropertiesQueueDeliveryModel, deliveryModel,
        queuePropertiesRateLimit, rateLimit,
        queuePropertiesFanoutExchange, fanoutExchange,
        -- Initialize all counters to 0 for a consistent state
        queuePropertiesMessagesCount, 0,
        queuePropertiesAcknowledgedMessagesCount, 0,
        queuePropertiesDeadLetteredMessagesCount, 0,
        queuePropertiesPendingMessagesCount, 0,
        queuePropertiesScheduledMessagesCount, 0,
        queuePropertiesProcessingMessagesCount, 0,
        queuePropertiesDelayedMessagesCount, 0,
        queuePropertiesRequeuedMessagesCount, 0
)

return 'OK'
-- Description:
-- Publishes a message to a queue. This script is optimized for maximum performance
-- by using a static HSET command, passing all properties directly.
-- It includes an idempotency check to prevent duplicate messages.
--
-- KEYS[1]: keyQueueProperties
-- KEYS[2]: keyPriorityQueue
-- KEYS[3]: keyQueuePending
-- KEYS[4]: keyQueueScheduled
-- KEYS[5]: keyQueueMessages
-- KEYS[6]: keyMessage
--
-- ARGV layout:
-- ARGV[1-11]: Queue property keys and scheduling values
-- ARGV[12-34]: Message property keys (22 keys)
-- ARGV[35-57]: Message property values (22 values)

--
-- This script depends on 'shared-procedures/publish-message.lua'.
-- The content of 'shared-procedures/publish-message.lua' must be prepended to this script before loading it into Redis.
--

return publish_message(KEYS, ARGV);

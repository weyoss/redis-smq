# Migrating from RedisSMQ v5.x.x to v6.x.x

> Before upgrading, you should make a backup or finish processing your messages in case you have if you any important data.

To avoid conflicts and to prevent data lost, the Redis keys "version" has been bumped up. So your existing data would not be touched.

Upgrading your installation to the newest version should be straightforward as most APIs are compatible, with some exceptions:


**1. Publishing a message**

The Producer API has been updated, and it is not compatible with previous release. Major updates include:

- Now using the same producer instance, you can now produce multiple messages to different queues. Do not forget to set up the message queue (`setQueue()`). Otherwise, an error will be returned.
- From a single producer instance you are now able to publish priority messages and non-priority messages, without the need to create a separate producer with priority queuing enabled for priority messages.
- When setting up a priority for a given message, `priority queuing` for the message will be enabled, and the message will be published to its priority queue (you don't need anymore to enable priority queuing in your configuration object).

See [Producer API Reference](/docs/api/producer.md) for more details.

**2. Consuming messages**

The Consumer API has been updated, and it is not compatible with previous release. Major updates include:

- From a single consumer instance, you are now able to consume messages from different queues, including messages from priority queues.
- You don't need anymore to have a dedicated consumer instance for consuming messages with priority.

See [Consumer API Reference](/docs/api/consumer.md) for more details.

**3. Configuration**

- Consumer, Producer, MessageManager.getSingletonInstance(), and QueueManager.getSingletonInstance() no more accept a configuration object as the first argument. You can configure RedisSMQ globally using `setConfiguration()` from `redis-smq` package. 
- Removed `priorityQueue` parameter from the configuration parameters.
- Renamed `log` parameter to `logger`.

See [Configuration](/docs/configuration.md) for more details. 

**4. Refactored MessageManager API**

Major updates include:
- Method renaming
- Method signature changes
- New methods migrated from QueueManager

See [MessageManager API](/docs/api/message-manager.md) and [QueueManager API](/docs/api/queue-manager.md) for more details.

**5. Refactored QueueManager API**

Major updates include:
- Method renaming
- Method signature changes
- Some methods have been migrated to MessageManager

See [MessageManager API](/docs/api/message-manager.md) and [QueueManager API](/docs/api/queue-manager.md) for more details.

**6. Updated HTTP API endpoints**

See [HTTP API Reference](http-api.md) for more details.

[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisSMQConfig

# Interface: IRedisSMQConfig

## Properties

### eventBus?

> `optional` **eventBus**: [`IEventBusConfig`](IEventBusConfig.md)

#### See

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/event-bus.md

***

### logger?

> `optional` **logger**: `ILoggerConfig`

#### See

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq-common/docs/api/interfaces/ILoggerConfig.md

***

### messages?

> `optional` **messages**: [`IMessagesConfig`](IMessagesConfig.md)

#### See

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/message-storage.md

***

### namespace?

> `optional` **namespace**: `string`

Logical namespace for all queues, exchanges, and Redis keys used by RedisSMQ.

Purpose:
- Isolates resources between applications/environments.
- Used whenever an operation does not explicitly pass a namespace.

Defaults:
- If omitted, the default namespace is used (see defaultConfig.namespace).

***

### redis?

> `optional` **redis**: `IRedisConfig`

#### See

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq-common/docs/api/interfaces/IRedisConfig.md

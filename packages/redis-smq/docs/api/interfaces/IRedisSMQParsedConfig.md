[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisSMQParsedConfig

# Interface: IRedisSMQParsedConfig

## Extends

- `Required`\<[`IRedisSMQConfig`](IRedisSMQConfig.md)\>

## Extended by

- [`IRedisSMQDefaultConfig`](IRedisSMQDefaultConfig.md)

## Properties

### eventBus

> **eventBus**: `Required`\<[`IEventBusConfig`](IEventBusConfig.md)\>

#### See

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/event-bus.md

#### Overrides

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`eventBus`](IRedisSMQConfig.md#eventbus)

***

### logger

> **logger**: `ILoggerConfig`

#### See

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq-common/docs/api/interfaces/ILoggerConfig.md

#### Inherited from

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`logger`](IRedisSMQConfig.md#logger)

***

### messages

> **messages**: `object`

#### store

> **store**: [`IMessagesStorageParsedConfig`](IMessagesStorageParsedConfig.md)

#### See

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/message-storage.md

#### Overrides

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`messages`](IRedisSMQConfig.md#messages)

***

### namespace

> **namespace**: `string`

#### Inherited from

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`namespace`](IRedisSMQConfig.md#namespace)

***

### redis

> **redis**: `IRedisConfig`

#### See

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq-common/docs/api/interfaces/IRedisConfig.md

#### Inherited from

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`redis`](IRedisSMQConfig.md#redis)

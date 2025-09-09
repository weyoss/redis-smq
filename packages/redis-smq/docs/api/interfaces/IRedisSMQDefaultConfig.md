[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisSMQDefaultConfig

# Interface: IRedisSMQDefaultConfig

## Extends

- [`IRedisSMQParsedConfig`](IRedisSMQParsedConfig.md)

## Properties

### eventBus

> **eventBus**: `Required`\<[`IEventBusConfig`](IEventBusConfig.md)\>

#### See

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/event-bus.md

#### Inherited from

[`IRedisSMQParsedConfig`](IRedisSMQParsedConfig.md).[`eventBus`](IRedisSMQParsedConfig.md#eventbus)

***

### logger

> **logger**: `object`

#### enabled

> **enabled**: `boolean`

#### options

> **options**: `Required`\<`IConsoleLoggerOptions`\>

#### See

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq-common/docs/api/interfaces/ILoggerConfig.md

#### Overrides

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`logger`](IRedisSMQConfig.md#logger)

***

### messages

> **messages**: `object`

#### store

> **store**: [`IMessagesStorageParsedConfig`](IMessagesStorageParsedConfig.md)

#### See

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/message-storage.md

#### Inherited from

[`IRedisSMQParsedConfig`](IRedisSMQParsedConfig.md).[`messages`](IRedisSMQParsedConfig.md#messages)

***

### namespace

> **namespace**: `string`

#### Inherited from

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`namespace`](IRedisSMQConfig.md#namespace)

***

### redis

> **redis**: `object`

#### client

> **client**: `IOREDIS`

#### options

> **options**: `object`

##### options.db

> **db**: `number`

##### options.host

> **host**: `string`

##### options.port

> **port**: `number`

#### See

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq-common/docs/api/interfaces/IRedisConfig.md

#### Overrides

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`redis`](IRedisSMQConfig.md#redis)

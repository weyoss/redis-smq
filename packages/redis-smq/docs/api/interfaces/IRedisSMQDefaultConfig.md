[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisSMQDefaultConfig

# Interface: IRedisSMQDefaultConfig

## Extends

- [`IRedisSMQParsedConfig`](IRedisSMQParsedConfig.md)

## Properties

### eventBus

> **eventBus**: `Required`\<[`IEventBusConfig`](IEventBusConfig.md)\>

#### See

/packages/redis-smq/docs/event-bus.md

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

/packages/redis-smq-common/docs/api/interfaces/ILoggerConfig.md

#### Overrides

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`logger`](IRedisSMQConfig.md#logger)

***

### messageAudit

> **messageAudit**: [`IMessageAuditParsedConfig`](IMessageAuditParsedConfig.md)

#### Inherited from

[`IRedisSMQParsedConfig`](IRedisSMQParsedConfig.md).[`messageAudit`](IRedisSMQParsedConfig.md#messageaudit)

***

### namespace

> **namespace**: `string`

Logical namespace for all queues, exchanges, and Redis keys used by RedisSMQ.

Purpose:
- Isolates resources between applications/environments.
- Used whenever an operation does not explicitly pass a namespace.

Defaults:
- If omitted, the default namespace is used (see defaultConfig.namespace).

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

/packages/redis-smq-common/docs/api/interfaces/IRedisConfig.md

#### Overrides

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`redis`](IRedisSMQConfig.md#redis)

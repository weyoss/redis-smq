[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisSMQParsedConfig

# Interface: IRedisSMQParsedConfig

## Extends

- `Required`\<`Omit`\<[`IRedisSMQConfig`](IRedisSMQConfig.md), `"messageAudit"`\>\>

## Extended by

- [`IRedisSMQDefaultConfig`](IRedisSMQDefaultConfig.md)

## Properties

### eventBus

> **eventBus**: `Required`\<[`IEventBusConfig`](IEventBusConfig.md)\>

#### See

/packages/redis-smq/docs/event-bus.md

#### Overrides

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`eventBus`](IRedisSMQConfig.md#eventbus)

***

### logger

> **logger**: `ILoggerConfig`

#### See

/packages/redis-smq-common/docs/api/interfaces/ILoggerConfig.md

#### Inherited from

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`logger`](IRedisSMQConfig.md#logger)

***

### messageAudit

> **messageAudit**: [`IMessageAuditParsedConfig`](IMessageAuditParsedConfig.md)

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

> **redis**: `IRedisConfig`

#### See

/packages/redis-smq-common/docs/api/interfaces/IRedisConfig.md

#### Inherited from

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`redis`](IRedisSMQConfig.md#redis)

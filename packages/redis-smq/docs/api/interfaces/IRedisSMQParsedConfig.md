[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IRedisSMQParsedConfig

# Interface: IRedisSMQParsedConfig

## Extends

- `Required`\<`Omit`\<[`IRedisSMQConfig`](IRedisSMQConfig.md), `"messageAudit"`\>\>

## Extended by

- [`IRedisSMQDefaultConfig`](IRedisSMQDefaultConfig.md)

## Properties

### logger

> **logger**: `ILoggerConfig`

#### See

/packages/redis-smq-common/docs/api/interfaces/ILoggerConfig.md

#### Inherited from

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`logger`](IRedisSMQConfig.md#logger)

---

### messageAudit

> **messageAudit**: [`IMessageAuditParsedConfig`](IMessageAuditParsedConfig.md)

---

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

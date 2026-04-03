[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IRedisSMQDefaultConfig

# Interface: IRedisSMQDefaultConfig

## Extends

- [`IRedisSMQParsedConfig`](IRedisSMQParsedConfig.md)

## Properties

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

---

### messageAudit

> **messageAudit**: [`IMessageAuditParsedConfig`](IMessageAuditParsedConfig.md)

#### Inherited from

[`IRedisSMQParsedConfig`](IRedisSMQParsedConfig.md).[`messageAudit`](IRedisSMQParsedConfig.md#messageaudit)

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

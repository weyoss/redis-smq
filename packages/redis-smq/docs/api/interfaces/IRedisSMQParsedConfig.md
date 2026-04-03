[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IRedisSMQParsedConfig

# Interface: IRedisSMQParsedConfig

## Extends

- `Required`\<`Omit`\<[`IRedisSMQConfig`](IRedisSMQConfig.md), `"messageAudit"` \| `"logger"`\>\>

## Properties

### logger

> **logger**: [`ILoggerParsedConfig`](ILoggerParsedConfig.md)

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

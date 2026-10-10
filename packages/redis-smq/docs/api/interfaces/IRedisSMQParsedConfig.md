[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IRedisSMQParsedConfig

# Interface: IRedisSMQParsedConfig

A fully-resolved configuration.

This is what `IConfigManager.getConfig()` returns and what every
internal component reads. Every field is populated, every union has
been narrowed, and every nested object has been normalized.

Differences from `IRedisSMQConfig`:

- `namespace` is required and validated.
- `logger` is a `ILoggerParsedConfig` with a resolved `enabled`
  boolean and a complete `options` object.
- `messageAudit` is an `IMessageAuditParsedConfig` where every
  category is present with all its fields populated, regardless of
  whether the user supplied them individually or via the shorthand
  `true` / `false` forms.

The top-level object is frozen by the library. Nested objects are
shared by reference; callers must not mutate any part of the returned
value.

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

Logical namespace for the queues, exchanges, and Redis keys this
instance manages.

Purpose:

- Isolates resources between applications and environments.
- Serves as the default namespace for any operation that does not
  specify one.

A namespace is a short lowercase string. It is used as a segment in
every Redis key the library writes, so it must satisfy the
library's key-validity rules: start with a letter, contain only
letters, digits, and the characters `-`, `_`, and `.`.

Defaults to `'default'` when omitted.

#### Example

```ts
// Two deployments sharing one Redis instance
const app1 = { namespace: 'billing' };
const app2 = { namespace: 'shipping' };
```

#### Inherited from

[`IRedisSMQConfig`](IRedisSMQConfig.md).[`namespace`](IRedisSMQConfig.md#namespace)

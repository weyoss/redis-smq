[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisSMQErrorOptions

# Type Alias: IRedisSMQErrorOptions\<Metadata\>

> **IRedisSMQErrorOptions**\<`Metadata`\> = [`IBaseErrorOptions`](../interfaces/IBaseErrorOptions.md) & \[`Metadata`\] _extends_ \[`never`\] ? `object` : `object`

Options accepted by every RedisSMQError.

- When `Metadata` is `never` (default), `metadata` is disallowed.
- When `Metadata` is any other type, `metadata` is required.

## Type Parameters

### Metadata

`Metadata` = `never`

[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IMessageAuditConfigOptions

# Interface: IMessageAuditConfigOptions

Configuration options for message audit storage.

Message audit creates dedicated storage to track processed message IDs,
enabling efficient monitoring of acknowledged and dead-lettered messages per queue.

## Properties

### expire?

> `optional` **expire**: `number`

Retention time for message IDs in seconds.

Message IDs older than this duration are automatically removed from audit storage.
Set to 0 for unlimited retention time (default behavior).

#### Default

```ts
0 (unlimited)
```

***

### queueSize?

> `optional` **queueSize**: `number`

Maximum number of message IDs to store per queue.

When this limit is reached, older message IDs are removed to make room for new ones.
Set to 0 for unlimited storage (default behavior).

#### Default

```ts
0 (unlimited)
```

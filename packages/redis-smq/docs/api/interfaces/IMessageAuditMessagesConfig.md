[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageAuditMessagesConfig

# Interface: IMessageAuditMessagesConfig

Configuration for message audit storage of a single category
(acknowledged or dead-lettered messages).

Message audit creates a dedicated Redis list per queue that tracks
processed message IDs. The list behaves as a bounded ring buffer:
entries are appended at one end, and when either the size limit or
the time limit is reached, older entries are evicted.

Two limits govern retention:

- `queueSize`: maximum number of message IDs to keep. When the list
  grows past this, the oldest entries are trimmed.

- `expire`: maximum age in seconds. Entries older than this are
  removed by Redis's passive expiration when the list is next
  touched.

Both limits can be active simultaneously; the stricter one wins. A
value of `0` disables that limit. Setting both to `0` gives unlimited
retention — every processed message ID is kept for the lifetime of
the queue.

## Example

```ts
// Keep the last 1000 acknowledged message IDs, or entries from the
// last 7 days, whichever limit is reached first.
const cfg: IMessageAuditMessagesConfig = {
  enabled: true,
  queueSize: 1000,
  expire: 7 * 24 * 60 * 60,
};
```

## Properties

### enabled

> **enabled**: `boolean`

Enables audit tracking for this message category.

When enabled, the library maintains a Redis list per queue holding
the IDs of messages in this category (acknowledged, dead-lettered,
and so on). Browsing APIs such as `QueueAcknowledgedMessages` and
`QueueDeadLetteredMessages` read from these lists.

When disabled, no IDs are recorded and the corresponding browsing
API raises a category-specific error
(`AcknowledgmentAuditDisabledError` or
`DeadLetterAuditDisabledError`).

#### Default

```ts
false;
```

---

### expire

> **expire**: `number`

Maximum age of a message ID, in seconds.

Older entries are removed by Redis's passive expiration the next
time the list is accessed. The library does not actively sweep the
list; removal is deferred to the next read or write.

Setting to `0` disables time-based expiration. Combined with
`queueSize: 0`, this gives unlimited retention.

The value is used as the argument to Redis's `PEXPIRE` after
converting from seconds to milliseconds internally. The unit in the
public config is seconds for readability; a value of `3600` means
one hour, not one millisecond.

#### Default

```ts
0;
```

---

### queueSize

> **queueSize**: `number`

Maximum number of message IDs to retain per queue.

When the list exceeds this size, the oldest entries are trimmed to
keep the list at exactly `queueSize` entries. Trimming happens
inside the same Lua script that appends new IDs, so the list never
observably exceeds the limit.

Setting to `0` disables the size limit. Combined with `expire: 0`,
this gives unlimited retention.

#### Default

```ts
0;
```

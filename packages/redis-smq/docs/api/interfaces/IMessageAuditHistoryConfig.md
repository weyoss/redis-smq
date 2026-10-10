[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageAuditHistoryConfig

# Interface: IMessageAuditHistoryConfig

Configuration for unacknowledgement history tracking.

Unacknowledgement history is a per-message log of the reasons a
message was not processed successfully. Each entry records the cause,
the resolution action taken, and the retry count at the time.

Unlike the acknowledged and dead-lettered message audit categories,
unacknowledgement history is not a queue-level list of message IDs.
It is a per-message list attached to the message's own hash. The
purpose is diagnostic: when a message is repeatedly retried, the
history shows why each attempt failed.

## Example

```ts
const cfg: IMessageAuditHistoryConfig = {
  enabled: true,
  maxSize: 50,
};
```

## Properties

### enabled

> **enabled**: `boolean`

Enables unacknowledgement history tracking.

When enabled, each unacknowledgement of a message appends a record
to the message's history list. The record captures the cause, the
resolution (retry, delay, or dead-letter), and the timestamp.

When disabled, no history is written and
`MessageManager.getMessageUnacknowledgementHistory()` raises
`UnacknowledgmentHistoryDisabledError`.

#### Default

```ts
false;
```

---

### maxSize

> **maxSize**: `number`

Maximum number of history entries to retain per message.

When a message has been unacknowledged more times than `maxSize`,
the oldest entries are trimmed. Trimming happens inside the same
Lua script that appends the new entry.

Setting to `0` disables the size limit; the history grows without
bound for the lifetime of the message. For a message that is
repeatedly retried and never dead-lettered, an unbounded history
can grow large enough to affect Redis memory usage.

#### Default

```ts
100;
```

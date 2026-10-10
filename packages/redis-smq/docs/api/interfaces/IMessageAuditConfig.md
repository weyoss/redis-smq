[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageAuditConfig

# Interface: IMessageAuditConfig

Root configuration for the message audit system.

Each of the three audit categories can be configured independently in
one of three ways:

- `true`: enable with defaults
- `false` or omitted: disable
- `Partial<IConfig>`: enable with the specified values, defaults
  filled in for anything omitted

The same object can mix forms — for example, `true` for one category
and an explicit object for another.

## Example

```ts
// Enable all three categories with defaults
const cfg1: IMessageAuditConfig = {
  acknowledgedMessages: true,
  deadLetteredMessages: true,
  unacknowledgementHistory: true,
};

// Custom configuration with per-category storage limits
const cfg2: IMessageAuditConfig = {
  acknowledgedMessages: {
    enabled: true,
    queueSize: 10000,
    expire: 30 * 24 * 60 * 60,
  },
  deadLetteredMessages: {
    enabled: true,
    queueSize: 5000,
    expire: 7 * 24 * 60 * 60,
  },
  unacknowledgementHistory: {
    enabled: true,
    maxSize: 50,
  },
};
```

## Properties

### acknowledgedMessages?

> `optional` **acknowledgedMessages?**: `boolean` \| `Partial`\<[`IMessageAuditMessagesConfig`](IMessageAuditMessagesConfig.md)\>

Audit configuration for acknowledged messages.

When enabled, tracks the IDs of successfully processed messages.
Browsing APIs in `QueueAcknowledgedMessages` read from this store.

#### Default

```ts
false;
```

---

### deadLetteredMessages?

> `optional` **deadLetteredMessages?**: `boolean` \| `Partial`\<[`IMessageAuditMessagesConfig`](IMessageAuditMessagesConfig.md)\>

Audit configuration for dead-lettered messages.

When enabled, tracks the IDs of messages that failed processing and
exceeded their retry thresholds. Browsing APIs in
`QueueDeadLetteredMessages` read from this store.

#### Default

```ts
false;
```

---

### unacknowledgementHistory?

> `optional` **unacknowledgementHistory?**: `boolean` \| `Partial`\<[`IMessageAuditHistoryConfig`](IMessageAuditHistoryConfig.md)\>

Audit configuration for unacknowledgement history.

When enabled, each unacknowledgement appends a record to the
message's own history list. `MessageManager` reads from this store.

#### Default

```ts
false;
```

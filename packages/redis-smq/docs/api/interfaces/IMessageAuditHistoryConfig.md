[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageAuditHistoryConfig

# Interface: IMessageAuditHistoryConfig

Configuration options for unacknowledgement message history.

Tracks detailed history of message processing failures, storing rich metadata
about each unacknowledgement event including failure causes and resolution actions.
This provides comprehensive debugging information and helps identify systemic
issues in message processing.

Each history entry includes:

- Timestamp of the failure
- Failure cause (error, timeout, etc.)
- Resolution action taken (retry, dead-letter, acknowledge)
- Retry attempt number

## Example

```typescript
const config: IMessageAuditHistoryConfig = {
  enabled: true,
  maxSize: 50, // Keep last 50 failures per message
};
```

## Properties

### enabled

> **enabled**: `boolean`

Enables or disables unacknowledgement history tracking.

When enabled, each unacknowledgement event creates a comprehensive history record
containing failure details and the system's resolution action.

When disabled, no history records are stored, reducing storage overhead but
losing visibility into processing failures.

#### Default

```ts
false;
```

---

### maxSize

> **maxSize**: `number`

Maximum number of history entries to store per message.

Controls how many failure events are retained for each message.
When the limit is reached, the oldest entries are evicted to make room for
new ones, maintaining a bounded history of the most recent failures.

Set to `0` for unlimited storage.

#### Default

```ts
100;
```

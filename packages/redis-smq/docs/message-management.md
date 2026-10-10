[RedisSMQ](../README.md) / [Documentation](README.md) / Message Management

# Message Management

Retrieve, delete, and requeue individual messages by ID.

## Quick Start

```javascript
const { RedisSMQ } = require('redis-smq');
const messageManager = RedisSMQ.createMessageManager();
```

## Retrieve Messages

### Get a Single Message

```javascript
const message = await messageManager.getMessageById('msg-123');
console.log('Message:', message.body);
```

Fails with `MessageNotFoundError` if the message does not exist.

### Get Multiple Messages

```javascript
const messages = await messageManager.getMessagesByIds([
  'msg-1',
  'msg-2',
  'msg-3',
]);
messages.forEach((msg) => {
  console.log(`${msg.id}: ${msg.status}`);
});
```

The result preserves the caller's order — the `n`th message corresponds to the `n`th input ID. Every ID in the array must exist; a single missing ID rejects the whole call with `MessageNotFoundError`. For best-effort semantics, call `getMessageById` per ID and handle the not-found case individually.

### Get Message State

Returns the runtime state — timestamps, attempts, and counters — without the payload:

```javascript
const state = await messageManager.getMessageState('msg-123');
console.log('Attempts:', state.attempts);
console.log('Published at:', new Date(state.publishedAt));
console.log('Dead-lettered at:', state.deadLetteredAt);
```

The `state` object is the same `IMessageStateTransferable` that `message.messageState` carries on a full `IMessageTransferable`. Use this method when you only need the state — it reads only the message hash, skipping the payload deserialization that `getMessageById` performs.

Fails with `MessageNotFoundError` if the message does not exist.

## Delete Messages

### Delete a Single Message

```javascript
const result = await messageManager.deleteMessageById('msg-123');
console.log('Status:', result.status); // 'OK' | 'PARTIAL_SUCCESS' | ...
console.log('Deleted:', result.stats.success);
```

### Delete Multiple Messages

```javascript
const result = await messageManager.deleteMessagesByIds(['msg-1', 'msg-2']);
console.log(
  `${result.stats.success} deleted, ${result.stats.notFound} missing`,
);
```

Both delete methods return the same `IMessageManagerDeleteResponse` shape:

```ts
interface IMessageManagerDeleteResponse {
  status:
    | 'OK'
    | 'PARTIAL_SUCCESS'
    | 'MESSAGE_NOT_FOUND'
    | 'MESSAGE_IN_PROCESS'
    | 'MESSAGE_NOT_DELETED'
    | 'INVALID_PARAMETERS';
  stats: {
    processed: number; // messages examined
    success: number; // messages deleted
    notFound: number; // messages that did not exist
    inProcess: number; // messages skipped because they were PROCESSING
  };
}
```

**Deletion semantics:**

- A message in the `PROCESSING` state cannot be deleted — deleting a message while a consumer is working on it would leave the consumer holding a stale reference. Such messages are counted in `stats.inProcess` and skipped.
- A message that does not exist is counted in `stats.notFound` and skipped. Unlike the read methods, delete does **not** reject on a missing message.
- The overall `status` summarizes the outcome: `OK` when every processed message was deleted, `PARTIAL_SUCCESS` when some were and some weren't, `MESSAGE_NOT_DELETED` when none were.
- The methods only reject on infrastructure errors (Redis unavailable, script failure), not on missing or in-process messages.

## Requeue Messages

Requeue creates a copy of an acknowledged or dead-lettered message for reprocessing:

```javascript
const newId = await messageManager.requeueMessageById('msg-123');
console.log(`Requeued as: ${newId}`);
```

Only acknowledged and dead-lettered messages can be requeued. Attempting to requeue a message in any other state rejects with `MessageNotRequeuableError`.

The original message is unchanged — a new copy is created with a new ID, the original's `requeueCount` is incremented, and the new message's `requeuedMessageParentId` points back at the original. A message may be requeued multiple times; each call produces a distinct new message.

For Pub/Sub queues, the original's consumer group must still exist at requeue time. If it was deleted, the call rejects with `MessageNotFoundError` (the script reports the group is gone).

## Check Message Status

```javascript
const status = await messageManager.getMessageStatus('msg-123');
console.log('Status:', status); // EMessagePropertyStatus value
```

The status reflects the last state transition the message underwent. See `EMessagePropertyStatus` for the possible values (`NEW`, `PENDING`, `PROCESSING`, `SCHEDULED`, `ACKNOWLEDGED`, `UNACK_REQUEUING`, `UNACK_DELAYING`, `DEAD_LETTERED`).

Fails with `MessageNotFoundError` if the message does not exist.

## Unacknowledgment History

View the failure timeline for a message:

```javascript
const history =
  await messageManager.getMessageUnacknowledgementHistory('msg-123');
history.forEach((record) => {
  console.log(`${new Date(record.timestamp)}: ${record.cause}`);
});
```

Requires `messageAudit.unacknowledgementHistory` to be enabled in [configuration](configuration.md). When it is not, the call rejects with `UnacknowledgmentHistoryDisabledError`.

Records are ordered **newest first** (the underlying Redis list is `LPUSH`-ed on every unacknowledgement). Reverse the array if you need chronological order. Each record carries the cause, the resolution action taken, the retry count at the time, and the consumer ID that was processing the message.

Fails with `MessageNotFoundError` if the message does not exist. A message that has never been unacknowledged returns an empty array.

## Promise Style

Every method above supports both callback and promise forms. The promise form is shown throughout; the callback form passes an `(err, result)` callback as the last argument:

```javascript
messageManager.getMessageById('msg-123', (err, message) => {
  if (err) console.error(err);
  else console.log(message.body);
});
```

See [Dual Callback & Promise Support](dual-callback-and-promise-support.md) for the general pattern.

## Related

- [Messages Concepts](https://github.com/weyoss/redis-smq-docs) — Message lifecycle
- [Message Audit](message-audit.md) — Browsing tracked messages by queue
- [Scheduling Messages](scheduling-messages.md) — Managing scheduled messages
- [Dual Callback & Promise Support](dual-callback-and-promise-support.md) — Callback vs promise form

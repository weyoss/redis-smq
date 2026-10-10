[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageManager

# Interface: IMessageManager

Manages individual messages by ID.

Use this class when the caller already has a message ID and wants to
inspect, delete, or requeue that specific message. For browsing
messages by queue, use the `QueueMessages` family
(`QueuePendingMessages`, `QueuePublishedMessages`, and so on).

All methods operate on the message's Redis hash and any queue-level
data structures the message participates in. Deleting a message
removes it from its current queue's pending, scheduled, or
dead-lettered list, and from the queue's message registry.

Both the promise and callback forms are declared for every
asynchronous method, matching the concrete class.

## Methods

### deleteMessageById()

#### Call Signature

> **deleteMessageById**(`id`): `Promise`\<[`IMessageManagerDeleteResponse`](IMessageManagerDeleteResponse.md)\>

Deletes a single message by ID.

Delegates to `deleteMessagesByIds` with a one-element array. The
response's `stats` object has `processed: 1` and exactly one of
`success`, `notFound`, or `inProcess` set to 1.

Same semantics as the batch method: does not reject on a missing
message, does not reject on an in-process message, only rejects on
infrastructure errors.

##### Parameters

###### id

`string`

##### Returns

`Promise`\<[`IMessageManagerDeleteResponse`](IMessageManagerDeleteResponse.md)\>

#### Call Signature

> **deleteMessageById**(`id`, `cb`): `void`

##### Parameters

###### id

`string`

###### cb

`ICallback`\<[`IMessageManagerDeleteResponse`](IMessageManagerDeleteResponse.md)\>

##### Returns

`void`

---

### deleteMessagesByIds()

#### Call Signature

> **deleteMessagesByIds**(`ids`): `Promise`\<[`IMessageManagerDeleteResponse`](IMessageManagerDeleteResponse.md)\>

Deletes multiple messages by ID.

The messages may be in different queues and different states. The
batch is grouped internally by queue and by consumer group, and each
group is deleted in a single Lua call.

A message in the `PROCESSING` state cannot be deleted — deleting a
message while a consumer is working on it would leave the consumer
holding a stale reference, and the message's eventual ack/unack
would fail. Such messages are counted in `stats.inProcess` and
skipped; the response status reflects the partial outcome.

A message that does not exist is counted in `stats.notFound` and
skipped. Unlike the read methods, `deleteMessagesByIds` does **not**
fail on a missing message — it reports the miss in `stats` and
continues.

The response's `status` field summarizes the outcome:

- `OK` if every processed message was deleted
- `PARTIAL_SUCCESS` if some were deleted and some were not
- `MESSAGE_NOT_DELETED` if none were deleted

The method does not reject for missing or in-process messages. It
only rejects on infrastructure errors (Redis unavailable, script
failure).

##### Parameters

###### ids

`string`[]

##### Returns

`Promise`\<[`IMessageManagerDeleteResponse`](IMessageManagerDeleteResponse.md)\>

##### Example

```ts
// Promise
const result = await messageManager.deleteMessagesByIds(['msg-1', 'msg-2']);
console.log(
  `${result.stats.success} deleted, ${result.stats.notFound} missing`,
);

// Callback
messageManager.deleteMessagesByIds(['msg-1', 'msg-2'], (err, result) => {
  if (err) throw err;
  console.log(result.status);
});
```

#### Call Signature

> **deleteMessagesByIds**(`ids`, `cb`): `void`

##### Parameters

###### ids

`string`[]

###### cb

`ICallback`\<[`IMessageManagerDeleteResponse`](IMessageManagerDeleteResponse.md)\>

##### Returns

`void`

---

### getMessageById()

#### Call Signature

> **getMessageById**(`messageId`): `Promise`\<[`IMessageTransferable`](IMessageTransferable.md)\<`unknown`\>\>

Returns one message by ID.

Fails with `MessageNotFoundError` if the message does not exist.

##### Parameters

###### messageId

`string`

##### Returns

`Promise`\<[`IMessageTransferable`](IMessageTransferable.md)\<`unknown`\>\>

#### Call Signature

> **getMessageById**(`messageId`, `cb`): `void`

##### Parameters

###### messageId

`string`

###### cb

`ICallback`\<[`IMessageTransferable`](IMessageTransferable.md)\<`unknown`\>\>

##### Returns

`void`

---

### getMessagesByIds()

#### Call Signature

> **getMessagesByIds**(`messageIds`): `Promise`\<[`IMessageTransferable`](IMessageTransferable.md)\<`unknown`\>[]\>

Returns multiple messages by ID.

Preserves the caller's order — the `n`th result corresponds to the
`n`th input ID. Every ID in the input array must exist; a single
missing ID causes the whole call to reject with
`MessageNotFoundError`.

This is a strict semantics: a caller who wants best-effort behavior
should call `getMessageById` per ID and handle the not-found case
individually.

Each returned `IMessageTransferable` carries the full message
payload and state. For a caller who only needs the state, calling
`getMessageState` per ID is cheaper — it reads only the message hash
and skips the payload deserialization.

##### Parameters

###### messageIds

`string`[]

##### Returns

`Promise`\<[`IMessageTransferable`](IMessageTransferable.md)\<`unknown`\>[]\>

#### Call Signature

> **getMessagesByIds**(`messageIds`, `cb`): `void`

##### Parameters

###### messageIds

`string`[]

###### cb

`ICallback`\<[`IMessageTransferable`](IMessageTransferable.md)\<`unknown`\>[]\>

##### Returns

`void`

---

### getMessageState()

#### Call Signature

> **getMessageState**(`messageId`): `Promise`\<[`IMessageStateTransferable`](IMessageStateTransferable.md)\>

Returns the runtime state of a message.

The state is the same `IMessageStateTransferable` object that
`IMessageTransferable.messageState` carries — all timestamps,
counters, and flags for the message. Use this method when the
caller only needs the state, not the full message payload.

Fails with `MessageNotFoundError` if no message exists with the
given ID.

##### Parameters

###### messageId

`string`

##### Returns

`Promise`\<[`IMessageStateTransferable`](IMessageStateTransferable.md)\>

#### Call Signature

> **getMessageState**(`messageId`, `cb`): `void`

##### Parameters

###### messageId

`string`

###### cb

`ICallback`\<[`IMessageStateTransferable`](IMessageStateTransferable.md)\>

##### Returns

`void`

---

### getMessageStatus()

#### Call Signature

> **getMessageStatus**(`messageId`): `Promise`\<[`EMessagePropertyStatus`](../enumerations/EMessagePropertyStatus.md)\>

Returns the current status of a message.

The status is read from the message's `STATUS` hash field and
reflects the last state transition the message underwent. See
`EMessagePropertyStatus` for the possible values.

Fails with `MessageNotFoundError` if no message exists with the
given ID.

##### Parameters

###### messageId

`string`

##### Returns

`Promise`\<[`EMessagePropertyStatus`](../enumerations/EMessagePropertyStatus.md)\>

##### Example

```ts
// Promise
const status = await messageManager.getMessageStatus('msg-123');
if (status === EMessagePropertyStatus.DEAD_LETTERED) {
  console.log('The message has been dead-lettered');
}

// Callback
messageManager.getMessageStatus('msg-123', (err, status) => {
  if (err) throw err;
  console.log(status);
});
```

#### Call Signature

> **getMessageStatus**(`messageId`, `cb`): `void`

##### Parameters

###### messageId

`string`

###### cb

`ICallback`\<[`EMessagePropertyStatus`](../enumerations/EMessagePropertyStatus.md)\>

##### Returns

`void`

---

### getMessageUnacknowledgementHistory()

#### Call Signature

> **getMessageUnacknowledgementHistory**(`messageId`): `Promise`\<[`TMessageUnacknowledgementHistory`](../type-aliases/TMessageUnacknowledgementHistory.md)\>

Returns the unacknowledgement history of a message.

The history is a list of records describing every time the message
was unacknowledged — the cause, the resolution action taken, the
retry count at that moment, and the timestamp.

Requires the unacknowledgement history audit to be enabled in the
configuration. If it is disabled, the method fails with
`UnacknowledgmentHistoryDisabledError`.

Fails with `MessageNotFoundError` if the message does not exist.
A message that has never been unacknowledged returns an empty
array.

The order of records is oldest first — the list is `LPUSH`-ed on
every unacknowledgement, so index 0 is the most recent. If you need
newest first, reverse the array at the call site.

##### Parameters

###### messageId

`string`

##### Returns

`Promise`\<[`TMessageUnacknowledgementHistory`](../type-aliases/TMessageUnacknowledgementHistory.md)\>

##### Example

```ts
// Promise
const history =
  await messageManager.getMessageUnacknowledgementHistory('msg-123');
history.forEach((record) => {
  console.log(
    `${record.cause} -> ${record.action} (retry ${record.retryCount})`,
  );
});

// Callback
messageManager.getMessageUnacknowledgementHistory('msg-123', (err, history) => {
  if (err) throw err;
  console.log(history.length);
});
```

#### Call Signature

> **getMessageUnacknowledgementHistory**(`messageId`, `cb`): `void`

##### Parameters

###### messageId

`string`

###### cb

`ICallback`\<[`TMessageUnacknowledgementHistory`](../type-aliases/TMessageUnacknowledgementHistory.md)\>

##### Returns

`void`

---

### requeueMessageById()

#### Call Signature

> **requeueMessageById**(`messageId`): `Promise`\<`string`\>

Requeues a message by ID.

Requeuing creates a **new** message from the original. The new
message is published to the original's destination queue with the
original's payload and consume options; the original message remains
where it was (in the acknowledged or dead-lettered list) but its
requeue counters are updated so the two can be correlated.

Preconditions:

- The original message must be in the `ACKNOWLEDGED` or
  `DEAD_LETTERED` state. Attempting to requeue a `PENDING`,
  `PROCESSING`, or `SCHEDULED` message fails with
  `MessageNotRequeuableError`.
- For PUB/SUB messages, the original's consumer group must still
  exist. If it was deleted, the requeue fails with
  `MessageNotFoundError` (the script reports the group is gone).

Returns the ID of the new message. The original message's
`requeueCount` is incremented, `requeuedAt` is set on the first
requeue, and `lastRequeuedAt` is updated on every requeue. The new
message's `requeuedMessageParentId` is set to the original's ID.

A message may be requeued multiple times. Each requeue produces a
distinct new message with its own ID.

##### Parameters

###### messageId

`string`

##### Returns

`Promise`\<`string`\>

##### Example

```ts
// Promise
const newId = await messageManager.requeueMessageById('msg-123');
console.log(`New message: ${newId}`);

// Callback
messageManager.requeueMessageById('msg-123', (err, newId) => {
  if (err) throw err;
  console.log(newId);
});
```

#### Call Signature

> **requeueMessageById**(`messageId`, `cb`): `void`

##### Parameters

###### messageId

`string`

###### cb

`ICallback`\<`string`\>

##### Returns

`void`

[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IQueueMessages

# Interface: IQueueMessages

Common surface shared by every queue-message browser.

The five concrete browsers — published, pending, scheduled,
acknowledged, dead-lettered — differ in which Redis structure they
read, but they expose the same operations: count, browse by page,
browse by ID, and manage purge jobs. This interface captures that
shared surface.

Each concrete browser extends this interface with type-specific
additions (only `IQueuePublishedMessages` adds a method today).

Purge is asynchronous. `purge()` does not delete messages directly —
it enqueues a background job that deletes messages in batches, and
returns the job ID immediately. A caller who needs to know when the
purge completes either polls `getPurgeJobStatus()` or subscribes to
the background-job event bus.

Both the promise and callback forms are declared for every
asynchronous method, matching the concrete classes.

## Extended by

- [`IQueuePublishedMessages`](IQueuePublishedMessages.md)
- [`IQueuePendingMessages`](IQueuePendingMessages.md)
- [`IQueueScheduledMessages`](IQueueScheduledMessages.md)
- [`IQueueAcknowledgedMessages`](IQueueAcknowledgedMessages.md)
- [`IQueueDeadLetteredMessages`](IQueueDeadLetteredMessages.md)

## Methods

### cancelPurge()

#### Call Signature

> **cancelPurge**(`queue`, `jobId`): `Promise`\<`void`\>

Requests cancellation of an in-progress purge job.

Cancellation is cooperative: the background worker observes the
request between batches and stops after the current batch completes.
A job that has already reached a terminal state (completed, failed,
cancelled) is unaffected — no error is raised.

Fails with `InvalidPurgeQueueJobIdError` if the job ID does not
belong to this queue and this message category. The error is raised
rather than silently ignored so that a caller who mistypes a job ID
finds out immediately.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### jobId

`string`

##### Returns

`Promise`\<`void`\>

#### Call Signature

> **cancelPurge**(`queue`, `jobId`, `cb`): `void`

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### jobId

`string`

###### cb

`ICallback`

##### Returns

`void`

---

### countMessages()

#### Call Signature

> **countMessages**(`queue`): `Promise`\<`number`\>

Returns the total number of messages in this category for a queue.

The count is read from the underlying Redis structure: `LLEN` for
list-backed categories, `ZCARD` for sorted-set-backed categories,
`SCARD` for set-backed categories. None of these are paginated; the
count is always the full size of the category.

For PUB/SUB queues, the count depends on the browser:

- `IQueuePendingMessages.countMessages()` — the base browser
  reads the queue-level pending list, which does not exist for
  PUB/SUB queues. Use the per-group counts from
  `IQueuePublishedMessages.countMessagesByStatus().pending`
  instead.

- The other categories (published, scheduled, acknowledged,
  dead-lettered) are queue-level and return a single count.

Fails with `QueueNotFoundError` if the queue does not exist.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### Returns

`Promise`\<`number`\>

##### Example

```ts
// Promise
const count = await messages.countMessages('orders');
console.log(`${count} messages`);

// Callback
messages.countMessages('orders', (err, count) => {
  if (err) throw err;
  console.log(count);
});
```

#### Call Signature

> **countMessages**(`queue`, `cb`): `void`

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### cb

`ICallback`\<`number`\>

##### Returns

`void`

---

### getMessageIds()

#### Call Signature

> **getMessageIds**(`queue`, `page`, `pageSize`): `Promise`\<[`IBrowserPage`](IBrowserPage.md)\<`string`\>\>

Returns one page of message IDs from the category.

Pages are 1-indexed. Page 1 with a page size of 20 returns the first
twenty IDs; page 2 returns the next twenty, and so on.

The order of IDs within a page depends on the underlying structure:

- List-backed categories (pending FIFO/LIFO, published, scheduled,
  acknowledged, dead-lettered): insertion order — oldest first for
  FIFO, newest first for LIFO.

- Sorted-set-backed categories (scheduled, priority pending):
  score order — messages scheduled earlier or with higher priority
  come first.

The returned `IBrowserPage` carries the total item count, so a
caller can compute the number of pages without a separate call.

Fails with `QueueNotFoundError` if the queue does not exist. For
PUB/SUB queues, the browser factory rejects the call with
`ConsumerGroupRequiredError` if no group ID is provided.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### page

`number`

###### pageSize

`number`

##### Returns

`Promise`\<[`IBrowserPage`](IBrowserPage.md)\<`string`\>\>

#### Call Signature

> **getMessageIds**(`queue`, `page`, `pageSize`, `cb`): `void`

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### page

`number`

###### pageSize

`number`

###### cb

`ICallback`\<[`IBrowserPage`](IBrowserPage.md)\<`string`\>\>

##### Returns

`void`

---

### getMessages()

#### Call Signature

> **getMessages**(`queue`, `page`, `pageSize`): `Promise`\<[`IBrowserPage`](IBrowserPage.md)\<[`IMessageTransferable`](IMessageTransferable.md)\<`unknown`\>\>\>

Returns one page of full messages from the category.

Same pagination semantics as `getMessageIds()`, but each item is a
fully hydrated `IMessageTransferable` — payload, state, status,
destination queue. Use this when the caller needs the message
content; use `getMessageIds()` when only the IDs are needed
(a much cheaper read).

Messages that were deleted between the ID read and the payload read
are omitted from the result. The page's `items.length` may
therefore be smaller than `pageSize` even when more pages exist.
The `totalItems` count still reflects the ID read.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### page

`number`

###### pageSize

`number`

##### Returns

`Promise`\<[`IBrowserPage`](IBrowserPage.md)\<[`IMessageTransferable`](IMessageTransferable.md)\<`unknown`\>\>\>

#### Call Signature

> **getMessages**(`queue`, `page`, `pageSize`, `cb`): `void`

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### page

`number`

###### pageSize

`number`

###### cb

`ICallback`\<[`IBrowserPage`](IBrowserPage.md)\<[`IMessageTransferable`](IMessageTransferable.md)\<`unknown`\>\>\>

##### Returns

`void`

---

### getPurgeJob()

#### Call Signature

> **getPurgeJob**(`queue`, `jobId`): `Promise`\<[`IPurgeQueueJob`](IPurgeQueueJob.md)\>

Returns the full purge-job record for a job.

The record carries the job's ID, status, timestamps, and progress
metadata (`meta.purged` — the number of messages deleted so far).

Fails with `InvalidPurgeQueueJobIdError` if the job ID does not
belong to this queue and this message category.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### jobId

`string`

##### Returns

`Promise`\<[`IPurgeQueueJob`](IPurgeQueueJob.md)\>

##### See

IPurgeQueueJob

#### Call Signature

> **getPurgeJob**(`queue`, `jobId`, `cb`): `void`

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### jobId

`string`

###### cb

`ICallback`\<[`IPurgeQueueJob`](IPurgeQueueJob.md)\>

##### Returns

`void`

---

### getPurgeJobStatus()

#### Call Signature

> **getPurgeJobStatus**(`queue`, `jobId`): `Promise`\<[`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)\>

Returns the status of a purge job.

A convenience wrapper around `getPurgeJob()` for callers who only
need the status. A caller building a progress dashboard typically
uses both: `getPurgeJob()` for the full record, `getPurgeJobStatus()`
for quick polling.

Fails with the same errors as `getPurgeJob()`.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### jobId

`string`

##### Returns

`Promise`\<[`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)\>

#### Call Signature

> **getPurgeJobStatus**(`queue`, `jobId`, `cb`): `void`

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### jobId

`string`

###### cb

`ICallback`\<[`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)\>

##### Returns

`void`

---

### purge()

#### Call Signature

> **purge**(`queue`): `Promise`\<`string`\>

Enqueues a background job that deletes every message in the
category.

The purge is asynchronous: this method returns immediately with a
job ID. The background worker deletes messages in batches, updating
the job's progress as it goes. The queue is locked for the duration
of the purge, so no other operation can consume from it or delete
it while the purge is running.

Fails with `QueueLockedError` if the queue is already locked (for
example, by another purge job). Fails with `QueueNotFoundError` if
the queue does not exist.

Use `getPurgeJobStatus()` to poll progress, or `cancelPurge()` to
stop the job. Cancelling a purge stops the batch loop after the
current batch completes; messages already deleted are not restored.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### Returns

`Promise`\<`string`\>

#### Call Signature

> **purge**(`queue`, `cb`): `void`

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### cb

`ICallback`\<`string`\>

##### Returns

`void`

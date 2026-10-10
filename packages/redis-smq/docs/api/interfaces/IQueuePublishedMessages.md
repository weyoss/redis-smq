[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IQueuePublishedMessages

# Interface: IQueuePublishedMessages

Browse every message published to a queue, regardless of status.

This browser reads the queue's published list — the master list of
every message ID the queue has ever accepted. It is not partitioned
by message status: a published entry stays in the list through
pending, processing, acknowledged, and dead-lettered states.

Adding to the base surface, this browser exposes
`countMessagesByStatus()` — a breakdown of the queue's messages by
their current status. This is the only browser with a per-status view;
the others read single-status categories directly.

## Extends

- [`IQueueMessages`](IQueueMessages.md)

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

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`cancelPurge`](IQueueMessages.md#cancelpurge)

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

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`cancelPurge`](IQueueMessages.md#cancelpurge)

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

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`countMessages`](IQueueMessages.md#countmessages)

#### Call Signature

> **countMessages**(`queue`, `cb`): `void`

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### cb

`ICallback`\<`number`\>

##### Returns

`void`

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`countMessages`](IQueueMessages.md#countmessages)

---

### countMessagesByStatus()

#### Call Signature

> **countMessagesByStatus**(`queue`): `Promise`\<[`IQueuePublishedMessagesCountByStatus`](IQueuePublishedMessagesCountByStatus.md)\>

Returns a breakdown of the queue's messages by status.

The four counts — acknowledged, dead-lettered, pending, scheduled —
are read from the queue's properties hash. They are maintained by
the Lua scripts and are always consistent with the underlying
structures.

`pending` is polymorphic. For POINT_TO_POINT queues it is a single
number. For PUB/SUB queues it is a map of consumer-group ID to
pending count — a PUB/SUB queue has one pending list per group, and
the aggregate is not meaningful.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### Returns

`Promise`\<[`IQueuePublishedMessagesCountByStatus`](IQueuePublishedMessagesCountByStatus.md)\>

##### Example

```ts
const counts = await published.countMessagesByStatus('orders');
console.log(`${counts.acknowledged} consumed`);
if (typeof counts.pending === 'number') {
  console.log(`${counts.pending} waiting`);
} else {
  for (const [group, n] of Object.entries(counts.pending)) {
    console.log(`${n} waiting for ${group}`);
  }
}
```

#### Call Signature

> **countMessagesByStatus**(`queue`, `cb`): `void`

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### cb

`ICallback`\<[`IQueuePublishedMessagesCountByStatus`](IQueuePublishedMessagesCountByStatus.md)\>

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

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`getMessageIds`](IQueueMessages.md#getmessageids)

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

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`getMessageIds`](IQueueMessages.md#getmessageids)

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

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`getMessages`](IQueueMessages.md#getmessages)

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

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`getMessages`](IQueueMessages.md#getmessages)

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

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`getPurgeJob`](IQueueMessages.md#getpurgejob)

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

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`getPurgeJob`](IQueueMessages.md#getpurgejob)

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

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`getPurgeJobStatus`](IQueueMessages.md#getpurgejobstatus)

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

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`getPurgeJobStatus`](IQueueMessages.md#getpurgejobstatus)

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

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`purge`](IQueueMessages.md#purge)

#### Call Signature

> **purge**(`queue`, `cb`): `void`

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### cb

`ICallback`\<`string`\>

##### Returns

`void`

##### Inherited from

[`IQueueMessages`](IQueueMessages.md).[`purge`](IQueueMessages.md#purge)

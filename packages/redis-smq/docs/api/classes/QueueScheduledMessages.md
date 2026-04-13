[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / QueueScheduledMessages

# Class: QueueScheduledMessages

Handles scheduled message operations for a queue.

Scheduled messages are those scheduled for future delivery.
This class provides methods to browse, count, and purge scheduled messages.

## Example

```ts
const scheduled = new QueueScheduledMessages();

// Count scheduled messages
const count = await scheduled.countMessages('orders');

// Get first page of scheduled messages
const page = await scheduled.getMessages('orders', 1, 20);
page.items.forEach((msg) => {
  console.log(`Scheduled at: ${msg.getMessageState().getScheduledAt()}`);
});

// Purge all scheduled messages
const jobId = await scheduled.purge('orders');
```

## Extends

- `QueueMessagesAbstract`

## Constructors

### Constructor

> **new QueueScheduledMessages**(): `QueueScheduledMessages`

#### Returns

`QueueScheduledMessages`

#### Inherited from

`QueueMessagesAbstract.constructor`

## Properties

### messageType

> `readonly` **messageType**: [`SCHEDULED`](../enumerations/EQueueMessageType.md#scheduled) = `EQueueMessageType.SCHEDULED`

Type of queue messages this browser handles.

#### Overrides

`QueueMessagesAbstract.messageType`

## Methods

### cancelPurge()

#### Call Signature

> **cancelPurge**(`queue`, `jobId`): `Promise`\<`void`\>

Stops an in-progress purge job.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

###### jobId

`string`

Purge job ID to cancel

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await messages.cancelPurge('orders', jobId);

// Callback
messages.cancelPurge('orders', jobId, (err) => {
  if (err) throw err;
});
```

##### Inherited from

`QueueMessagesAbstract.cancelPurge`

#### Call Signature

> **cancelPurge**(`queue`, `jobId`, `cb`): `void`

Stops an in-progress purge job.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

###### jobId

`string`

Purge job ID to cancel

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await messages.cancelPurge('orders', jobId);

// Callback
messages.cancelPurge('orders', jobId, (err) => {
  if (err) throw err;
});
```

##### Inherited from

`QueueMessagesAbstract.cancelPurge`

---

### countMessages()

#### Call Signature

> **countMessages**(`queue`): `Promise`\<`number`\>

Gets total message count in the queue.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

##### Returns

`Promise`\<`number`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const count = await messages.countMessages('orders');

// Callback
messages.countMessages('orders', (err, count) => {
  if (err) throw err;
  console.log(count);
});
```

##### Inherited from

`QueueMessagesAbstract.countMessages`

#### Call Signature

> **countMessages**(`queue`, `cb`): `void`

Gets total message count in the queue.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

###### cb

`ICallback`\<`number`\>

(err, count) => void. Returns number

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const count = await messages.countMessages('orders');

// Callback
messages.countMessages('orders', (err, count) => {
  if (err) throw err;
  console.log(count);
});
```

##### Inherited from

`QueueMessagesAbstract.countMessages`

---

### getMessageIds()

#### Call Signature

> **getMessageIds**(`queue`, `page`, `pageSize`): `Promise`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<`string`\>\>

Gets message IDs for a specific page.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

###### page

`number`

Page number (starts at 1)

###### pageSize

`number`

Items per page

##### Returns

`Promise`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<`string`\>\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const page = await messages.getMessageIds('orders', 1, 10);
console.log(page.items);

// Callback
messages.getMessageIds('orders', 1, 10, (err, page) => {
  if (err) throw err;
  console.log(page.items);
});
```

##### Inherited from

`QueueMessagesAbstract.getMessageIds`

#### Call Signature

> **getMessageIds**(`queue`, `page`, `pageSize`, `cb`): `void`

Gets message IDs for a specific page.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

###### page

`number`

Page number (starts at 1)

###### pageSize

`number`

Items per page

###### cb

`ICallback`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<`string`\>\>

(err, page) => void. Returns IBrowserPage<string>

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const page = await messages.getMessageIds('orders', 1, 10);
console.log(page.items);

// Callback
messages.getMessageIds('orders', 1, 10, (err, page) => {
  if (err) throw err;
  console.log(page.items);
});
```

##### Inherited from

`QueueMessagesAbstract.getMessageIds`

---

### getMessages()

#### Call Signature

> **getMessages**(`queue`, `page`, `pageSize`): `Promise`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>\>

Gets full message objects for a specific page.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

###### page

`number`

Page number (starts at 1)

###### pageSize

`number`

Items per page

##### Returns

`Promise`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const page = await messages.getMessages('orders', 1, 5);
page.items.forEach((msg) => console.log(msg.getBody()));

// Callback
messages.getMessages('orders', 1, 5, (err, page) => {
  if (err) throw err;
  page.items.forEach((msg) => console.log(msg.getBody()));
});
```

##### Inherited from

`QueueMessagesAbstract.getMessages`

#### Call Signature

> **getMessages**(`queue`, `page`, `pageSize`, `cb`): `void`

Gets full message objects for a specific page.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

###### page

`number`

Page number (starts at 1)

###### pageSize

`number`

Items per page

###### cb

`ICallback`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>\>

(err, page) => void. Returns IBrowserPage<IMessageTransferable>

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const page = await messages.getMessages('orders', 1, 5);
page.items.forEach((msg) => console.log(msg.getBody()));

// Callback
messages.getMessages('orders', 1, 5, (err, page) => {
  if (err) throw err;
  page.items.forEach((msg) => console.log(msg.getBody()));
});
```

##### Inherited from

`QueueMessagesAbstract.getMessages`

---

### getPurgeJob()

#### Call Signature

> **getPurgeJob**(`queue`, `jobId`): `Promise`\<[`TPurgeQueueJob`](../type-aliases/TPurgeQueueJob.md)\>

Gets detailed information about a purge job.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

###### jobId

`string`

Purge job ID

##### Returns

`Promise`\<[`TPurgeQueueJob`](../type-aliases/TPurgeQueueJob.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const job = await messages.getPurgeJob('orders', jobId);
console.log(job.status);

// Callback
messages.getPurgeJob('orders', jobId, (err, job) => {
  if (err) throw err;
  console.log(job.status);
});
```

##### Inherited from

`QueueMessagesAbstract.getPurgeJob`

#### Call Signature

> **getPurgeJob**(`queue`, `jobId`, `cb`): `void`

Gets detailed information about a purge job.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

###### jobId

`string`

Purge job ID

###### cb

`ICallback`\<[`TPurgeQueueJob`](../type-aliases/TPurgeQueueJob.md)\>

(err, job) => void. Returns TPurgeQueueJob

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const job = await messages.getPurgeJob('orders', jobId);
console.log(job.status);

// Callback
messages.getPurgeJob('orders', jobId, (err, job) => {
  if (err) throw err;
  console.log(job.status);
});
```

##### Inherited from

`QueueMessagesAbstract.getPurgeJob`

---

### getPurgeJobStatus()

#### Call Signature

> **getPurgeJobStatus**(`queue`, `jobId`): `Promise`\<[`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)\>

Gets the current status of a purge job.

Possible statuses: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

###### jobId

`string`

Purge job ID

##### Returns

`Promise`\<[`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const status = await messages.getPurgeJobStatus('orders', jobId);
if (status === 'COMPLETED') {
  console.log('Queue purged');
}

// Callback
messages.getPurgeJobStatus('orders', jobId, (err, status) => {
  if (err) throw err;
  if (status === 'COMPLETED') console.log('Queue purged');
});
```

##### Inherited from

`QueueMessagesAbstract.getPurgeJobStatus`

#### Call Signature

> **getPurgeJobStatus**(`queue`, `jobId`, `cb`): `void`

Gets the current status of a purge job.

Possible statuses: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

###### jobId

`string`

Purge job ID

###### cb

`ICallback`\<[`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)\>

(err, status) => void. Returns EBackgroundJobStatus

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const status = await messages.getPurgeJobStatus('orders', jobId);
if (status === 'COMPLETED') {
  console.log('Queue purged');
}

// Callback
messages.getPurgeJobStatus('orders', jobId, (err, status) => {
  if (err) throw err;
  if (status === 'COMPLETED') console.log('Queue purged');
});
```

##### Inherited from

`QueueMessagesAbstract.getPurgeJobStatus`

---

### purge()

#### Call Signature

> **purge**(`queue`): `Promise`\<`string`\>

Removes all messages from the queue.

Runs as a background job. Use getPurgeJobStatus() to check progress.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

##### Returns

`Promise`\<`string`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const jobId = await messages.purge('old-queue');

// Callback
messages.purge('old-queue', (err, jobId) => {
  if (err) throw err;
  console.log(jobId);
});
```

##### Inherited from

`QueueMessagesAbstract.purge`

#### Call Signature

> **purge**(`queue`, `cb`): `void`

Removes all messages from the queue.

Runs as a background job. Use getPurgeJobStatus() to check progress.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { queueParams, groupId }

###### cb

`ICallback`\<`string`\>

(err, jobId) => void. Returns string

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const jobId = await messages.purge('old-queue');

// Callback
messages.purge('old-queue', (err, jobId) => {
  if (err) throw err;
  console.log(jobId);
});
```

##### Inherited from

`QueueMessagesAbstract.purge`

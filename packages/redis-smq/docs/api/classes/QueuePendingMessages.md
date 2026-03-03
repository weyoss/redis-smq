[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / QueuePendingMessages

# Class: QueuePendingMessages

## Extends

- `QueueMessagesAbstract`

## Constructors

### Constructor

> **new QueuePendingMessages**(): `QueuePendingMessages`

#### Returns

`QueuePendingMessages`

#### Inherited from

`QueueMessagesAbstract.constructor`

## Properties

### messageType

> `readonly` **messageType**: [`PENDING`](../enumerations/EQueueMessageType.md#pending) = `EQueueMessageType.PENDING`

Type of queue messages this browser handles.

#### Overrides

`QueueMessagesAbstract.messageType`

## Methods

### cancelPurge()

> **cancelPurge**(`queue`, `jobId`, `cb`): `void`

Cancels an active purge job that is currently in progress.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

The queue where the purge job is running.

##### jobId

`string`

The ID of the purge job to cancel.

##### cb

`ICallback`

Callback when cancellation is processed.

#### Returns

`void`

#### Inherited from

`QueueMessagesAbstract.cancelPurge`

---

### countMessages()

> **countMessages**(`queue`, `cb`): `void`

Counts the total number of messages in the queue.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters

##### cb

`ICallback`\<`number`\>

Callback returning the count

#### Returns

`void`

#### Inherited from

`QueueMessagesAbstract.countMessages`

---

### getMessageIds()

> **getMessageIds**(`queue`, `page`, `pageSize`, `cb`): `void`

Retrieves message IDs for a specific page.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Parsed queue parameters

##### page

`number`

Page number

##### pageSize

`number`

Number of items per page

##### cb

`ICallback`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<`string`\>\>

Callback returning an IBrowserPage of message IDs

#### Returns

`void`

#### Inherited from

`QueueMessagesAbstract.getMessageIds`

---

### getMessages()

> **getMessages**(`queue`, `page`, `pageSize`, `cb`): `void`

Retrieves detailed messages for a specific page.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters

##### page

`number`

Page number

##### pageSize

`number`

Number of items per page

##### cb

`ICallback`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>\>

Callback returning an IBrowserPage of IMessageTransferable

#### Returns

`void`

#### Inherited from

`QueueMessagesAbstract.getMessages`

---

### getPurgeJob()

> **getPurgeJob**(`queue`, `jobId`, `cb`): `void`

Retrieves comprehensive details about a specific purge job.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

The queue associated with the purge job.

##### jobId

`string`

The ID of the purge job to retrieve.

##### cb

`ICallback`\<[`IBackgroundJob`](../interfaces/IBackgroundJob.md)\<[`TPurgeQueueJobTarget`](../type-aliases/TPurgeQueueJobTarget.md)\>\>

Callback with the job object.

#### Returns

`void`

#### Inherited from

`QueueMessagesAbstract.getPurgeJob`

---

### getPurgeJobStatus()

> **getPurgeJobStatus**(`queue`, `jobId`, `cb`): `void`

Retrieves the current status of a purge job.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

The queue where the purge job is running.

##### jobId

`string`

The ID of the purge job to check.

##### cb

`ICallback`\<[`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)\>

Callback with the job status.

#### Returns

`void`

#### Inherited from

`QueueMessagesAbstract.getPurgeJobStatus`

---

### purge()

> **purge**(`queue`, `cb`): `void`

Purges all messages from the specified queue.

This operation is performed asynchronously using a background job. When this method
is called, it immediately creates and starts a purge job, and returns the ID of
that job. You can use the returned job ID to track the progress of the purge operation.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

The queue to purge.

##### cb

`ICallback`\<`string`\>

Callback function that receives the job ID.

#### Returns

`void`

#### Inherited from

`QueueMessagesAbstract.purge`

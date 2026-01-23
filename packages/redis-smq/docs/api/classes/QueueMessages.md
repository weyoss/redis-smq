[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueMessages

# Class: QueueMessages

QueueMessages class manages message counting and state reporting across queue types.
It orchestrates various message handlers (pending, acknowledged, scheduled, dead-lettered)
and leverages a waterfall pattern for processing.

## Extends

- `MessageBrowserAbstract`

## Constructors

### Constructor

> **new QueueMessages**(): `QueueMessages`

#### Returns

`QueueMessages`

#### Inherited from

`MessageBrowserAbstract.constructor`

## Properties

### messageType

> `readonly` **messageType**: [`ALL_MESSAGES`](../enumerations/EQueueMessageType.md#all_messages) = `EQueueMessageType.ALL_MESSAGES`

Type of queue messages this browser handles.

#### Overrides

`MessageBrowserAbstract.messageType`

## Methods

### cancelPurge()

> **cancelPurge**(`queue`, `jobId`, `cb`): `void`

Cancels an active purge job that is currently in progress.

This method attempts to cancel a running purge job identified by the provided job ID.
Note that cancellation is not guaranteed - it depends on the current state and progress
of the purge operation. Once a purge job reaches certain stages, it may not be cancellable.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

The queue parameters identifying the queue
where the purge job is running.

##### jobId

`string`

The ID of the purge job to cancel. This is the job ID
returned by the `purge()` method when the purge was initiated.

##### cb

`ICallback`

Callback function invoked when the cancellation
request is processed. - `error` {Error|null} - If an error occurs during
cancellation request, this contains the Error object.
Common errors include: - Job not found - Job already completed - Job cannot be cancelled in its current state - `result` {void} - No result is returned on success.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

ConsumerGroupRequiredError

#### Throws

ConsumerGroupsNotSupportedError

#### Throws

QueueNotFoundError

#### Throws

InvalidPurgeQueueJobIdError

#### Inherited from

`MessageBrowserAbstract.cancelPurge`

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

#### Throws

InvalidQueueParametersError

#### Throws

ConsumerGroupRequiredError

#### Throws

ConsumerGroupsNotSupportedError

#### Throws

QueueNotFoundError

#### Inherited from

`MessageBrowserAbstract.countMessages`

---

### countMessagesByStatus()

> **countMessagesByStatus**(`queue`, `cb`): `void`

Count messages broken down by status: pending, acknowledged, scheduled, and dead-lettered.

#### Parameters

##### queue

Queue string name or parameters.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<[`IQueueMessagesCount`](../interfaces/IQueueMessagesCount.md)\>

Callback function returning the IQueueMessagesCount.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

QueueNotFoundError

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

Callback returning an IQueueMessagesPage of message IDs

#### Returns

`void`

#### Inherited from

`MessageBrowserAbstract.getMessageIds`

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

Callback returning an IQueueMessagesPage of IMessageTransferable

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

ConsumerGroupRequiredError

#### Throws

ConsumerGroupsNotSupportedError

#### Throws

QueueNotFoundError

#### Inherited from

`MessageBrowserAbstract.getMessages`

---

### getPurgeJob()

> **getPurgeJob**(`queue`, `jobId`, `cb`): `void`

Retrieves comprehensive details about a specific purge job.

This method returns the complete job object containing all metadata, configuration,
and execution details for a purge operation. Unlike [getPurgeJobStatus](#getpurgejobstatus) which
returns only status information, this method provides the full job object including:

- Job creation timestamp
- Job parameters and configuration
- Target queue and message types being purged
- Progress metrics and statistics
- Error details (if the job failed)
- Result summary (if the job completed)

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

The queue parameters identifying the queue
associated with the purge job.

##### jobId

`string`

The ID of the purge job to retrieve. This is the job ID
returned by the [purge](#purge) method when the purge was initiated.

##### cb

`ICallback`\<[`IBackgroundJob`](../interfaces/IBackgroundJob.md)\<[`TPurgeQueueJobTarget`](../type-aliases/TPurgeQueueJobTarget.md)\>\>

Callback function invoked
with the complete job object. - `error` {Error|null} - If an error occurs,
this contains the Error object. - `job` {IBackgroundJob<TPurgeQueueJobTarget>|undefined} -
The complete purge job object containing
all metadata and execution details.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

ConsumerGroupRequiredError

#### Throws

ConsumerGroupsNotSupportedError

#### Throws

QueueNotFoundError

#### Throws

BackgroundJobNotFoundError

#### Throws

InvalidPurgeQueueJobIdError

#### Inherited from

`MessageBrowserAbstract.getPurgeJob`

---

### getPurgeJobStatus()

> **getPurgeJobStatus**(`queue`, `jobId`, `cb`): `void`

Retrieves the current status of a purge job.

This method provides detailed status information about an asynchronous purge operation
initiated via the [purge](#purge) method. The status includes progress, current state,
and any error information if the job has failed.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

The queue parameters identifying the queue
where the purge job is running.

##### jobId

`string`

The ID of the purge job to check. This is the job ID
returned by the [purge](#purge) method when the purge was initiated.

##### cb

`ICallback`\<[`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)\>

Callback function invoked with the job status. - `error` {Error|null} - If an error occurs,
this contains the Error object. - `status` {EBackgroundJobStatus|undefined} -
The current status of the purge job.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

ConsumerGroupRequiredError

#### Throws

ConsumerGroupsNotSupportedError

#### Throws

QueueNotFoundError

#### Throws

BackgroundJobNotFoundError

#### Throws

InvalidPurgeQueueJobIdError

#### Inherited from

`MessageBrowserAbstract.getPurgeJobStatus`

---

### purge()

> **purge**(`queue`, `cb`): `void`

Purges all messages from the specified queue.

This operation is performed asynchronously using a background job. When this method
is called, it immediately creates and starts a purge job, and returns the ID of
that job. You can use the returned job ID to track the progress of the purge operation.

Different message types can be purged using specific classes:

- QueueMessages - Delete all queue messages
- [QueueAcknowledgedMessages](QueueAcknowledgedMessages.md) - Delete acknowledged messages (if configured to be stored)
- [QueueDeadLetteredMessages](QueueDeadLetteredMessages.md) - Delete dead-lettered messages (if configured to be stored)
- [QueueScheduledMessages](QueueScheduledMessages.md) - Delete scheduled messages
- [QueuePendingMessages](QueuePendingMessages.md) - Delete pending messages

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

The queue to purge. Can be a string (queue name),
queue parameters object, or queue consumer group parameters.

##### cb

`ICallback`\<`string`\>

Callback function that will be invoked when the job is created.
The callback receives two parameters: - `error` {Error|null} - If an error occurs during job creation,
this will contain the Error object. If the job is successfully
created, this will be `null`. - `jobId` {string|undefined} - The ID of the background job created
to perform the purge operation. This ID can be used to: - Check the job status using `getPurgeJobStatus()` - Monitor progress via `getPurgeJob()` - Cancel the purge job if needed using `cancelPurge()`

                         Note: Receiving a job ID does NOT mean the purge is complete,
                         only that the purge job has been successfully created and started.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

ConsumerGroupRequiredError

#### Throws

ConsumerGroupsNotSupportedError

#### Throws

QueueNotFoundError

#### Throws

BackgroundJobTargetLockedError

#### Inherited from

`MessageBrowserAbstract.purge`

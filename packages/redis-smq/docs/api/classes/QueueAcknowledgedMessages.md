[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueAcknowledgedMessages

# Class: QueueAcknowledgedMessages

Manages acknowledged messages in a queue.

Acknowledged messages are those that have been successfully processed by consumers
and can be safely removed from the active queue. This class allows for tracking
and management of these messages when the system is configured to audit them.

## See

/packages/redis-smq/docs/configuration.md#message-audit

## Extends

- `MessageBrowserAbstract`

## Constructors

### Constructor

> **new QueueAcknowledgedMessages**(): `QueueAcknowledgedMessages`

#### Returns

`QueueAcknowledgedMessages`

#### Inherited from

`MessageBrowserAbstract.constructor`

## Properties

### messageType

> `readonly` **messageType**: [`ACKNOWLEDGED`](../enumerations/EQueueMessageType.md#acknowledged) = `EQueueMessageType.ACKNOWLEDGED`

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

Counts the total number of audited acknowledged messages.

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

#### Throws

AcknowledgedMessageAuditNotEnabledError

#### Overrides

`MessageBrowserAbstract.countMessages`

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

Retrieves audited acknowledged messages.

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

#### Throws

AcknowledgedMessageAuditNotEnabledError

#### Overrides

`MessageBrowserAbstract.getMessages`

---

### getPurgeJob()

> **getPurgeJob**(`queue`, `jobId`, `cb`): `void`

Retrieves comprehensive details about a specific purge job.

This method returns the complete job object containing all metadata, configuration,
and execution details for a purge operation. Unlike [getPurgeJobStatus](QueueMessages.md#getpurgejobstatus) which
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
returned by the [purge](QueueMessages.md#purge) method when the purge was initiated.

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
initiated via the [purge](QueueMessages.md#purge) method. The status includes progress, current state,
and any error information if the job has failed.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

The queue parameters identifying the queue
where the purge job is running.

##### jobId

`string`

The ID of the purge job to check. This is the job ID
returned by the [purge](QueueMessages.md#purge) method when the purge was initiated.

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

Purges all audited acknowledged messages.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

The queue to purge. Can be a string, queue parameters object,
or queue consumer group parameters.

##### cb

`ICallback`\<`string`\>

Callback function that will be invoked when the operation completes.
If an error occurs, the first parameter will contain the Error object.
Otherwise, the first parameter will be the ID of purge job created.

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

AcknowledgedMessageAuditNotEnabledError

#### Overrides

`MessageBrowserAbstract.purge`

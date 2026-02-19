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

`MessageBrowserAbstract.getPurgeJob`

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

`MessageBrowserAbstract.getPurgeJobStatus`

---

### purge()

> **purge**(`queue`, `cb`): `void`

Purges all audited acknowledged messages from the specified queue.

This operation is performed asynchronously using a background job. When this method
is called, it immediately creates and starts a purge job, and returns the ID of
that job. You can use the returned job ID to track the progress of the purge operation.

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

AcknowledgedMessageAuditNotEnabledError

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

#### Overrides

`MessageBrowserAbstract.purge`

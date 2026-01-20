[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueDeadLetteredMessages

# Class: QueueDeadLetteredMessages

Manages audited dead-lettered messages in a queue.

Dead-lettered messages are those that have failed processing multiple times
and exceeded their retry limits. When the system is configured to audit them,
these messages are moved to a dead-letter queue for later inspection, troubleshooting, or manual reprocessing.

## See

/packages/redis-smq/docs/configuration.md#message-audit

## Extends

- `MessageBrowserAbstract`

## Constructors

### Constructor

> **new QueueDeadLetteredMessages**(`logger?`): `QueueDeadLetteredMessages`

#### Parameters

##### logger?

`ILogger`

#### Returns

`QueueDeadLetteredMessages`

#### Inherited from

`MessageBrowserAbstract.constructor`

## Methods

### cancelPurge()

> **cancelPurge**(`queue`, `jobId`, `cb`): `void`

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### jobId

`string`

##### cb

`ICallback`

#### Returns

`void`

#### Inherited from

`MessageBrowserAbstract.cancelPurge`

---

### countMessages()

> **countMessages**(`queue`, `cb`): `void`

Counts the total number of audited dead-lettered messages in the queue.

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

DeadLetteredMessageAuditNotEnabledError

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

Retrieves audited dead-lettered messages from the specified queue.

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

DeadLetteredMessageAuditNotEnabledError

#### Overrides

`MessageBrowserAbstract.getMessages`

---

### purge()

> **purge**(`queue`, `cb`): `void`

Purges all audited dead-lettered messages from the specified queue.

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

DeadLetteredMessageAuditNotEnabledError

#### Overrides

`MessageBrowserAbstract.purge`

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

> `readonly` **messageType**: `ACKNOWLEDGED` = `EQueueMessageType.ACKNOWLEDGED`

Type of queue messages this browser handles.

#### Overrides

`MessageBrowserAbstract.messageType`

## Methods

### cancelPurge()

> **cancelPurge**(`queue`, `jobId`, `cb`): `void`

Cancels an active purge job.

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

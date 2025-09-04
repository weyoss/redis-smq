[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Producer

# Class: Producer

The Producer class is responsible for producing messages, managing their
delivery to various queues, and ensuring that all components are ready
for operation.
The class provides methods for enqueuing messages, handling consumer groups,
and producing messages based on the message's exchange parameters.
Error handling is included throughout the methods, returning appropriate
error objects when necessary.

## Extends

- `Runnable`\<[`TProducerEvent`](../type-aliases/TProducerEvent.md)\>

## Constructors

### Constructor

> **new Producer**(): `Producer`

Constructor for the Producer class. Initializes the Redis client,
event bus, and logger. Sets up the event bus publisher if enabled.

#### Returns

`Producer`

#### Overrides

`Runnable<TProducerEvent>.constructor`

## Methods

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` *extends* keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

##### args

...`Parameters`\<[`TProducerEvent`](../type-aliases/TProducerEvent.md)\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

`Runnable.emit`

***

### getId()

> **getId**(): `string`

#### Returns

`string`

#### Inherited from

`Runnable.getId`

***

### isDown()

> **isDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isDown`

***

### isGoingDown()

> **isGoingDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isGoingDown`

***

### isGoingUp()

> **isGoingUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isGoingUp`

***

### isRunning()

> **isRunning**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isRunning`

***

### isUp()

> **isUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isUp`

***

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TProducerEvent`](../type-aliases/TProducerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.on`

***

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TProducerEvent`](../type-aliases/TProducerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.once`

***

### produce()

> **produce**(`msg`, `cb`): `void`

Produces a message based on the provided parameters. Ensures that a valid
exchange is set and that at least one matching queue exists before
publishing the message.

This method handles various errors, including:
- ProducerInstanceNotRunningError: Thrown when the producer instance is not running.
- ProducerMessageExchangeRequiredError: Thrown when no exchange is set for the message.
- ProducerExchangeNoMatchedQueueError: Thrown when no matching queues are found for the exchange.
- ProducerQueueNotFoundError: Thrown when a queue is not found.
- ProducerMessagePriorityRequiredError: Thrown when a message priority is required.
- ProducerPriorityQueuingNotEnabledError: Thrown when priority queuing is not enabled.
- ProducerUnknownQueueTypeError: Thrown when an unknown queue type is encountered.
- ProducerError: A generic error thrown when an unexpected error occurs.

#### Parameters

##### msg

[`ProducibleMessage`](ProducibleMessage.md)

The message to be produced and published.

##### cb

`ICallback`\<`string`[]\>

A callback function to be executed upon completion.
                                  It receives an error as the first argument (if any)
                                  and an array of message IDs as the second argument.

#### Returns

`void`

***

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` *extends* keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Inherited from

`Runnable.removeAllListeners`

***

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TProducerEvent`](../type-aliases/TProducerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.removeListener`

***

### run()

> **run**(`cb`): `void`

#### Parameters

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`

#### Inherited from

`Runnable.run`

***

### shutdown()

> **shutdown**(`cb`): `void`

#### Parameters

##### cb

`ICallback`\<`void`\>

#### Returns

`void`

#### Inherited from

`Runnable.shutdown`

[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Consumer

# Class: Consumer

Consumer class responsible for receiving and processing messages from a message queue.
It implements the `Runnable` interface to handle lifecycle events like startup and shutdown.
The Consumer can be configured for multiplexing, allowing it to handle multiple queues simultaneously with a single Redis connection.

## Extends

- `Runnable`\<[`TConsumerEvent`](../type-aliases/TConsumerEvent.md)\>

## Constructors

### Constructor

> **new Consumer**(`enableMultiplexing?`): `Consumer`

Creates a new Consumer instance.

#### Parameters

##### enableMultiplexing?

`boolean`

(Optional) If set to true, the consumer uses a multiplexed message handler runner; otherwise, it uses a standard message handler runner.

#### Returns

`Consumer`

#### Overrides

`Runnable<TConsumerEvent>.constructor`

## Methods

### cancel()

> **cancel**(`queue`, `cb`): `void`

Cancels the consumption of messages from a specified queue.

This function is responsible for stopping the consumption of messages from a specific queue.
It removes the message handler associated with the given queue from the message handler runner.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

The queue parameters.
This parameter represents the queue from which messages will be consumed.
It can be a string representing the queue name or an object containing additional queue options.

##### cb

`ICallback`\<`void`\>

Callback function to be called once cancellation is complete.
This callback function will be invoked after the message handler associated with the given queue is removed.
If an error occurs during the cancellation process, the error will be passed as the first argument to the callback function.
Otherwise, the callback function will be invoked with no arguments.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

QueueNotFoundError

#### Example

```typescript
const consumer = new Consumer();
consumer.consume(
  'my-queue',
  (message, done) => {
    // Handle the message
    // ...
    // Acknowledge the message
    done();
  },
  (err) => {
    if (err) {
      console.error('Error consuming messages:', err);
    } else {
      console.log('Consumption set up successfully');
    }
  },
);

// Cancel consumption after some time
setTimeout(() => {
  consumer.cancel('my-queue', (err) => {
    if (err) {
      console.error('Error canceling consumption:', err);
    } else {
      console.log('Consumption cancelled successfully');
    }
  });
}, 10000);
```

---

### consume()

> **consume**(`queue`, `messageHandler`, `cb`): `void`

Consumes messages from a specified queue using the provided message handler.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

A queue from which messages will be consumed. Before consuming
messages from a queue make sure that the specified queue already exists in
the system.

##### messageHandler

[`TConsumerMessageHandler`](../type-aliases/TConsumerMessageHandler.md)

A callback function that defines how to process each
message consumed from the queue. The messageHandler will receive the
message as an argument and should implement the logic for processing the
message. This might include business logic, transformation, storage, etc.
It's crucial that this function handles exceptions and errors properly to
avoid issues with message acknowledgment.

##### cb

`ICallback`\<`void`\>

The callback function will be executed after the consumption process is initiated.
It typically signifies the end of the consumption setup and can be used to
handle success or errors in starting the consumption process.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

MessageHandlerAlreadyExistsError

#### Throws

ConsumerGroupsNotSupportedError

#### Throws

QueueNotFoundError

#### Throws

MessageHandlerFileError

#### Throws

MessageHandlerFilenameExtensionError

#### Throws

UnexpectedScriptReplyError

#### Example

```typescript
const consumer = new Consumer();
consumer.consume(
  'my-queue',
  (message, done) => {
    // Handle the message
    // ...
    // Acknowledge the message
    done();
  },
  (err) => {
    if (err) {
      console.error('Error consuming messages:', err);
    } else {
      console.log('Consumption set up successfully');
    }
  },
);
```

#### See

/packages/redis-smq/docs/consuming-messages.md

---

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` _extends_ keyof [`TConsumerEvent`](../type-aliases/TConsumerEvent.md)

#### Parameters

##### event

`E`

##### args

...`Parameters`\<[`TConsumerEvent`](../type-aliases/TConsumerEvent.md)\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

`Runnable.emit`

---

### ensureIsOperational()

> **ensureIsOperational**(`cb`): `void`

#### Parameters

##### cb

`ICallback`

#### Returns

`void`

#### Inherited from

`Runnable.ensureIsOperational`

---

### getId()

> **getId**(): `string`

#### Returns

`string`

#### Inherited from

`Runnable.getId`

---

### getQueues()

> **getQueues**(): [`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)[]

Retrieves a list of queues the consumer is currently configured to handle.

This function returns an array of parsed queue parameters that the consumer is currently set up to handle.
The parsed queue parameters include the queue name, options, and any additional parameters specified.

#### Returns

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)[]

- An array of parsed queue parameters.
  Each element in the array represents a queue that the consumer is currently consuming messages from.

#### Example

```typescript
const consumer = new Consumer();
consumer.consume(
  'my-queue',
  (message, done) => {
    // Handle the message
    // ...
    // Acknowledge the message
    done();
  },
  (err) => {
    if (err) {
      console.error('Error consuming messages:', err);
    } else {
      console.log('Consumption set up successfully');
    }
  },
);

// Get the list of queues the consumer is handling
const queues = consumer.getQueues();
console.log('Queues:', queues);
// Output: Queues: [{ queueParams: { name:'my-queue', ns: 'default' }, groupId: null }]
```

---

### isDown()

> **isDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isDown`

---

### isGoingDown()

> **isGoingDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isGoingDown`

---

### isGoingUp()

> **isGoingUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isGoingUp`

---

### isOperational()

> **isOperational**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isOperational`

---

### isRunning()

> **isRunning**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isRunning`

---

### isUp()

> **isUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isUp`

---

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TConsumerEvent`](../type-aliases/TConsumerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TConsumerEvent`](../type-aliases/TConsumerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.on`

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TConsumerEvent`](../type-aliases/TConsumerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TConsumerEvent`](../type-aliases/TConsumerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.once`

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TConsumerEvent`](../type-aliases/TConsumerEvent.md)

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Inherited from

`Runnable.removeAllListeners`

---

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TConsumerEvent`](../type-aliases/TConsumerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TConsumerEvent`](../type-aliases/TConsumerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.removeListener`

---

### run()

> **run**(`cb`): `void`

#### Parameters

##### cb

`ICallback`

#### Returns

`void`

#### Inherited from

`Runnable.run`

---

### shutdown()

> **shutdown**(`cb`): `void`

#### Parameters

##### cb

`ICallback`

#### Returns

`void`

#### Inherited from

`Runnable.shutdown`

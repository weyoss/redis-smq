[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Consumer

# Class: Consumer

Consumer class responsible for receiving and processing messages from message queues.

The Consumer implements the `Runnable` interface to handle lifecycle events like startup
and shutdown. It can be configured for multiplexing, allowing it to handle multiple queues
simultaneously with a single Redis connection.

## Template

The type of events emitted by the consumer

## Example

```typescript
// Create a consumer instance
const consumer = new Consumer({ enableMultiplexing: false });

// Start the consumer
consumer.run((err) => {
  if (err) {
    console.error('Failed to start consumer:', err);
    return;
  }

  // Consumer is ready to receive messages
  consumer.consume(
    'my-queue',
    (message, done) => {
      console.log('Processing message:', message);
      // Process the message...
      done(); // Acknowledge message processing
    },
    (consumeErr) => {
      if (consumeErr) console.error('Failed to start consumption:', consumeErr);
    },
  );
});
```

## Extends

- `Runnable`\<[`TConsumerEvent`](../type-aliases/TConsumerEvent.md)\>

## Constructors

### Constructor

> **new Consumer**(`consumerOptions?`): `Consumer`

Creates a new Consumer instance with the specified options.

#### Parameters

##### consumerOptions?

`IConsumerOptions`

Configuration options for the consumer:

- `enableMultiplexing` - When true, enables handling multiple queues with one connection. Default: false.
- `heartbeatTTL` - Consumer heartbeat TTL in milliseconds. Default: 120000 (2 minutes).
- `enableBatchAcks` - When true, enables batch acknowledgment of messages. Default: true.
- `batchSize` - Maximum number of messages to acknowledge in a batch. Default: 100.
- `batchTimeoutMs` - Maximum time to wait for batch to fill before acknowledging. Default: 10000 (10 seconds).

#### Returns

`Consumer`

#### Throws

If RedisSMQ has not been initialized via `RedisSMQ.init()`.

#### Example

```typescript
// Create consumer with custom options
const consumer = new Consumer({
  enableMultiplexing: true,
  heartbeatTTL: 60000,
  enableBatchAcks: false,
});
```

#### Overrides

`Runnable<TConsumerEvent>.constructor`

### Constructor

> **new Consumer**(`enableMultiplexing?`): `Consumer`

Creates a new Consumer instance with multiplexing configuration.

#### Parameters

##### enableMultiplexing?

`boolean`

When true, enables message multiplexing across multiple queues.

#### Returns

`Consumer`

#### Deprecated

This constructor signature is deprecated. Use `constructor(consumerOptions?: IConsumerOptions)` instead.

#### Example

```typescript
// Deprecated: Create consumer with multiplexing disabled
const consumer = new Consumer(false);
```

#### Overrides

`Runnable<TConsumerEvent>.constructor`

## Methods

### cancel()

> **cancel**(`queue`, `cb`): `void`

Stops message consumption from a specified queue.

This method removes the message handler associated with the given queue,
stopping any further message processing from that queue.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue to stop consuming from.
Accepts the same formats as the `consume` method.

##### cb

`ICallback`\<`void`\>

Callback invoked after cancellation completes.

#### Returns

`void`

#### Throws

When queue parameters are invalid.

#### Throws

When the specified queue doesn't exist.

#### Example

```typescript
// Start consuming
consumer.consume('my-queue', messageHandler, (err) => {
  if (err) return console.error('Failed to setup consumption:', err);

  // Cancel consumption after 10 seconds
  setTimeout(() => {
    consumer.cancel('my-queue', (err) => {
      if (err) {
        console.error('Error canceling consumption:', err);
      } else {
        console.log('Consumption cancelled successfully');
      }
    });
  }, 10000);
});
```

---

### consume()

> **consume**(`queue`, `messageHandler`, `cb`): `void`

Configures the consumer to process messages from a specified queue.

This method registers a message handler for the given queue. The handler function
will be called for each message received from the queue. Before consuming messages,
ensure the queue exists in the system.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue to consume messages from. Can be:

- A string representing the queue name (uses default namespace)
- An object with `{ ns: string, name: string }` for custom namespace
- An object with `{ ns: string, name: string, groupId: string }` for consumer groups

##### messageHandler

[`TConsumerMessageHandler`](../type-aliases/TConsumerMessageHandler.md)

Function that processes each message.
Receives the message and a `done` callback that must be called to acknowledge processing.

##### cb

`ICallback`\<`void`\>

Callback invoked after consumption setup completes.

#### Returns

`void`

#### Throws

When queue parameters are invalid.

#### Throws

When a handler for this queue already exists.

#### Throws

When consumer groups are not supported with the specified queue.

#### Throws

When the specified queue doesn't exist.

#### Throws

When there are issues with message handler file.

#### Throws

When message handler file has invalid extension.

#### Throws

When the queue is paused.

#### Throws

When the queue is stopped.

#### Throws

When the queue is locked.

#### Throws

When the queue is in an invalid state.

#### Throws

When Redis returns unexpected response.

#### Example

```typescript
// Consume from queue with default namespace
consumer.consume(
  'my-queue',
  (message, done) => {
    console.log('Processing message:', message);
    // Process message...
    done(); // Acknowledge successful processing
  },
  (err) => {
    if (err) console.error('Failed to setup consumption:', err);
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

Retrieves the list of queues the consumer is currently configured to handle.

#### Returns

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)[]

Array of parsed queue parameters for all queues
currently being consumed. Each entry includes the queue name, namespace, and
optional group ID.

#### Example

```typescript
consumer.consume('queue-1', handler1);
consumer.consume({ ns: 'custom', name: 'queue-2' }, handler2);

const queues = consumer.getQueues();
console.log(queues);
// Output: [
//   { queueParams: { name: 'queue-1', ns: 'default' }, groupId: null },
//   { queueParams: { name: 'queue-2', ns: 'custom' }, groupId: null }
// ]
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

---

### getDefaultOptions()

> `static` **getDefaultOptions**(): `TConsumerParsedOptions`

Retrieves the current default options for Consumer instances.

#### Returns

`TConsumerParsedOptions`

A copy of the current default options.

#### Example

```typescript
const defaults = Consumer.getDefaultOptions();
console.log(defaults);
// Output: {
//   enableMultiplexing: false,
//   heartbeatTTL: 120000,
//   enableBatchAcks: true,
//   batchSize: 100,
//   batchTimeoutMs: 10000
// }
```

---

### setDefaultOptions()

> `static` **setDefaultOptions**(`options`): `void`

Sets default options for all future Consumer instances.
These options will be used when no options are provided to the constructor.

#### Parameters

##### options

`IConsumerOptions`

Default consumer options to set.

#### Returns

`void`

#### Static

#### Example

```typescript
// Set global defaults
Consumer.setDefaultOptions({
  enableMultiplexing: true,
  heartbeatTTL: 60000,
  enableBatchAcks: false,
});

// This consumer will use the defaults
const consumer = new Consumer();
```

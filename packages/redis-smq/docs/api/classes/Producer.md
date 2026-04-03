[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / Producer

# Class: Producer

The Producer class is a stateful service responsible for publishing messages
to the Redis-SMQ system. It manages the entire message delivery lifecycle,
including complex routing logic via exchanges, and ensures that all underlying
components are properly managed.

## Example

```typescript
const producer = new Producer();

// Using callback
producer.run((err) => {
  if (err) {
    console.error('Failed to start producer:', err);
    return;
  }
  console.log('Producer is running');
});

// Using promise
await producer.run();
```

## Extends

- `Runnable`\<[`TProducerEvent`](../type-aliases/TProducerEvent.md)\>

## Constructors

### Constructor

> **new Producer**(): `Producer`

Initializes a new Producer instance.

Note: The producer is not yet running after construction. Call `run()` to start it.

#### Returns

`Producer`

#### Overrides

`Runnable<TProducerEvent>.constructor`

## Methods

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` _extends_ keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

##### args

...`Parameters`\<[`TProducerEvent`](../type-aliases/TProducerEvent.md)\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

`Runnable.emit`

---

### ensureIsOperational()

#### Call Signature

> **ensureIsOperational**(): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

##### Inherited from

`Runnable.ensureIsOperational`

#### Call Signature

> **ensureIsOperational**(`cb`): `void`

##### Parameters

###### cb

`ICallback`

##### Returns

`void`

##### Inherited from

`Runnable.ensureIsOperational`

---

### getId()

> **getId**(): `string`

#### Returns

`string`

#### Inherited from

`Runnable.getId`

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

`E` _extends_ keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TProducerEvent`](../type-aliases/TProducerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.on`

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TProducerEvent`](../type-aliases/TProducerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.once`

---

### produce()

#### Call Signature

> **produce**(`msg`): `Promise`\<`string`[]\>

Publishes a message to a queue or an exchange.

This method orchestrates the message publication process and supports two main workflows:

1.  **Direct-to-Queue**: If the message specifies a destination queue via `msg.getQueue()`,
    the message is sent directly to that queue.
2.  **Exchange-Based Routing**: If the message specifies an exchange via `msg.getExchange()`,
    this method resolves the exchange to a set of matching queues and publishes a copy
    of the message to each one.

The method performs the following validations:

- Ensures the producer is running; returns `ProducerNotRunningError` if not.
- Ensures the message specifies either a queue or an exchange; returns
  `MessageExchangeRequiredError` if neither is specified.
- For exchange-based routing, ensures at least one queue matches the exchange;
  returns `NoMatchedQueuesForMessageExchangeError` if no matches are found.

**State Requirements:**

- The producer must be operational (running) before calling this method.
  Use `producer.run()` to start the producer and `producer.ensureIsOperational()`
  to automatically start it if needed.

**Error Handling:**

- If the producer is not running, a `ProducerNotRunningError` is returned.
- If the message has neither queue nor exchange, a `MessageExchangeRequiredError` is returned.
- For exchange routing, if no queues match, a `NoMatchingQueuesError` is returned.
- For PUB/SUB queues without consumer groups, a `QueueHasNoConsumerGroupsError` is returned.
- Various other errors may be returned from underlying operations (queue not found,
  consumer group not found, queue stopped, queue locked, etc.).

##### Parameters

###### msg

[`ProducibleMessage`](ProducibleMessage.md)

The message to be published. Must specify either a destination queue
or an exchange (or both).

##### Returns

`Promise`\<`string`[]\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the producer is not running.

##### Throws

When the message has neither queue nor exchange.

##### Throws

When a routing key is required but not provided for DIRECT/TOPIC exchanges.

##### Throws

When the exchange matches no queues.

##### Throws

When publishing to a PUB/SUB queue with no consumer groups.

##### Throws

When the target queue does not exist.

##### Throws

When the consumer group does not exist (PUB/SUB).

##### Throws

When priority is required but not set.

##### Throws

When a message with the same ID already exists.

##### Throws

When priority queueing is not enabled.

##### Throws

When the queue type is invalid.

##### Throws

When the target queue is stopped.

##### Throws

When the target queue is locked.

##### Throws

When the queue is in an invalid state.

##### Throws

When Redis returns an unexpected response.

##### Example

```typescript
// Callback pattern
const producer = new Producer();
await producer.run();

const msg = new ProducibleMessage()
  .setQueue({ name: 'my-queue', ns: 'default' })
  .setBody({ data: 'example' });

producer.produce(msg, (err, messageIds) => {
  if (err) {
    console.error('Failed to produce message:', err);
  } else {
    console.log('Published message IDs:', messageIds);
  }
});

// Promise pattern
try {
  const messageIds = await producer.produce(msg);
  console.log('Published message IDs:', messageIds);
} catch (err) {
  console.error('Failed to produce message:', err);
}

// Direct-to-queue with callback
const directMsg = new ProducibleMessage()
  .setQueue({ name: 'orders', ns: 'processing' })
  .setBody({ orderId: 12345 });

producer.produce(directMsg, (err, ids) => {
  if (err) console.error('Direct publish failed:', err);
});

// Exchange-based routing with promise
const exchangeMsg = new ProducibleMessage()
  .setExchange({ name: 'events', ns: 'system', type: 'topic' })
  .setExchangeRoutingKey('user.created')
  .setBody({ userId: 456 });

const ids = await producer.produce(exchangeMsg);
console.log(`Message published to ${ids.length} queues`);

// Auto-start producer using ensureIsOperational
const autoStartProducer = new Producer();

// This will automatically start the producer if needed
await autoStartProducer.ensureIsOperational();
await autoStartProducer.produce(msg);

// Using ensureIsOperational with produce (callback)
const anotherProducer = new Producer();
anotherProducer.ensureIsOperational((err) => {
  if (err) return console.error('Failed to start:', err);
  anotherProducer.produce(msg, (err, ids) => {
    if (err) console.error('Publish failed:', err);
  });
});
```

##### See

- [ProducibleMessage](ProducibleMessage.md) For message configuration options.
- [Exchange](Exchange.md) For exchange types and routing patterns.
- [Producer#run](#run) For starting the producer.
- [Producer#ensureIsOperational](#ensureisoperational) For lazy initialization.

#### Call Signature

> **produce**(`msg`, `cb`): `void`

Publishes a message to a queue or an exchange.

This method orchestrates the message publication process and supports two main workflows:

1.  **Direct-to-Queue**: If the message specifies a destination queue via `msg.getQueue()`,
    the message is sent directly to that queue.
2.  **Exchange-Based Routing**: If the message specifies an exchange via `msg.getExchange()`,
    this method resolves the exchange to a set of matching queues and publishes a copy
    of the message to each one.

The method performs the following validations:

- Ensures the producer is running; returns `ProducerNotRunningError` if not.
- Ensures the message specifies either a queue or an exchange; returns
  `MessageExchangeRequiredError` if neither is specified.
- For exchange-based routing, ensures at least one queue matches the exchange;
  returns `NoMatchedQueuesForMessageExchangeError` if no matches are found.

**State Requirements:**

- The producer must be operational (running) before calling this method.
  Use `producer.run()` to start the producer and `producer.ensureIsOperational()`
  to automatically start it if needed.

**Error Handling:**

- If the producer is not running, a `ProducerNotRunningError` is returned.
- If the message has neither queue nor exchange, a `MessageExchangeRequiredError` is returned.
- For exchange routing, if no queues match, a `NoMatchingQueuesError` is returned.
- For PUB/SUB queues without consumer groups, a `QueueHasNoConsumerGroupsError` is returned.
- Various other errors may be returned from underlying operations (queue not found,
  consumer group not found, queue stopped, queue locked, etc.).

##### Parameters

###### msg

[`ProducibleMessage`](ProducibleMessage.md)

The message to be published. Must specify either a destination queue
or an exchange (or both).

###### cb

`ICallback`\<`string`[]\>

Optional callback function invoked upon completion. - On success: `cb(null, messageIds)` where `messageIds` is an array of
published message IDs (one per queue for exchange routing, or one for
direct queue routing). - On error: `cb(error)` where `error` is one of the errors listed below. - If not provided, the method returns a Promise that resolves with the
array of message IDs or rejects with an error.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the producer is not running.

##### Throws

When the message has neither queue nor exchange.

##### Throws

When a routing key is required but not provided for DIRECT/TOPIC exchanges.

##### Throws

When the exchange matches no queues.

##### Throws

When publishing to a PUB/SUB queue with no consumer groups.

##### Throws

When the target queue does not exist.

##### Throws

When the consumer group does not exist (PUB/SUB).

##### Throws

When priority is required but not set.

##### Throws

When a message with the same ID already exists.

##### Throws

When priority queueing is not enabled.

##### Throws

When the queue type is invalid.

##### Throws

When the target queue is stopped.

##### Throws

When the target queue is locked.

##### Throws

When the queue is in an invalid state.

##### Throws

When Redis returns an unexpected response.

##### Example

```typescript
// Callback pattern
const producer = new Producer();
await producer.run();

const msg = new ProducibleMessage()
  .setQueue({ name: 'my-queue', ns: 'default' })
  .setBody({ data: 'example' });

producer.produce(msg, (err, messageIds) => {
  if (err) {
    console.error('Failed to produce message:', err);
  } else {
    console.log('Published message IDs:', messageIds);
  }
});

// Promise pattern
try {
  const messageIds = await producer.produce(msg);
  console.log('Published message IDs:', messageIds);
} catch (err) {
  console.error('Failed to produce message:', err);
}

// Direct-to-queue with callback
const directMsg = new ProducibleMessage()
  .setQueue({ name: 'orders', ns: 'processing' })
  .setBody({ orderId: 12345 });

producer.produce(directMsg, (err, ids) => {
  if (err) console.error('Direct publish failed:', err);
});

// Exchange-based routing with promise
const exchangeMsg = new ProducibleMessage()
  .setExchange({ name: 'events', ns: 'system', type: 'topic' })
  .setExchangeRoutingKey('user.created')
  .setBody({ userId: 456 });

const ids = await producer.produce(exchangeMsg);
console.log(`Message published to ${ids.length} queues`);

// Auto-start producer using ensureIsOperational
const autoStartProducer = new Producer();

// This will automatically start the producer if needed
await autoStartProducer.ensureIsOperational();
await autoStartProducer.produce(msg);

// Using ensureIsOperational with produce (callback)
const anotherProducer = new Producer();
anotherProducer.ensureIsOperational((err) => {
  if (err) return console.error('Failed to start:', err);
  anotherProducer.produce(msg, (err, ids) => {
    if (err) console.error('Publish failed:', err);
  });
});
```

##### See

- [ProducibleMessage](ProducibleMessage.md) For message configuration options.
- [Exchange](Exchange.md) For exchange types and routing patterns.
- [Producer#run](#run) For starting the producer.
- [Producer#ensureIsOperational](#ensureisoperational) For lazy initialization.

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

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

`E` _extends_ keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TProducerEvent`](../type-aliases/TProducerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.removeListener`

---

### run()

#### Call Signature

> **run**(): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

##### Inherited from

`Runnable.run`

#### Call Signature

> **run**(`cb`): `void`

##### Parameters

###### cb

`ICallback`

##### Returns

`void`

##### Inherited from

`Runnable.run`

---

### shutdown()

#### Call Signature

> **shutdown**(): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

##### Inherited from

`Runnable.shutdown`

#### Call Signature

> **shutdown**(`cb`): `void`

##### Parameters

###### cb

`ICallback`

##### Returns

`void`

##### Inherited from

`Runnable.shutdown`

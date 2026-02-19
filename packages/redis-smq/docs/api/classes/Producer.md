[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Producer

# Class: Producer

The Producer class is a stateful service responsible for publishing messages
to the Redis-SMQ system. It manages the entire message delivery lifecycle,
including complex routing logic via exchanges, and ensures that all underlying
components are properly managed.

## Example

```typescript
const producer = new Producer();
producer.run((err) => {
  if (err) {
    console.error('Failed to start producer:', err);
    return;
  }
  console.log('Producer is running');
});
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

#### Parameters

##### msg

[`ProducibleMessage`](ProducibleMessage.md)

The message to be published. Must specify either a destination queue
or an exchange (or both).

##### cb

`ICallback`\<`string`[]\>

A callback function invoked upon completion. - On success: `cb(null, messageIds)` where `messageIds` is an array of
published message IDs (one per queue for exchange routing, or one for
direct queue routing). - On error: `cb(error)` where `error` is one of: - `ProducerNotRunningError`: Producer is not running. - `MessageExchangeRequiredError`: Message has neither queue nor exchange. - `NoMatchedQueuesForMessageExchangeError`: Exchange matched no queues. - Other errors from queue or exchange operations.

#### Returns

`void`

#### Throws

ProducerNotRunningError

#### Throws

MessageExchangeRequiredError

#### Throws

RoutingKeyRequiredError

#### Throws

NoMatchedQueuesForMessageExchangeError

#### Throws

QueueHasNoConsumerGroupsError

#### Throws

QueueNotFoundError

#### Throws

ConsumerGroupNotFoundError

#### Throws

MessagePriorityRequiredError

#### Throws

MessageAlreadyExistsError

#### Throws

PriorityQueuingNotEnabledError

#### Throws

InvalidQueueTypeError

#### Throws

UnexpectedScriptReplyError

#### Example

```typescript
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
```

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

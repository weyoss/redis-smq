[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / Producer

# Class: Producer

Produces messages to queues or exchanges.

Manages message publishing with support for direct queue delivery
and exchange-based routing (direct, topic, fanout).

## Example

```ts
const producer = new Producer();
await producer.run();

const msg = new ProducibleMessage()
  .setQueue({ name: 'orders', ns: 'default' })
  .setBody({ orderId: 123 });

const ids = await producer.produce(msg);
```

## Extends

- `Runnable`\<[`TProducerEvent`](../type-aliases/TProducerEvent.md)\>

## Constructors

### Constructor

> **new Producer**(): `Producer`

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

Publishes a message to a queue or exchange.

##### Parameters

###### msg

[`ProducibleMessage`](ProducibleMessage.md)

Message to publish (must have queue or exchange)

##### Returns

`Promise`\<`string`[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise - direct to queue
const msg = new ProducibleMessage()
  .setQueue({ name: 'orders', ns: 'default' })
  .setBody({ orderId: 123 });
const ids = await producer.produce(msg);

// Callback - exchange routing
const exchangeMsg = new ProducibleMessage()
  .setExchange({ name: 'events', ns: 'system', type: 'topic' })
  .setExchangeRoutingKey('user.created');
producer.produce(exchangeMsg, (err, ids) => {
  if (err) throw err;
  console.log(ids);
});
```

#### Call Signature

> **produce**(`msg`, `cb`): `void`

Publishes a message to a queue or exchange.

##### Parameters

###### msg

[`ProducibleMessage`](ProducibleMessage.md)

Message to publish (must have queue or exchange)

###### cb

`ICallback`\<`string`[]\>

(err, messageIds) => void. Returns string[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise - direct to queue
const msg = new ProducibleMessage()
  .setQueue({ name: 'orders', ns: 'default' })
  .setBody({ orderId: 123 });
const ids = await producer.produce(msg);

// Callback - exchange routing
const exchangeMsg = new ProducibleMessage()
  .setExchange({ name: 'events', ns: 'system', type: 'topic' })
  .setExchangeRoutingKey('user.created');
producer.produce(exchangeMsg, (err, ids) => {
  if (err) throw err;
  console.log(ids);
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

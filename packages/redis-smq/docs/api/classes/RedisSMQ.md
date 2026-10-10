[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / RedisSMQ

# Class: RedisSMQ

The main RedisSMQ facade.

Every method is static. The class is never instantiated — it exists to
expose the library's public surface in one place: the two lifecycle
methods that bring the underlying machinery up and down, and a set of
`create*` / `start*` methods that construct the library's runtime
components.

---

### Lifecycle

`initialize()` must be called once before any `create*` or `start*`
method. Calling a constructor method on an uninitialized library
throws `PanicError`.

`shutdown()` tears down every component that was created during the
current lifecycle, plus the connection pool, configuration, and event
buses. A caller who wants to use the library again calls
`initialize()` again; the state machine permits this because every
shutdown leaves the state at `DOWN` with an empty component registry.

---

### Composition

Each `create*` method constructs a concrete class from `core/`,
registers it for teardown, and returns it typed as its contract
interface. The concrete class is not part of the public API — a
caller who inspects the return value sees `IConsumer`, not
`Consumer`. Every concrete class implements its contract, so the
compiler verifies that the shape the caller sees matches the shape
the library promised.

The `build` helper above performs the initialization check, the
construction, and the registration. The three steps are identical
for every component; only the constructor differs.

---

### Return types

Every method returns an interface from `contracts/`. This is what
makes the concrete classes replaceable without breaking callers: as
long as a new implementation satisfies the interface, the facade can
return it.

---

### Example

```ts
import { RedisSMQ, ProducibleMessage } from 'redis-smq';

// One-time initialization
await RedisSMQ.initialize({
  client: ERedisConfigClient.IOREDIS,
  options: { host: '127.0.0.1', port: 6379 },
});

// Create a producer and publish a message
const producer = await RedisSMQ.startProducer();
const msg = new ProducibleMessage()
  .setQueue({ name: 'orders', ns: 'default' })
  .setBody({ orderId: 123 });
await producer.produce(msg);

// Create a consumer and subscribe a handler
const consumer = await RedisSMQ.startConsumer();
await consumer.consume('orders', async (m) => {
  console.log(m.getBody());
});

// Tear everything down at process exit
await RedisSMQ.shutdown();
```

## Constructors

### Constructor

> **new RedisSMQ**(): `RedisSMQ`

#### Returns

`RedisSMQ`

## Properties

### initialize

> `static` **initialize**: \{(): `Promise`\<`void`\>; (`cb`): `void`; (`redisConfig`): `Promise`\<`void`\>; (`redisConfig`, `cb`): `void`; \} = `LifecycleManager.initialize`

Initializes RedisSMQ.

Must be called once before any other method. Brings up the
connection pool, loads the configuration (from Redis, or saves the
defaults if none exists), starts both event buses, starts the
configuration sync mechanism, and starts the background-job
cluster.

Concurrency:

- A call while RedisSMQ is already running resolves immediately.
- A call while initialization is in flight queues the caller; the
  callback fires once the in-flight initialization settles.
- A call during shutdown fails with `PanicError`. The caller
  should wait for shutdown to complete, then initialize again.

On failure, every resource acquired during the attempt is released
and the state machine returns to `DOWN`. A subsequent call can
retry from a clean slate.

#### Call Signature

> (): `Promise`\<`void`\>

Initializes RedisSMQ.

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

#### Call Signature

> (`cb`): `void`

Initializes RedisSMQ.

##### Parameters

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

#### Call Signature

> (`redisConfig`): `Promise`\<`void`\>

Initializes RedisSMQ.

##### Parameters

###### redisConfig

`IRedisConfig`

Optional Redis configuration

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

#### Call Signature

> (`redisConfig`, `cb`): `void`

Initializes RedisSMQ.

##### Parameters

###### redisConfig

`IRedisConfig`

Optional Redis configuration

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

#### Param

**redisConfig**

Optional Redis connection configuration.
When omitted, the library uses connection defaults
(localhost:6379, database 0).

---

### isRunning

> `static` **isRunning**: () => `boolean` = `LifecycleManager.isRunning`

Returns whether RedisSMQ is currently running.

True between the completion of a successful `initialize()` and the
beginning of `shutdown()`. False during startup, during shutdown,
and after shutdown.

Checks if RedisSMQ is currently running.

#### Returns

`boolean`

true if initialized and running

---

### shutdown

> `static` **shutdown**: \{(): `Promise`\<`void`\>; (`cb`): `void`; \} = `LifecycleManager.shutdown`

Gracefully shuts down RedisSMQ.

Stops the background-job cluster, tears down every component
produced by the `create*` methods, stops the configuration sync,
stops both event buses, and closes the connection pool. The state
machine returns to `DOWN`.

Idempotent:

- A call while the library is already down resolves immediately.
- A call while a shutdown is in flight queues the caller; the
  callback fires once the in-flight shutdown completes.
- A call while initialization is in flight fails with
  `PanicError`.

#### Call Signature

> (): `Promise`\<`void`\>

Gracefully shuts down RedisSMQ.

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

#### Call Signature

> (`cb`): `void`

Gracefully shuts down RedisSMQ.

##### Parameters

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

## Methods

### createConfigManager()

> `static` **createConfigManager**(): [`IConfigManager`](../interfaces/IConfigManager.md)

Creates a configuration manager.

#### Returns

[`IConfigManager`](../interfaces/IConfigManager.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createConsumer()

> `static` **createConsumer**(`consumerOptions?`): [`IConsumer`](../interfaces/IConsumer.md)

Creates a new consumer.

The returned consumer is not started. Call `run()` on it before
consuming, or use `startConsumer()` to combine creation and
startup.

#### Parameters

##### consumerOptions?

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

Optional consumer configuration.

#### Returns

[`IConsumer`](../interfaces/IConsumer.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createConsumerGroupsManager()

> `static` **createConsumerGroupsManager**(): [`IConsumerGroupsManager`](../interfaces/IConsumerGroupsManager.md)

Creates a consumer-groups manager.

#### Returns

[`IConsumerGroupsManager`](../interfaces/IConsumerGroupsManager.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createDirectExchange()

> `static` **createDirectExchange**(): [`IExchangeDirect`](../interfaces/IExchangeDirect.md)

Creates a direct exchange.

#### Returns

[`IExchangeDirect`](../interfaces/IExchangeDirect.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createExchangeManager()

> `static` **createExchangeManager**(): [`IExchangeManager`](../interfaces/IExchangeManager.md)

Creates an exchange manager.

The manager is the entry point for callers who carry the exchange
type as a runtime value: it exposes every exchange operation
(create, delete, bindQueue, unbindQueue, matchQueues, getBindings,
plus the type-specific reads and the registry-wide discovery
methods) on a single object. `createDirectExchange()`,
`createTopicExchange()`, and `createFanoutExchange()` return
type-specific facades that delegate to a manager of their own; a
caller who knows the type at the call site uses those.

Unlike the three facades, the manager exposes the discovery
methods — `getAllExchanges()`, `getNamespaceExchanges()`, and
`getQueueExchanges()` — because those describe the global exchange
registry rather than a single exchange.

#### Returns

[`IExchangeManager`](../interfaces/IExchangeManager.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createFanoutExchange()

> `static` **createFanoutExchange**(): [`IExchangeFanout`](../interfaces/IExchangeFanout.md)

Creates a fanout exchange.

#### Returns

[`IExchangeFanout`](../interfaces/IExchangeFanout.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createMessageManager()

> `static` **createMessageManager**(): [`IMessageManager`](../interfaces/IMessageManager.md)

Creates a message manager.

#### Returns

[`IMessageManager`](../interfaces/IMessageManager.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createNamespaceManager()

> `static` **createNamespaceManager**(): [`INamespaceManager`](../interfaces/INamespaceManager.md)

Creates a namespace manager.

#### Returns

[`INamespaceManager`](../interfaces/INamespaceManager.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createProducer()

> `static` **createProducer**(): [`IProducer`](../interfaces/IProducer.md)

Creates a new producer.

The returned producer is not started. Call `run()` on it before
publishing, or use `startProducer()` to combine creation and
startup.

#### Returns

[`IProducer`](../interfaces/IProducer.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createQueueAcknowledgedMessages()

> `static` **createQueueAcknowledgedMessages**(): [`IQueueAcknowledgedMessages`](../interfaces/IQueueAcknowledgedMessages.md)

Creates a browser for a queue's acknowledged messages.

Requires the `messageAudit.acknowledgedMessages` audit to be
enabled; every method on the browser raises
`AcknowledgmentAuditDisabledError` when it is not.

#### Returns

[`IQueueAcknowledgedMessages`](../interfaces/IQueueAcknowledgedMessages.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createQueueDeadLetteredMessages()

> `static` **createQueueDeadLetteredMessages**(): [`IQueueDeadLetteredMessages`](../interfaces/IQueueDeadLetteredMessages.md)

Creates a browser for a queue's dead-lettered messages.

Requires the `messageAudit.deadLetteredMessages` audit to be
enabled; every method on the browser raises
`DeadLetterAuditDisabledError` when it is not.

#### Returns

[`IQueueDeadLetteredMessages`](../interfaces/IQueueDeadLetteredMessages.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createQueueManager()

> `static` **createQueueManager**(): [`IQueueManager`](../interfaces/IQueueManager.md)

Creates a queue manager.

#### Returns

[`IQueueManager`](../interfaces/IQueueManager.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createQueueOperationValidator()

> `static` **createQueueOperationValidator**(): [`IQueueOperationValidatorStatic`](../interfaces/IQueueOperationValidatorStatic.md)

Returns QueueOperationValidator class

#### Returns

[`IQueueOperationValidatorStatic`](../interfaces/IQueueOperationValidatorStatic.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createQueuePendingMessages()

> `static` **createQueuePendingMessages**(): [`IQueuePendingMessages`](../interfaces/IQueuePendingMessages.md)

Creates a browser for a queue's pending messages.

#### Returns

[`IQueuePendingMessages`](../interfaces/IQueuePendingMessages.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createQueuePublishedMessages()

> `static` **createQueuePublishedMessages**(): [`IQueuePublishedMessages`](../interfaces/IQueuePublishedMessages.md)

Creates a browser for a queue's published messages.

#### Returns

[`IQueuePublishedMessages`](../interfaces/IQueuePublishedMessages.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createQueueRateLimitManager()

> `static` **createQueueRateLimitManager**(): [`IQueueRateLimitManager`](../interfaces/IQueueRateLimitManager.md)

Creates a queue rate-limit manager.

#### Returns

[`IQueueRateLimitManager`](../interfaces/IQueueRateLimitManager.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createQueueScheduledMessages()

> `static` **createQueueScheduledMessages**(): [`IQueueScheduledMessages`](../interfaces/IQueueScheduledMessages.md)

Creates a browser for a queue's scheduled messages.

#### Returns

[`IQueueScheduledMessages`](../interfaces/IQueueScheduledMessages.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createQueueStateManager()

> `static` **createQueueStateManager**(): [`IQueueStateManager`](../interfaces/IQueueStateManager.md)

Creates a queue state manager.

#### Returns

[`IQueueStateManager`](../interfaces/IQueueStateManager.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### createTopicExchange()

> `static` **createTopicExchange**(): [`IExchangeTopic`](../interfaces/IExchangeTopic.md)

Creates a topic exchange.

#### Returns

[`IExchangeTopic`](../interfaces/IExchangeTopic.md)

#### Throws

PanicError if RedisSMQ is not initialized.

---

### getDefaultConsumerOptions()

> `static` **getDefaultConsumerOptions**(): [`IConsumerOptions`](../interfaces/IConsumerOptions.md)

Gets current default options for Consumer instances.

#### Returns

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

Copy of default options

#### Example

```ts
const defaults = RedisSMQ.getDefaultConsumerOptions();
console.log(defaults);
```

---

### getDefaultMessageConsumeOptions()

> `static` **getDefaultMessageConsumeOptions**(): [`TMessageConsumeOptions`](../type-aliases/TMessageConsumeOptions.md)

Gets current default options for Consumer instances.

#### Returns

[`TMessageConsumeOptions`](../type-aliases/TMessageConsumeOptions.md)

Copy of default options

#### Example

```ts
const defaults = Consumer.getDefaultOptions();
console.log(defaults);
```

---

### getEventBus()

> `static` **getEventBus**(): [`IEventBus`](../interfaces/IEventBus.md)

Retrieve the EventBus instance.

#### Returns

[`IEventBus`](../interfaces/IEventBus.md)

---

### newProducibleMessage()

> `static` **newProducibleMessage**(): [`IProducibleMessage`](../interfaces/IProducibleMessage.md)

Creates a ProducibleMessage instance.

#### Returns

[`IProducibleMessage`](../interfaces/IProducibleMessage.md)

---

### setDefaultConsumerOptions()

> `static` **setDefaultConsumerOptions**(`options`): `void`

Sets default options for all future Consumer instances.

#### Parameters

##### options

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

Default consumer options

#### Returns

`void`

#### Example

```ts
RedisSMQ.setDefaultConsumerOptions({
  enableMultiplexing: true,
  heartbeatTTL: 60000,
});
```

---

### setDefaultMessageConsumeOptions()

> `static` **setDefaultMessageConsumeOptions**(`options`): `void`

Sets default consume options for all future ProducibleMessage instances.

#### Parameters

##### options

`Partial`\<[`TMessageConsumeOptions`](../type-aliases/TMessageConsumeOptions.md)\>

Partial options to override defaults

#### Returns

`void`

#### Example

```ts
setDefaultConsumerOptions.setDefaultMessageConsumeOptions({
  ttl: 60000,
  retryThreshold: 5,
  retryDelay: 30000,
});
```

---

### startConsumer()

#### Call Signature

> `static` **startConsumer**(`consumerOptions?`): `Promise`\<[`IConsumer`](../interfaces/IConsumer.md)\>

Creates a new consumer and starts it in one call.

Same two-mode contract as `startProducer`. The consumer is started
before any handlers are registered; a consumer with no handlers is
valid and waits for `consume()` calls.

##### Parameters

###### consumerOptions?

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

##### Returns

`Promise`\<[`IConsumer`](../interfaces/IConsumer.md)\>

#### Call Signature

> `static` **startConsumer**(`consumerOptions`, `cb`): [`IConsumer`](../interfaces/IConsumer.md)

Creates a new consumer and starts it in one call.

Same two-mode contract as `startProducer`. The consumer is started
before any handlers are registered; a consumer with no handlers is
valid and waits for `consume()` calls.

##### Parameters

###### consumerOptions

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

###### cb

`ICallback`

##### Returns

[`IConsumer`](../interfaces/IConsumer.md)

---

### startProducer()

#### Call Signature

> `static` **startProducer**(): `Promise`\<[`IProducer`](../interfaces/IProducer.md)\>

Creates a new producer and starts it in one call.

The promise overload resolves with the producer once it is up; the
callback overload returns the producer synchronously and fires the
callback when startup completes or fails. A caller who receives the
producer from the callback overload must not publish until the
callback has fired — the producer rejects with
`ProducerNotRunningError` until its `run()` sequence has completed.

##### Returns

`Promise`\<[`IProducer`](../interfaces/IProducer.md)\>

#### Call Signature

> `static` **startProducer**(`cb`): [`IProducer`](../interfaces/IProducer.md)

Creates a new producer and starts it in one call.

The promise overload resolves with the producer once it is up; the
callback overload returns the producer synchronously and fires the
callback when startup completes or fails. A caller who receives the
producer from the callback overload must not publish until the
callback has fired — the producer rejects with
`ProducerNotRunningError` until its `run()` sequence has completed.

##### Parameters

###### cb

`ICallback`

##### Returns

[`IProducer`](../interfaces/IProducer.md)

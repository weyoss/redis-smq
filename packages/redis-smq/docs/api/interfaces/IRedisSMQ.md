[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IRedisSMQ

# Interface: IRedisSMQ

The main RedisSMQ facade.

Every method on this class is static. The class is never instantiated —
there is no constructor to call, no `new RedisSMQ()`. Its job is to
expose the library's public surface in one place: a set of factory
methods that construct the library's managers and runtime components,
plus the two lifecycle methods that bring the underlying machinery up
and down.

Before any factory method or starter method can be called, the
library must be initialized via `initialize()`. Every factory throws
`PanicError` with the message "RedisSMQ is not initialized" if called
beforehand. This is a deliberate constraint: the factories depend on
an initialized Redis connection pool, a loaded configuration, running
event buses, and a running background-job cluster. Initializing these
lazily on first use would make error handling more complex without a
corresponding benefit.

Shutting down via `shutdown()` tears down everything the library
started, including every component the factories have produced up to
that point (they are tracked by a `ComponentRegistry` internally). A
caller who wants to keep using the library after `shutdown()` must
call `initialize()` again.

---

### Why this is not a compile-time contract

TypeScript interfaces describe instances, not classes. They have no
syntax for `static` members, and a class cannot `implements` an
interface meant to describe its own static surface. This interface is
therefore documentation: it names every static member, describes its
behavior, and provides the exact overload shapes. The class file
remains the source of truth, and the compiler verifies nothing here.

The alternative would be to write the whole surface as a `type` alias
describing the class object:

type TRedisSMQ = typeof RedisSMQ;

That is technically stronger, but it says nothing a reader cannot see
by opening the class. The interface form documents intent and
behavior, which is what a contract file is for.

## Methods

### createConfigManager()

> **createConfigManager**(): [`IConfigManager`](IConfigManager.md)

Creates a configuration manager for reading and updating the
runtime configuration.

#### Returns

[`IConfigManager`](IConfigManager.md)

---

### createConsumer()

> **createConsumer**(`consumerOptions?`): [`IConsumer`](IConsumer.md)

Creates a new consumer.

The returned consumer is not started. The caller must call
`consumer.run()` before consuming. If the caller expects to consume
immediately, `startConsumer()` is a convenience that combines
creation and startup.

#### Parameters

##### consumerOptions?

[`IConsumerOptions`](IConsumerOptions.md)

Optional consumer configuration.

#### Returns

[`IConsumer`](IConsumer.md)

---

### createConsumerGroupsManager()

> **createConsumerGroupsManager**(): [`IConsumerGroupsManager`](IConsumerGroupsManager.md)

Creates a consumer-groups manager for creating, deleting, and
listing consumer groups on PUB/SUB queues.

#### Returns

[`IConsumerGroupsManager`](IConsumerGroupsManager.md)

---

### createDirectExchange()

> **createDirectExchange**(): [`IExchangeDirect`](IExchangeDirect.md)

Creates a direct exchange for exact routing-key matching.

#### Returns

[`IExchangeDirect`](IExchangeDirect.md)

---

### createExchangeManager()

> **createExchangeManager**(): [`IExchangeManager`](IExchangeManager.md)

Creates an exchange manager.

The manager is the general entry point for exchange operations. It
is the surface for callers who carry the exchange type as a runtime
value: an `EExchangeType` read from a config, a parameter on a
dispatch function, or a field discovered from a queue's
exchange-bindings index. Those callers use the manager; a caller
who knows the type at compile time uses one of the three facades
below.

The manager's public surface differs from the facades' in three
ways:

- Only `create(exchange, type, queuePolicy)` takes the exchange
  type — every other operation reads the stored type from Redis
  and dispatches internally.

- It exposes the registry-wide discovery methods
  (`getAllExchanges`, `getNamespaceExchanges`,
  `getQueueExchanges`) and the per-exchange utilities
  (`getProperties`, `exists`). The facades deliberately do not
  expose these — a facade's result set has nothing to do with the
  exchange it is a handle for.

- Its `matchQueues`, `getBindings`, and `getBindingQueues` return
  a union over the three exchange types. A caller who knows the
  type at the call site uses a facade, where the return is the
  specific shape.

#### Returns

[`IExchangeManager`](IExchangeManager.md)

---

### createFanoutExchange()

> **createFanoutExchange**(): [`IExchangeFanout`](IExchangeFanout.md)

Creates a fanout exchange for broadcast routing.

#### Returns

[`IExchangeFanout`](IExchangeFanout.md)

---

### createMessageManager()

> **createMessageManager**(): [`IMessageManager`](IMessageManager.md)

Creates a message manager for querying, deleting, and requeuing
individual messages by ID.

#### Returns

[`IMessageManager`](IMessageManager.md)

---

### createNamespaceManager()

> **createNamespaceManager**(): [`INamespaceManager`](INamespaceManager.md)

Creates a namespace manager for listing and deleting namespaces.

#### Returns

[`INamespaceManager`](INamespaceManager.md)

---

### createProducer()

> **createProducer**(): [`IProducer`](IProducer.md)

Creates a new producer.

The returned producer is not started. The caller must call
`producer.run()` before publishing. If the caller expects to
publish immediately, `startProducer()` is a convenience that
combines creation and startup.

#### Returns

[`IProducer`](IProducer.md)

---

### createQueueAcknowledgedMessages()

> **createQueueAcknowledgedMessages**(): [`IQueueAcknowledgedMessages`](IQueueAcknowledgedMessages.md)

Creates a browser for the queue's acknowledged list.

Requires the `messageAudit.acknowledgedMessages` audit to be enabled
in the configuration. Every method raises
`AcknowledgmentAuditDisabledError` when it is not.

#### Returns

[`IQueueAcknowledgedMessages`](IQueueAcknowledgedMessages.md)

---

### createQueueDeadLetteredMessages()

> **createQueueDeadLetteredMessages**(): [`IQueueDeadLetteredMessages`](IQueueDeadLetteredMessages.md)

Creates a browser for the queue's dead-letter list.

Requires the `messageAudit.deadLetteredMessages` audit to be enabled
in the configuration. Every method raises
`DeadLetterAuditDisabledError` when it is not.

#### Returns

[`IQueueDeadLetteredMessages`](IQueueDeadLetteredMessages.md)

---

### createQueueManager()

> **createQueueManager**(): [`IQueueManager`](IQueueManager.md)

Creates a queue manager for creating, deleting, and inspecting
queues.

#### Returns

[`IQueueManager`](IQueueManager.md)

---

### createQueuePendingMessages()

> **createQueuePendingMessages**(): [`IQueuePendingMessages`](IQueuePendingMessages.md)

Creates a browser for the queue's pending list — messages waiting
to be consumed.

#### Returns

[`IQueuePendingMessages`](IQueuePendingMessages.md)

---

### createQueuePublishedMessages()

> **createQueuePublishedMessages**(): [`IQueuePublishedMessages`](IQueuePublishedMessages.md)

Creates a browser for the queue's published-message list — every
message ever accepted, regardless of its current status.

#### Returns

[`IQueuePublishedMessages`](IQueuePublishedMessages.md)

---

### createQueueRateLimitManager()

> **createQueueRateLimitManager**(): [`IQueueRateLimitManager`](IQueueRateLimitManager.md)

Creates a rate-limit manager for setting, clearing, and querying a
queue's consumption rate limit.

#### Returns

[`IQueueRateLimitManager`](IQueueRateLimitManager.md)

---

### createQueueScheduledMessages()

> **createQueueScheduledMessages**(): [`IQueueScheduledMessages`](IQueueScheduledMessages.md)

Creates a browser for the queue's scheduled set — messages with a
delay, CRON, or repeat that have not yet been delivered.

#### Returns

[`IQueueScheduledMessages`](IQueueScheduledMessages.md)

---

### createQueueStateManager()

> **createQueueStateManager**(): [`IQueueStateManager`](IQueueStateManager.md)

Creates a queue state manager for pausing, resuming, stopping, and
inspecting queues' operational states.

#### Returns

[`IQueueStateManager`](IQueueStateManager.md)

---

### createTopicExchange()

> **createTopicExchange**(): [`IExchangeTopic`](IExchangeTopic.md)

Creates a topic exchange for pattern-based routing.

#### Returns

[`IExchangeTopic`](IExchangeTopic.md)

---

### initialize()

#### Call Signature

> **initialize**(): `Promise`\<`void`\>

Initializes RedisSMQ.

Must be called once before any other method. Brings up the
connection pool, loads the configuration (from Redis, or saves a
default if none exists), starts the internal and public event
buses, starts the configuration sync mechanism, and starts the
background-job cluster.

Concurrency:

- A call while RedisSMQ is already running resolves immediately
  (the running instance is reused).
- A call while an initialization is in flight queues the caller;
  the callback fires once the in-flight initialization settles.
- A call during shutdown fails with `PanicError`. The caller
  should wait for shutdown to complete, then initialize again.

On failure, the entire initialization is rolled back — every
resource acquired during the attempt is released — and the state
machine returns to `DOWN`. A subsequent call can retry from a clean
slate. This is important: a failure in the middle of a startup
sequence must not leave the library half-initialized and unable to
re-initialize.

##### Returns

`Promise`\<`void`\>

#### Call Signature

> **initialize**(`cb`): `void`

##### Parameters

###### cb

`ICallback`

##### Returns

`void`

#### Call Signature

> **initialize**(`redisConfig`): `Promise`\<`void`\>

##### Parameters

###### redisConfig

`IRedisConfig`

##### Returns

`Promise`\<`void`\>

#### Call Signature

> **initialize**(`redisConfig`, `cb`): `void`

##### Parameters

###### redisConfig

`IRedisConfig`

###### cb

`ICallback`

##### Returns

`void`

---

### isRunning()

> **isRunning**(): `boolean`

Returns whether RedisSMQ is currently running.

True between the completion of a successful `initialize()` and the
beginning of a `shutdown()`. False during startup, during shutdown,
and after shutdown.

#### Returns

`boolean`

---

### shutdown()

#### Call Signature

> **shutdown**(): `Promise`\<`void`\>

Gracefully shuts down RedisSMQ.

Stops the background-job cluster, tears down every component the
factories produced, stops the configuration sync, stops both event
buses, and closes the connection pool. The state machine returns to
`DOWN`.

Idempotent:

- A call while the library is already down resolves immediately.
- A call while a shutdown is in flight queues the caller; the
  callback fires once the in-flight shutdown completes.
- A call while an initialization is in flight fails with
  `PanicError`. Shutting down a library that is mid-startup is a
  programming error; the caller should let initialization settle
  first.

After shutdown, the library is fully torn down. A subsequent
`initialize()` starts a new instance from scratch.

##### Returns

`Promise`\<`void`\>

#### Call Signature

> **shutdown**(`cb`): `void`

##### Parameters

###### cb

`ICallback`

##### Returns

`void`

---

### startConsumer()

#### Call Signature

> **startConsumer**(`consumerOptions?`): `Promise`\<[`IConsumer`](IConsumer.md)\>

Creates a new consumer and starts it in one call.

Equivalent to `createConsumer(options)` followed by `consumer.run()`.
The promise overload resolves with the consumer once it is up; the
callback overload returns the consumer synchronously and fires the
callback when it is up.

Note: the consumer is started before any handlers are registered.
A consumer with no handlers is valid — it runs, maintains its
heartbeat, and waits for `consume()` calls. This is intentional: a
caller who wants to subscribe handlers after startup, based on
runtime decisions, uses this method and then calls `consume()` per
queue.

##### Parameters

###### consumerOptions?

[`IConsumerOptions`](IConsumerOptions.md)

Optional consumer configuration.

##### Returns

`Promise`\<[`IConsumer`](IConsumer.md)\>

#### Call Signature

> **startConsumer**(`consumerOptions`, `cb`): [`IConsumer`](IConsumer.md)

##### Parameters

###### consumerOptions

[`IConsumerOptions`](IConsumerOptions.md)

###### cb

`ICallback`\<`void`\>

##### Returns

[`IConsumer`](IConsumer.md)

---

### startProducer()

#### Call Signature

> **startProducer**(): `Promise`\<[`IProducer`](IProducer.md)\>

Creates a new producer and starts it in one call.

Equivalent to `createProducer()` followed by `producer.run()`. The
promise overload resolves with the producer once it is up; the
callback overload returns the producer synchronously and fires the
callback when it is up.

##### Returns

`Promise`\<[`IProducer`](IProducer.md)\>

#### Call Signature

> **startProducer**(`cb`): [`IProducer`](IProducer.md)

##### Parameters

###### cb

`ICallback`

##### Returns

[`IProducer`](IProducer.md)

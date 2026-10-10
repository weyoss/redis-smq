[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / LifecycleManager

# Class: LifecycleManager

Manages RedisSMQ system lifecycle (initialization and shutdown).

Handles resource initialization, connection pooling, event bus setup,
and graceful shutdown of all components.

Lifecycle contract:

- `initialize()` is transactional. On any failure (synchronous or
  asynchronous), every resource created during the attempt is torn down
  in reverse order, and the state machine is returned to DOWN, so a
  subsequent `initialize()` can be retried.
- All synchronous throws from singleton re-init guards are caught and
  routed through the same failure path as asynchronous errors.
- Waiters queued behind an in-flight transition are drained and isolated,
  so a single throwing callback cannot block the others.

## Constructors

### Constructor

> **new LifecycleManager**(): `LifecycleManager`

#### Returns

`LifecycleManager`

## Methods

### initialize()

#### Call Signature

> `static` **initialize**(): `Promise`\<`void`\>

Initializes RedisSMQ.

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

#### Call Signature

> `static` **initialize**(`cb`): `void`

Initializes RedisSMQ.

##### Parameters

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

#### Call Signature

> `static` **initialize**(`redisConfig`): `Promise`\<`void`\>

Initializes RedisSMQ.

##### Parameters

###### redisConfig

`IRedisConfig`

Optional Redis configuration

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

#### Call Signature

> `static` **initialize**(`redisConfig`, `cb`): `void`

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

---

### isRunning()

> `static` **isRunning**(): `boolean`

Checks if RedisSMQ is currently running.

#### Returns

`boolean`

true if initialized and running

---

### shutdown()

#### Call Signature

> `static` **shutdown**(): `Promise`\<`void`\>

Gracefully shuts down RedisSMQ.

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

#### Call Signature

> `static` **shutdown**(`cb`): `void`

Gracefully shuts down RedisSMQ.

##### Parameters

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

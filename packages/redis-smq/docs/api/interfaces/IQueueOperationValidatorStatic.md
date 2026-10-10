[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IQueueOperationValidatorStatic

# Interface: IQueueOperationValidatorStatic

The static surface of the `QueueOperationValidator` class.

`QueueOperationValidator` is a static-only class — every method is
static, and no caller ever instantiates it. TypeScript interfaces
cannot describe static members, and a class cannot `implements` a
static-side interface. So this interface is documentation, not a
compile-time constraint.

The class itself is where the constraint lives: `QueueOperationValidator`
is a concrete class whose static methods are checked against the
signatures here only by reviewer attention, not by the compiler. If
this matters more than the readability of a single contract file, the
alternative is to write each static method's JSDoc directly on the
class and skip the interface entirely.

The interface is included because it documents the public surface in
one place, which is what every other contract file in this directory
does. Consistency across the contract tree is worth more than the
small risk of an unverified static signature.

## Methods

### canBindExchange()

#### Call Signature

> **canBindExchange**(`queue`): `Promise`\<`boolean`\>

Checks whether an exchange can be bound to the queue.

Exchange binding is permitted under `ACTIVE`, `PAUSED`, and
`STOPPED`. It is refused under `LOCKED`.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **canBindExchange**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### canClearRateLimit()

#### Call Signature

> **canClearRateLimit**(`queue`): `Promise`\<`boolean`\>

Checks whether the queue's rate limit can be cleared.

Same permission profile as `canSetRateLimit`.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **canClearRateLimit**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### canConsume()

#### Call Signature

> **canConsume**(`queue`): `Promise`\<`boolean`\>

Checks whether messages can be consumed from a queue.

Consuming requires the queue to be `ACTIVE`. It is refused under
`PAUSED`, `STOPPED`, and `LOCKED`.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **canConsume**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### canCreateConsumerGroup()

#### Call Signature

> **canCreateConsumerGroup**(`queue`): `Promise`\<`boolean`\>

Checks whether a consumer group can be created on the queue.

Consumer-group creation is permitted under `ACTIVE`, `PAUSED`, and
`STOPPED`. It is refused under `LOCKED`. The permission is checked
in addition to the delivery-model precondition (the queue must be
PUB/SUB), which is enforced by `IConsumerGroups.saveConsumerGroup`.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **canCreateConsumerGroup**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### canDelete()

#### Call Signature

> **canDelete**(`queue`): `Promise`\<`boolean`\>

Checks whether the queue can be deleted.

Queue deletion is permitted under `ACTIVE`, `PAUSED`, and `STOPPED`.
It is refused under `LOCKED` — a locked queue is being operated on
by its lock holder, and deletion would destroy the operation's
target.

The permission checked here is orthogonal to the runtime
preconditions that `IQueueManager.delete()` enforces: a queue that
passes this check may still fail deletion if it has pending
messages, active consumers, or bound exchanges.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **canDelete**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### canDeleteConsumerGroup()

#### Call Signature

> **canDeleteConsumerGroup**(`queue`): `Promise`\<`boolean`\>

Checks whether a consumer group can be deleted from the queue.

Same permission profile as `canCreateConsumerGroup`.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **canDeleteConsumerGroup**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### canDeleteMessage()

#### Call Signature

> **canDeleteMessage**(`queue`): `Promise`\<`boolean`\>

Checks whether individual messages can be deleted from the queue.

Message deletion is permitted under `ACTIVE`, `PAUSED`, and
`STOPPED`. It is refused under `LOCKED`. The permission mirrors
`canDelete`: message-level deletion is a management operation that
a lock holder may need to perform.

A message in the `PROCESSING` state cannot be deleted regardless of
the queue's state — this is a message-level precondition enforced by
`IMessageManager.deleteMessageById`, not by the validator.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **canDeleteMessage**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### canProduce()

#### Call Signature

> **canProduce**(`queue`): `Promise`\<`boolean`\>

Checks whether messages can be produced to a queue.

Producing is allowed under `ACTIVE` and `PAUSED`. It is refused
under `STOPPED` and `LOCKED`. A paused queue buffers incoming
messages without consuming them, which is why publishing remains
permitted.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **canProduce**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### canPurge()

#### Call Signature

> **canPurge**(`queue`): `Promise`\<`boolean`\>

Checks whether the queue can be purged.

Purging is permitted under `ACTIVE`, `PAUSED`, and `STOPPED`. It is
refused under `LOCKED` — the lock holder is already operating on the
queue, and a concurrent purge would race with that operation.

As with `canDelete`, the permission is separate from the runtime
conditions enforced by `IQueueMessages.purge()`: a purge may fail
even when permitted here (for example, if the queue is already
locked by an in-progress purge job).

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **canPurge**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### canRequeue()

#### Call Signature

> **canRequeue**(`queue`): `Promise`\<`boolean`\>

Checks whether a failed message can be requeued.

Requeuing is permitted under `ACTIVE`, `PAUSED`, and `STOPPED`. It
is refused under `LOCKED`. The requeue operation creates a new
message from an acknowledged or dead-lettered one, which is a
management operation independent of the queue's processing state.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **canRequeue**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### canSetRateLimit()

#### Call Signature

> **canSetRateLimit**(`queue`): `Promise`\<`boolean`\>

Checks whether a rate limit can be set on the queue.

Rate-limit modification is permitted under `ACTIVE`, `PAUSED`, and
`STOPPED`. It is refused under `LOCKED` — a locked queue's rate
limit is frozen for the duration of the lock.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **canSetRateLimit**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### canUnbindExchange()

#### Call Signature

> **canUnbindExchange**(`queue`): `Promise`\<`boolean`\>

Checks whether an exchange can be unbound from the queue.

Same permission profile as `canBindExchange`.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **canUnbindExchange**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

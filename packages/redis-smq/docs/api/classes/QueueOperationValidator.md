[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / QueueOperationValidator

# Class: QueueOperationValidator

Utility class for validating and checking allowed operations on queues based on their operational state.

The QueueOperationValidator provides methods to determine whether specific operations are permitted
on a queue given its current state (ACTIVE, PAUSED, STOPPED, or LOCKED). Each queue state has a
predefined set of allowed operations defined in the operation registry.

Features:

- Validate operations with error callbacks when operations are not allowed
- Check operations with boolean results for conditional logic
- Support for checking single or multiple operations at once

Queue States and Allowed Operations:

- ACTIVE: All operations including consume, produce, and management
- PAUSED: All operations except CONSUME
- STOPPED: Only management operations (purge, delete, rate limits, consumer groups, exchanges)
- LOCKED: No operations allowed

## Example

```typescript
// Check if messages can be consumed
QueueOperationValidator.canConsume('my-queue', (err, canConsume) => {
  if (err) {
    console.error('Error:', err);
    return;
  }

  if (canConsume) {
    // Proceed with message consumption
  }
});
```

## Constructors

### Constructor

> **new QueueOperationValidator**(): `QueueOperationValidator`

#### Returns

`QueueOperationValidator`

## Methods

### canBindExchange()

> `static` **canBindExchange**(`queue`, `cb`): `void`

Checks if an exchange can be bound to the queue.
Exchange binding is allowed in all states except LOCKED.

#### Parameters

##### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function that receives (error, canBindExchange)

#### Returns

`void`

#### Example

```typescript
QueueOperationValidator.canBindExchange('my-queue', (err, canBind) => {
  if (canBind) {
    exchangeManager.bind('my-exchange', 'my-queue', 'routing-key');
  }
});
```

---

### canClearRateLimit()

> `static` **canClearRateLimit**(`queue`, `cb`): `void`

Checks if the rate limit can be cleared from the queue.
Rate limit clearing is allowed in all states except LOCKED.

#### Parameters

##### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function that receives (error, canClearRateLimit)

#### Returns

`void`

#### Example

```typescript
QueueOperationValidator.canClearRateLimit('api-queue', (err, canClear) => {
  if (canClear) {
    queueManager.clearRateLimit('api-queue');
  }
});
```

---

### canConsume()

> `static` **canConsume**(`queue`, `cb`): `void`

Checks if messages can be consumed from the specified queue.
Consumption is typically only allowed when the queue is in ACTIVE state.

#### Parameters

##### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function that receives (error, canConsume)

#### Returns

`void`

#### Example

```typescript
QueueOperationValidator.canConsume('orders-queue', (err, canConsume) => {
  if (canConsume) {
    consumer.consume();
  }
});
```

---

### canCreateConsumerGroup()

> `static` **canCreateConsumerGroup**(`queue`, `cb`): `void`

Checks if a consumer group can be created for the queue.
Consumer group creation is allowed in all states except LOCKED.

#### Parameters

##### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function that receives (error, canCreateConsumerGroup)

#### Returns

`void`

#### Example

```typescript
QueueOperationValidator.canCreateConsumerGroup(
  'orders-queue',
  (err, canCreate) => {
    if (canCreate) {
      queueManager.createConsumerGroup('orders-queue', 'group-1');
    }
  },
);
```

---

### canDelete()

> `static` **canDelete**(`queue`, `cb`): `void`

Checks if the queue can be deleted.
Queue deletion is allowed in all states except LOCKED.

#### Parameters

##### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function that receives (error, canDelete)

#### Returns

`void`

#### Example

```typescript
QueueOperationValidator.canDelete('temporary-queue', (err, canDelete) => {
  if (canDelete) {
    queueManager.deleteQueue('temporary-queue');
  }
});
```

---

### canDeleteConsumerGroup()

> `static` **canDeleteConsumerGroup**(`queue`, `cb`): `void`

Checks if a consumer group can be deleted from the queue.
Consumer group deletion is allowed in all states except LOCKED.

#### Parameters

##### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function that receives (error, canDeleteConsumerGroup)

#### Returns

`void`

#### Example

```typescript
QueueOperationValidator.canDeleteConsumerGroup(
  'orders-queue',
  (err, canDelete) => {
    if (canDelete) {
      queueManager.deleteConsumerGroup('orders-queue', 'group-1');
    }
  },
);
```

---

### canDeleteMessage()

> `static` **canDeleteMessage**(`queue`, `cb`): `void`

Checks if messages can be deleted from the queue.
Message deletion is allowed in all states except LOCKED.

#### Parameters

##### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function that receives (error, canDeleteMessage)

#### Returns

`void`

#### Example

```typescript
QueueOperationValidator.canDeleteMessage('my-queue', (err, canDelete) => {
  if (canDelete) {
    messageService.deleteMessage(messageId);
  }
});
```

---

### canProduce()

> `static` **canProduce**(`queue`, `cb`): `void`

Checks if messages can be produced/published to the specified queue.
Production is allowed in ACTIVE and PAUSED states, but not in STOPPED or LOCKED states.

#### Parameters

##### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function that receives (error, canProduce)

#### Returns

`void`

#### Example

```typescript
QueueOperationValidator.canProduce('notifications-queue', (err, canProduce) => {
  if (canProduce) {
    producer.produce(message);
  } else {
    console.log('Queue is not accepting messages');
  }
});
```

---

### canPurge()

> `static` **canPurge**(`queue`, `cb`): `void`

Checks if the queue can be purged (all messages removed).
Queue purging is allowed in all states except LOCKED.

#### Parameters

##### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function that receives (error, canPurge)

#### Returns

`void`

#### Example

```typescript
QueueOperationValidator.canPurge('dead-letter-queue', (err, canPurge) => {
  if (canPurge) {
    queueManager.purgeQueue('dead-letter-queue');
  }
});
```

---

### canRequeue()

> `static` **canRequeue**(`queue`, `cb`): `void`

Checks if messages can be requeued for reprocessing.
Requeuing is allowed in all states except LOCKED.

#### Parameters

##### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function that receives (error, canRequeue)

#### Returns

`void`

#### Example

```typescript
QueueOperationValidator.canRequeue(
  'failed-messages-queue',
  (err, canRequeue) => {
    if (canRequeue) {
      message.requeue();
    }
  },
);
```

---

### canSetRateLimit()

> `static` **canSetRateLimit**(`queue`, `cb`): `void`

Checks if a rate limit can be set on the queue.
Rate limiting configuration is allowed in all states except LOCKED.

#### Parameters

##### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function that receives (error, canSetRateLimit)

#### Returns

`void`

#### Example

```typescript
QueueOperationValidator.canSetRateLimit('api-queue', (err, canSet) => {
  if (canSet) {
    queueManager.setRateLimit('api-queue', { limit: 100, interval: 1000 });
  }
});
```

---

### canUnbindExchange()

> `static` **canUnbindExchange**(`queue`, `cb`): `void`

Checks if an exchange can be unbound from the queue.
Exchange unbinding is allowed in all states except LOCKED.

#### Parameters

##### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function that receives (error, canUnbindExchange)

#### Returns

`void`

#### Example

```typescript
QueueOperationValidator.canUnbindExchange('my-queue', (err, canUnbind) => {
  if (canUnbind) {
    exchangeManager.unbind('my-exchange', 'my-queue', 'routing-key');
  }
});
```

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
// Callback pattern
QueueOperationValidator.canConsume('my-queue', (err, canConsume) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  if (canConsume) {
    consumer.consume();
  }
});

// Promise pattern
try {
  const canConsume = await QueueOperationValidator.canConsume('my-queue');
  if (canConsume) {
    consumer.consume();
  }
} catch (err) {
  console.error('Error:', err);
}
```

## Constructors

### Constructor

> **new QueueOperationValidator**(): `QueueOperationValidator`

#### Returns

`QueueOperationValidator`

## Methods

### canBindExchange()

#### Call Signature

> `static` **canBindExchange**(`queue`): `Promise`\<`boolean`\>

Checks if an exchange can be bound to the queue.
Exchange binding is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canBindExchange('my-queue', (err, canBind) => {
  if (err) {
    console.error('Error checking bind exchange permission:', err);
  } else if (canBind) {
    console.log('Can bind exchange');
    exchangeManager.bind('my-exchange', 'my-queue', 'routing-key');
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canBind = await QueueOperationValidator.canBindExchange('my-queue');
  if (canBind) {
    console.log('Can bind exchange');
    await exchangeManager.bind('my-exchange', 'my-queue', 'routing-key');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking bind exchange permission:', err);
}
```

#### Call Signature

> `static` **canBindExchange**(`queue`, `cb`): `void`

Checks if an exchange can be bound to the queue.
Exchange binding is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function that receives (error, canBindExchange)

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canBindExchange('my-queue', (err, canBind) => {
  if (err) {
    console.error('Error checking bind exchange permission:', err);
  } else if (canBind) {
    console.log('Can bind exchange');
    exchangeManager.bind('my-exchange', 'my-queue', 'routing-key');
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canBind = await QueueOperationValidator.canBindExchange('my-queue');
  if (canBind) {
    console.log('Can bind exchange');
    await exchangeManager.bind('my-exchange', 'my-queue', 'routing-key');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking bind exchange permission:', err);
}
```

---

### canClearRateLimit()

#### Call Signature

> `static` **canClearRateLimit**(`queue`): `Promise`\<`boolean`\>

Checks if the rate limit can be cleared from the queue.
Rate limit clearing is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canClearRateLimit('api-queue', (err, canClear) => {
  if (err) {
    console.error('Error checking clear rate limit permission:', err);
  } else if (canClear) {
    console.log('Can clear rate limit');
    queueManager.clearRateLimit('api-queue');
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canClear = await QueueOperationValidator.canClearRateLimit('api-queue');
  if (canClear) {
    console.log('Can clear rate limit');
    await queueManager.clearRateLimit('api-queue');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking clear rate limit permission:', err);
}
```

#### Call Signature

> `static` **canClearRateLimit**(`queue`, `cb`): `void`

Checks if the rate limit can be cleared from the queue.
Rate limit clearing is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function that receives (error, canClearRateLimit)

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canClearRateLimit('api-queue', (err, canClear) => {
  if (err) {
    console.error('Error checking clear rate limit permission:', err);
  } else if (canClear) {
    console.log('Can clear rate limit');
    queueManager.clearRateLimit('api-queue');
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canClear = await QueueOperationValidator.canClearRateLimit('api-queue');
  if (canClear) {
    console.log('Can clear rate limit');
    await queueManager.clearRateLimit('api-queue');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking clear rate limit permission:', err);
}
```

---

### canConsume()

#### Call Signature

> `static` **canConsume**(`queue`): `Promise`\<`boolean`\>

Checks if messages can be consumed from the specified queue.
Consumption is typically only allowed when the queue is in ACTIVE state.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canConsume('orders-queue', (err, canConsume) => {
  if (err) {
    console.error('Error checking consume permission:', err);
  } else if (canConsume) {
    console.log('Can consume from queue');
    consumer.consume();
  } else {
    console.log('Queue is not in ACTIVE state');
  }
});

// Promise pattern
try {
  const canConsume = await QueueOperationValidator.canConsume('orders-queue');
  if (canConsume) {
    console.log('Can consume from queue');
    consumer.consume();
  } else {
    console.log('Queue is not in ACTIVE state');
  }
} catch (err) {
  console.error('Error checking consume permission:', err);
}
```

#### Call Signature

> `static` **canConsume**(`queue`, `cb`): `void`

Checks if messages can be consumed from the specified queue.
Consumption is typically only allowed when the queue is in ACTIVE state.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function that receives (error, canConsume)

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canConsume('orders-queue', (err, canConsume) => {
  if (err) {
    console.error('Error checking consume permission:', err);
  } else if (canConsume) {
    console.log('Can consume from queue');
    consumer.consume();
  } else {
    console.log('Queue is not in ACTIVE state');
  }
});

// Promise pattern
try {
  const canConsume = await QueueOperationValidator.canConsume('orders-queue');
  if (canConsume) {
    console.log('Can consume from queue');
    consumer.consume();
  } else {
    console.log('Queue is not in ACTIVE state');
  }
} catch (err) {
  console.error('Error checking consume permission:', err);
}
```

---

### canCreateConsumerGroup()

#### Call Signature

> `static` **canCreateConsumerGroup**(`queue`): `Promise`\<`boolean`\>

Checks if a consumer group can be created for the queue.
Consumer group creation is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canCreateConsumerGroup(
  'orders-queue',
  (err, canCreate) => {
    if (err) {
      console.error('Error checking create consumer group permission:', err);
    } else if (canCreate) {
      console.log('Can create consumer group');
      queueManager.createConsumerGroup('orders-queue', 'group-1');
    } else {
      console.log('Queue is locked');
    }
  },
);

// Promise pattern
try {
  const canCreate =
    await QueueOperationValidator.canCreateConsumerGroup('orders-queue');
  if (canCreate) {
    console.log('Can create consumer group');
    await queueManager.createConsumerGroup('orders-queue', 'group-1');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking create consumer group permission:', err);
}
```

#### Call Signature

> `static` **canCreateConsumerGroup**(`queue`, `cb`): `void`

Checks if a consumer group can be created for the queue.
Consumer group creation is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function that receives (error, canCreateConsumerGroup)

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canCreateConsumerGroup(
  'orders-queue',
  (err, canCreate) => {
    if (err) {
      console.error('Error checking create consumer group permission:', err);
    } else if (canCreate) {
      console.log('Can create consumer group');
      queueManager.createConsumerGroup('orders-queue', 'group-1');
    } else {
      console.log('Queue is locked');
    }
  },
);

// Promise pattern
try {
  const canCreate =
    await QueueOperationValidator.canCreateConsumerGroup('orders-queue');
  if (canCreate) {
    console.log('Can create consumer group');
    await queueManager.createConsumerGroup('orders-queue', 'group-1');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking create consumer group permission:', err);
}
```

---

### canDelete()

#### Call Signature

> `static` **canDelete**(`queue`): `Promise`\<`boolean`\>

Checks if the queue can be deleted.
Queue deletion is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canDelete('temporary-queue', (err, canDelete) => {
  if (err) {
    console.error('Error checking delete permission:', err);
  } else if (canDelete) {
    console.log('Can delete queue');
    queueManager.deleteQueue('temporary-queue');
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canDelete = await QueueOperationValidator.canDelete('temporary-queue');
  if (canDelete) {
    console.log('Can delete queue');
    await queueManager.deleteQueue('temporary-queue');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking delete permission:', err);
}
```

#### Call Signature

> `static` **canDelete**(`queue`, `cb`): `void`

Checks if the queue can be deleted.
Queue deletion is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function that receives (error, canDelete)

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canDelete('temporary-queue', (err, canDelete) => {
  if (err) {
    console.error('Error checking delete permission:', err);
  } else if (canDelete) {
    console.log('Can delete queue');
    queueManager.deleteQueue('temporary-queue');
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canDelete = await QueueOperationValidator.canDelete('temporary-queue');
  if (canDelete) {
    console.log('Can delete queue');
    await queueManager.deleteQueue('temporary-queue');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking delete permission:', err);
}
```

---

### canDeleteConsumerGroup()

#### Call Signature

> `static` **canDeleteConsumerGroup**(`queue`): `Promise`\<`boolean`\>

Checks if a consumer group can be deleted from the queue.
Consumer group deletion is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canDeleteConsumerGroup(
  'orders-queue',
  (err, canDelete) => {
    if (err) {
      console.error('Error checking delete consumer group permission:', err);
    } else if (canDelete) {
      console.log('Can delete consumer group');
      queueManager.deleteConsumerGroup('orders-queue', 'group-1');
    } else {
      console.log('Queue is locked');
    }
  },
);

// Promise pattern
try {
  const canDelete =
    await QueueOperationValidator.canDeleteConsumerGroup('orders-queue');
  if (canDelete) {
    console.log('Can delete consumer group');
    await queueManager.deleteConsumerGroup('orders-queue', 'group-1');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking delete consumer group permission:', err);
}
```

#### Call Signature

> `static` **canDeleteConsumerGroup**(`queue`, `cb`): `void`

Checks if a consumer group can be deleted from the queue.
Consumer group deletion is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function that receives (error, canDeleteConsumerGroup)

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canDeleteConsumerGroup(
  'orders-queue',
  (err, canDelete) => {
    if (err) {
      console.error('Error checking delete consumer group permission:', err);
    } else if (canDelete) {
      console.log('Can delete consumer group');
      queueManager.deleteConsumerGroup('orders-queue', 'group-1');
    } else {
      console.log('Queue is locked');
    }
  },
);

// Promise pattern
try {
  const canDelete =
    await QueueOperationValidator.canDeleteConsumerGroup('orders-queue');
  if (canDelete) {
    console.log('Can delete consumer group');
    await queueManager.deleteConsumerGroup('orders-queue', 'group-1');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking delete consumer group permission:', err);
}
```

---

### canDeleteMessage()

#### Call Signature

> `static` **canDeleteMessage**(`queue`): `Promise`\<`boolean`\>

Checks if messages can be deleted from the queue.
Message deletion is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canDeleteMessage('my-queue', (err, canDelete) => {
  if (err) {
    console.error('Error checking delete message permission:', err);
  } else if (canDelete) {
    console.log('Can delete messages');
    messageService.deleteMessage(messageId);
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canDelete = await QueueOperationValidator.canDeleteMessage('my-queue');
  if (canDelete) {
    console.log('Can delete messages');
    await messageService.deleteMessage(messageId);
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking delete message permission:', err);
}
```

#### Call Signature

> `static` **canDeleteMessage**(`queue`, `cb`): `void`

Checks if messages can be deleted from the queue.
Message deletion is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function that receives (error, canDeleteMessage)

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canDeleteMessage('my-queue', (err, canDelete) => {
  if (err) {
    console.error('Error checking delete message permission:', err);
  } else if (canDelete) {
    console.log('Can delete messages');
    messageService.deleteMessage(messageId);
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canDelete = await QueueOperationValidator.canDeleteMessage('my-queue');
  if (canDelete) {
    console.log('Can delete messages');
    await messageService.deleteMessage(messageId);
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking delete message permission:', err);
}
```

---

### canProduce()

#### Call Signature

> `static` **canProduce**(`queue`): `Promise`\<`boolean`\>

Checks if messages can be produced/published to the specified queue.
Production is allowed in ACTIVE and PAUSED states, but not in STOPPED or LOCKED states.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canProduce('notifications-queue', (err, canProduce) => {
  if (err) {
    console.error('Error checking produce permission:', err);
  } else if (canProduce) {
    console.log('Can produce to queue');
    producer.produce(message);
  } else {
    console.log('Queue is stopped or locked');
  }
});

// Promise pattern
try {
  const canProduce = await QueueOperationValidator.canProduce(
    'notifications-queue',
  );
  if (canProduce) {
    console.log('Can produce to queue');
    await producer.produce(message);
  } else {
    console.log('Queue is stopped or locked');
  }
} catch (err) {
  console.error('Error checking produce permission:', err);
}
```

#### Call Signature

> `static` **canProduce**(`queue`, `cb`): `void`

Checks if messages can be produced/published to the specified queue.
Production is allowed in ACTIVE and PAUSED states, but not in STOPPED or LOCKED states.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function that receives (error, canProduce)

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canProduce('notifications-queue', (err, canProduce) => {
  if (err) {
    console.error('Error checking produce permission:', err);
  } else if (canProduce) {
    console.log('Can produce to queue');
    producer.produce(message);
  } else {
    console.log('Queue is stopped or locked');
  }
});

// Promise pattern
try {
  const canProduce = await QueueOperationValidator.canProduce(
    'notifications-queue',
  );
  if (canProduce) {
    console.log('Can produce to queue');
    await producer.produce(message);
  } else {
    console.log('Queue is stopped or locked');
  }
} catch (err) {
  console.error('Error checking produce permission:', err);
}
```

---

### canPurge()

#### Call Signature

> `static` **canPurge**(`queue`): `Promise`\<`boolean`\>

Checks if the queue can be purged (all messages removed).
Queue purging is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canPurge('dead-letter-queue', (err, canPurge) => {
  if (err) {
    console.error('Error checking purge permission:', err);
  } else if (canPurge) {
    console.log('Can purge queue');
    queueManager.purgeQueue('dead-letter-queue');
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canPurge = await QueueOperationValidator.canPurge('dead-letter-queue');
  if (canPurge) {
    console.log('Can purge queue');
    await queueManager.purgeQueue('dead-letter-queue');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking purge permission:', err);
}
```

#### Call Signature

> `static` **canPurge**(`queue`, `cb`): `void`

Checks if the queue can be purged (all messages removed).
Queue purging is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function that receives (error, canPurge)

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canPurge('dead-letter-queue', (err, canPurge) => {
  if (err) {
    console.error('Error checking purge permission:', err);
  } else if (canPurge) {
    console.log('Can purge queue');
    queueManager.purgeQueue('dead-letter-queue');
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canPurge = await QueueOperationValidator.canPurge('dead-letter-queue');
  if (canPurge) {
    console.log('Can purge queue');
    await queueManager.purgeQueue('dead-letter-queue');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking purge permission:', err);
}
```

---

### canRequeue()

#### Call Signature

> `static` **canRequeue**(`queue`): `Promise`\<`boolean`\>

Checks if messages can be requeued for reprocessing.
Requeuing is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canRequeue(
  'failed-messages-queue',
  (err, canRequeue) => {
    if (err) {
      console.error('Error checking requeue permission:', err);
    } else if (canRequeue) {
      console.log('Can requeue messages');
      message.requeue();
    } else {
      console.log('Queue is locked');
    }
  },
);

// Promise pattern
try {
  const canRequeue = await QueueOperationValidator.canRequeue(
    'failed-messages-queue',
  );
  if (canRequeue) {
    console.log('Can requeue messages');
    await message.requeue();
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking requeue permission:', err);
}
```

#### Call Signature

> `static` **canRequeue**(`queue`, `cb`): `void`

Checks if messages can be requeued for reprocessing.
Requeuing is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function that receives (error, canRequeue)

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canRequeue(
  'failed-messages-queue',
  (err, canRequeue) => {
    if (err) {
      console.error('Error checking requeue permission:', err);
    } else if (canRequeue) {
      console.log('Can requeue messages');
      message.requeue();
    } else {
      console.log('Queue is locked');
    }
  },
);

// Promise pattern
try {
  const canRequeue = await QueueOperationValidator.canRequeue(
    'failed-messages-queue',
  );
  if (canRequeue) {
    console.log('Can requeue messages');
    await message.requeue();
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking requeue permission:', err);
}
```

---

### canSetRateLimit()

#### Call Signature

> `static` **canSetRateLimit**(`queue`): `Promise`\<`boolean`\>

Checks if a rate limit can be set on the queue.
Rate limiting configuration is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canSetRateLimit('api-queue', (err, canSet) => {
  if (err) {
    console.error('Error checking rate limit permission:', err);
  } else if (canSet) {
    console.log('Can set rate limit');
    queueManager.setRateLimit('api-queue', { limit: 100, interval: 1000 });
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canSet = await QueueOperationValidator.canSetRateLimit('api-queue');
  if (canSet) {
    console.log('Can set rate limit');
    await queueManager.setRateLimit('api-queue', {
      limit: 100,
      interval: 1000,
    });
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking rate limit permission:', err);
}
```

#### Call Signature

> `static` **canSetRateLimit**(`queue`, `cb`): `void`

Checks if a rate limit can be set on the queue.
Rate limiting configuration is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function that receives (error, canSetRateLimit)

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canSetRateLimit('api-queue', (err, canSet) => {
  if (err) {
    console.error('Error checking rate limit permission:', err);
  } else if (canSet) {
    console.log('Can set rate limit');
    queueManager.setRateLimit('api-queue', { limit: 100, interval: 1000 });
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canSet = await QueueOperationValidator.canSetRateLimit('api-queue');
  if (canSet) {
    console.log('Can set rate limit');
    await queueManager.setRateLimit('api-queue', {
      limit: 100,
      interval: 1000,
    });
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking rate limit permission:', err);
}
```

---

### canUnbindExchange()

#### Call Signature

> `static` **canUnbindExchange**(`queue`): `Promise`\<`boolean`\>

Checks if an exchange can be unbound from the queue.
Exchange unbinding is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canUnbindExchange('my-queue', (err, canUnbind) => {
  if (err) {
    console.error('Error checking unbind exchange permission:', err);
  } else if (canUnbind) {
    console.log('Can unbind exchange');
    exchangeManager.unbind('my-exchange', 'my-queue', 'routing-key');
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canUnbind = await QueueOperationValidator.canUnbindExchange('my-queue');
  if (canUnbind) {
    console.log('Can unbind exchange');
    await exchangeManager.unbind('my-exchange', 'my-queue', 'routing-key');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking unbind exchange permission:', err);
}
```

#### Call Signature

> `static` **canUnbindExchange**(`queue`, `cb`): `void`

Checks if an exchange can be unbound from the queue.
Exchange unbinding is allowed in all states except LOCKED.

##### Parameters

###### queue

Queue identifier (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function that receives (error, canUnbindExchange)

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
QueueOperationValidator.canUnbindExchange('my-queue', (err, canUnbind) => {
  if (err) {
    console.error('Error checking unbind exchange permission:', err);
  } else if (canUnbind) {
    console.log('Can unbind exchange');
    exchangeManager.unbind('my-exchange', 'my-queue', 'routing-key');
  } else {
    console.log('Queue is locked');
  }
});

// Promise pattern
try {
  const canUnbind = await QueueOperationValidator.canUnbindExchange('my-queue');
  if (canUnbind) {
    console.log('Can unbind exchange');
    await exchangeManager.unbind('my-exchange', 'my-queue', 'routing-key');
  } else {
    console.log('Queue is locked');
  }
} catch (err) {
  console.error('Error checking unbind exchange permission:', err);
}
```

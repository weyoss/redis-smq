[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ExchangeDirect

# Class: ExchangeDirect

Direct Exchange implementation for RedisSMQ.

A direct exchange routes messages to queues based on exact routing key matches.
Messages published with a specific routing key are delivered only to queues
bound to that exact routing key. This provides precise message routing control
and is ideal for point-to-point messaging patterns.

Key Features:

- Exact routing key matching for precise message delivery
- Multiple queues can be bound to the same routing key
- Atomic binding and unbinding operations with Redis transactions
- Concurrent modification detection using Redis WATCH
- Namespace isolation for multi-tenant applications
- Automatic cleanup of empty routing keys and reverse indexes
- Comprehensive validation and error handling

## Example

```typescript
const directExchange = new ExchangeDirect();

// Callback pattern
directExchange.bindQueue(
  'order-processor',
  'order-events',
  'order.created',
  (err) => {
    if (err) console.error('Failed to bind:', err);
    else console.log('Queue bound');
  },
);

// Promise pattern
await directExchange.bindQueue(
  'order-processor',
  'order-events',
  'order.created',
);
console.log('Queue bound');
```

## Constructors

### Constructor

> **new ExchangeDirect**(): `ExchangeDirect`

#### Returns

`ExchangeDirect`

## Methods

### bindQueue()

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `routingKey`): `Promise`\<`void`\>

Binds a queue to a direct exchange with a specific routing key.

This method creates a binding between a queue and a direct exchange for a specific
routing key. Messages published to the exchange with this routing key will be
delivered to the bound queue.

##### Parameters

###### queue

The queue to bind (string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

The exchange to bind to (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

The routing key for message routing

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided

##### Throws

InvalidQueueParametersError

##### Throws

InvalidExchangeParametersError

##### Throws

QueueNotFoundError

##### Throws

ExchangeNotFoundError

##### Throws

NamespaceMismatchError

##### Example

```typescript
// Callback pattern
directExchange.bindQueue(
  'order-processor',
  'order-events',
  'order.created',
  (err) => {
    if (err) {
      console.error('Failed to bind:', err);
    } else {
      console.log('Queue bound successfully');
    }
  },
);

// Promise pattern
try {
  await directExchange.bindQueue(
    'order-processor',
    'order-events',
    'order.created',
  );
  console.log('Queue bound successfully');
} catch (err) {
  console.error('Failed to bind:', err);
}
```

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `routingKey`, `cb`): `void`

Binds a queue to a direct exchange with a specific routing key.

This method creates a binding between a queue and a direct exchange for a specific
routing key. Messages published to the exchange with this routing key will be
delivered to the bound queue.

##### Parameters

###### queue

The queue to bind (string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

The exchange to bind to (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

The routing key for message routing

###### cb

`ICallback`

Optional callback invoked when binding completes

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

InvalidQueueParametersError

##### Throws

InvalidExchangeParametersError

##### Throws

QueueNotFoundError

##### Throws

ExchangeNotFoundError

##### Throws

NamespaceMismatchError

##### Example

```typescript
// Callback pattern
directExchange.bindQueue(
  'order-processor',
  'order-events',
  'order.created',
  (err) => {
    if (err) {
      console.error('Failed to bind:', err);
    } else {
      console.log('Queue bound successfully');
    }
  },
);

// Promise pattern
try {
  await directExchange.bindQueue(
    'order-processor',
    'order-events',
    'order.created',
  );
  console.log('Queue bound successfully');
} catch (err) {
  console.error('Failed to bind:', err);
}
```

---

### create()

#### Call Signature

> **create**(`exchange`, `queuePolicy`): `Promise`\<`void`\>

Creates a direct exchange.

##### Parameters

###### exchange

The exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### queuePolicy

[`EExchangeQueuePolicy`](../enumerations/EExchangeQueuePolicy.md)

The queue policy for this exchange (STANDARD or PRIORITY)

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
directExchange.create('order-events', EExchangeQueuePolicy.STANDARD, (err) => {
  if (err) console.error('Failed to create exchange:', err);
  else console.log('Exchange created');
});

// Promise pattern
try {
  await directExchange.create('order-events', EExchangeQueuePolicy.STANDARD);
  console.log('Exchange created');
} catch (err) {
  console.error('Failed to create exchange:', err);
}
```

#### Call Signature

> **create**(`exchange`, `queuePolicy`, `cb`): `void`

Creates a direct exchange.

##### Parameters

###### exchange

The exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### queuePolicy

[`EExchangeQueuePolicy`](../enumerations/EExchangeQueuePolicy.md)

The queue policy for this exchange (STANDARD or PRIORITY)

###### cb

`ICallback`

Optional callback invoked when creation completes

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
directExchange.create('order-events', EExchangeQueuePolicy.STANDARD, (err) => {
  if (err) console.error('Failed to create exchange:', err);
  else console.log('Exchange created');
});

// Promise pattern
try {
  await directExchange.create('order-events', EExchangeQueuePolicy.STANDARD);
  console.log('Exchange created');
} catch (err) {
  console.error('Failed to create exchange:', err);
}
```

---

### delete()

#### Call Signature

> **delete**(`exchange`): `Promise`\<`void`\>

Deletes a direct exchange from the system.

This method performs a comprehensive and safe deletion of a direct exchange with
extensive validation and cleanup. The deletion process ensures data integrity
and prevents orphaned data structures in Redis.

##### Parameters

###### exchange

The exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Throws

ExchangeHasBoundQueuesError

##### Throws

ExchangeNotFoundError

##### Example

```typescript
// Callback pattern
directExchange.delete('old-order-events', (err) => {
  if (err) {
    console.error('Failed to delete exchange:', err);
  } else {
    console.log('Exchange deleted successfully');
  }
});

// Promise pattern
try {
  await directExchange.delete('old-order-events');
  console.log('Exchange deleted successfully');
} catch (err) {
  console.error('Failed to delete exchange:', err);
}
```

#### Call Signature

> **delete**(`exchange`, `cb`): `void`

Deletes a direct exchange from the system.

This method performs a comprehensive and safe deletion of a direct exchange with
extensive validation and cleanup. The deletion process ensures data integrity
and prevents orphaned data structures in Redis.

##### Parameters

###### exchange

The exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`

Optional callback invoked when deletion completes

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Throws

ExchangeHasBoundQueuesError

##### Throws

ExchangeNotFoundError

##### Example

```typescript
// Callback pattern
directExchange.delete('old-order-events', (err) => {
  if (err) {
    console.error('Failed to delete exchange:', err);
  } else {
    console.log('Exchange deleted successfully');
  }
});

// Promise pattern
try {
  await directExchange.delete('old-order-events');
  console.log('Exchange deleted successfully');
} catch (err) {
  console.error('Failed to delete exchange:', err);
}
```

---

### getBindings()

#### Call Signature

> **getBindings**(`exchange`): `Promise`\<`Record`\<`string`, [`IQueueParams`](../interfaces/IQueueParams.md)[]\>\>

Retrieves all bindings for a direct exchange.

This method returns a complete mapping of routing keys to the queues bound to them.

##### Parameters

###### exchange

The exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<`Record`\<`string`, [`IQueueParams`](../interfaces/IQueueParams.md)[]\>\>

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
directExchange.getBindings('order-events', (err, bindings) => {
  if (err) {
    console.error('Failed to get bindings:', err);
  } else {
    console.log('Bindings:', bindings);
    for (const [key, queues] of Object.entries(bindings)) {
      console.log(`Routing key "${key}": ${queues.length} queues`);
    }
  }
});

// Promise pattern
try {
  const bindings = await directExchange.getBindings('order-events');
  for (const [key, queues] of Object.entries(bindings)) {
    console.log(`Routing key "${key}": ${queues.length} queues`);
  }
} catch (err) {
  console.error('Failed to get bindings:', err);
}
```

#### Call Signature

> **getBindings**(`exchange`, `cb`): `void`

Retrieves all bindings for a direct exchange.

This method returns a complete mapping of routing keys to the queues bound to them.

##### Parameters

###### exchange

The exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`\<`Record`\<`string`, [`IQueueParams`](../interfaces/IQueueParams.md)[]\>\>

Optional callback invoked with the bindings mapping

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
directExchange.getBindings('order-events', (err, bindings) => {
  if (err) {
    console.error('Failed to get bindings:', err);
  } else {
    console.log('Bindings:', bindings);
    for (const [key, queues] of Object.entries(bindings)) {
      console.log(`Routing key "${key}": ${queues.length} queues`);
    }
  }
});

// Promise pattern
try {
  const bindings = await directExchange.getBindings('order-events');
  for (const [key, queues] of Object.entries(bindings)) {
    console.log(`Routing key "${key}": ${queues.length} queues`);
  }
} catch (err) {
  console.error('Failed to get bindings:', err);
}
```

---

### getRoutingKeyBoundQueues()

#### Call Signature

> **getRoutingKeyBoundQueues**(`exchange`, `routingKey`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Retrieves all queues bound to a specific routing key for a direct exchange.

##### Parameters

###### exchange

Exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key to resolve

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Throws

InvalidDirectExchangeParametersError

##### Example

```typescript
// Callback pattern
directExchange.getRoutingKeyBoundQueues(
  'order-events',
  'order.created',
  (err, queues) => {
    if (err) {
      console.error('Failed to get bound queues:', err);
    } else {
      console.log('Bound queues:', queues);
    }
  },
);

// Promise pattern
try {
  const queues = await directExchange.getRoutingKeyBoundQueues(
    'order-events',
    'order.created',
  );
  console.log('Bound queues:', queues);
} catch (err) {
  console.error('Failed to get bound queues:', err);
}
```

#### Call Signature

> **getRoutingKeyBoundQueues**(`exchange`, `routingKey`, `cb`): `void`

Retrieves all queues bound to a specific routing key for a direct exchange.

##### Parameters

###### exchange

Exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key to resolve

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Optional callback invoked with the list of bound queues

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Throws

InvalidDirectExchangeParametersError

##### Example

```typescript
// Callback pattern
directExchange.getRoutingKeyBoundQueues(
  'order-events',
  'order.created',
  (err, queues) => {
    if (err) {
      console.error('Failed to get bound queues:', err);
    } else {
      console.log('Bound queues:', queues);
    }
  },
);

// Promise pattern
try {
  const queues = await directExchange.getRoutingKeyBoundQueues(
    'order-events',
    'order.created',
  );
  console.log('Bound queues:', queues);
} catch (err) {
  console.error('Failed to get bound queues:', err);
}
```

---

### getRoutingKeys()

#### Call Signature

> **getRoutingKeys**(`exchange`): `Promise`\<`string`[]\>

Retrieve all routing keys currently bound to a direct exchange.

##### Parameters

###### exchange

Exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<`string`[]\>

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
directExchange.getRoutingKeys('order-events', (err, keys) => {
  if (err) {
    console.error('Failed to get routing keys:', err);
  } else {
    console.log('Routing keys:', keys);
  }
});

// Promise pattern
try {
  const keys = await directExchange.getRoutingKeys('order-events');
  console.log('Routing keys:', keys);
} catch (err) {
  console.error('Failed to get routing keys:', err);
}
```

#### Call Signature

> **getRoutingKeys**(`exchange`, `cb`): `void`

Retrieve all routing keys currently bound to a direct exchange.

##### Parameters

###### exchange

Exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`\<`string`[]\>

Optional callback invoked with the list of routing keys

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
directExchange.getRoutingKeys('order-events', (err, keys) => {
  if (err) {
    console.error('Failed to get routing keys:', err);
  } else {
    console.log('Routing keys:', keys);
  }
});

// Promise pattern
try {
  const keys = await directExchange.getRoutingKeys('order-events');
  console.log('Routing keys:', keys);
} catch (err) {
  console.error('Failed to get routing keys:', err);
}
```

---

### matchQueues()

#### Call Signature

> **matchQueues**(`exchange`, `routingKey`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Retrieves all queues bound to the specified routing key in a direct exchange.

This method performs an exact match lookup for the given routing key and returns
all queues that are bound to it. In direct exchanges, only queues with exact
routing key matches will receive messages.

##### Parameters

###### exchange

The exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

The routing key to match against

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Throws

InvalidExchangeRoutingKeyError

##### Throws

ExchangeNotFoundError

##### Throws

ExchangeTypeMismatchError

##### Example

```typescript
// Callback pattern
directExchange.matchQueues('order-events', 'order.created', (err, queues) => {
  if (err) {
    console.error('Failed to match queues:', err);
  } else {
    console.log(`Found ${queues.length} queues`);
  }
});

// Promise pattern
try {
  const queues = await directExchange.matchQueues(
    'order-events',
    'order.created',
  );
  console.log(`Found ${queues.length} queues`);
} catch (err) {
  console.error('Failed to match queues:', err);
}
```

#### Call Signature

> **matchQueues**(`exchange`, `routingKey`, `cb`): `void`

Retrieves all queues bound to the specified routing key in a direct exchange.

This method performs an exact match lookup for the given routing key and returns
all queues that are bound to it. In direct exchanges, only queues with exact
routing key matches will receive messages.

##### Parameters

###### exchange

The exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

The routing key to match against

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Optional callback invoked with the list of matching queues

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Throws

InvalidExchangeRoutingKeyError

##### Throws

ExchangeNotFoundError

##### Throws

ExchangeTypeMismatchError

##### Example

```typescript
// Callback pattern
directExchange.matchQueues('order-events', 'order.created', (err, queues) => {
  if (err) {
    console.error('Failed to match queues:', err);
  } else {
    console.log(`Found ${queues.length} queues`);
  }
});

// Promise pattern
try {
  const queues = await directExchange.matchQueues(
    'order-events',
    'order.created',
  );
  console.log(`Found ${queues.length} queues`);
} catch (err) {
  console.error('Failed to match queues:', err);
}
```

---

### unbindQueue()

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `routingKey`): `Promise`\<`void`\>

Unbinds a queue from a direct exchange for a specific routing key.

This method removes the binding between a queue and a direct exchange for the
specified routing key. After unbinding, messages with this routing key will no
longer be delivered to the unbound queue.

##### Parameters

###### queue

The queue to unbind (string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

The exchange to unbind from (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

The routing key to unbind from

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided

##### Throws

InvalidQueueParametersError

##### Throws

InvalidExchangeParametersError

##### Throws

NamespaceMismatchError

##### Throws

QueueNotBoundError

##### Example

```typescript
// Callback pattern
directExchange.unbindQueue(
  'order-processor',
  'order-events',
  'order.created',
  (err) => {
    if (err) {
      console.error('Failed to unbind:', err);
    } else {
      console.log('Queue unbound successfully');
    }
  },
);

// Promise pattern
try {
  await directExchange.unbindQueue(
    'order-processor',
    'order-events',
    'order.created',
  );
  console.log('Queue unbound successfully');
} catch (err) {
  console.error('Failed to unbind:', err);
}
```

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `routingKey`, `cb`): `void`

Unbinds a queue from a direct exchange for a specific routing key.

This method removes the binding between a queue and a direct exchange for the
specified routing key. After unbinding, messages with this routing key will no
longer be delivered to the unbound queue.

##### Parameters

###### queue

The queue to unbind (string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

The exchange to unbind from (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

The routing key to unbind from

###### cb

`ICallback`

Optional callback invoked when unbinding completes

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

InvalidQueueParametersError

##### Throws

InvalidExchangeParametersError

##### Throws

NamespaceMismatchError

##### Throws

QueueNotBoundError

##### Example

```typescript
// Callback pattern
directExchange.unbindQueue(
  'order-processor',
  'order-events',
  'order.created',
  (err) => {
    if (err) {
      console.error('Failed to unbind:', err);
    } else {
      console.log('Queue unbound successfully');
    }
  },
);

// Promise pattern
try {
  await directExchange.unbindQueue(
    'order-processor',
    'order-events',
    'order.created',
  );
  console.log('Queue unbound successfully');
} catch (err) {
  console.error('Failed to unbind:', err);
}
```

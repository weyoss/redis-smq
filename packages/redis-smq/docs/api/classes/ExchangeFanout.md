[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ExchangeFanout

# Class: ExchangeFanout

Fanout Exchange implementation for RedisSMQ.

A fanout exchange routes messages to all queues that are bound to it, ignoring routing keys.
This is useful for broadcasting messages to multiple consumers or implementing pub/sub patterns.

Features:

- Message broadcasting to all bound queues
- Atomic queue binding and unbinding operations
- Concurrent modification detection using Redis WATCH
- Namespace isolation for multi-tenant applications
- Comprehensive error handling and validation

## Example

```typescript
const fanoutExchange = new ExchangeFanout();

// Callback pattern
fanoutExchange.bindQueue('notifications', 'broadcast-exchange', (err) => {
  if (err) console.error('Failed to bind:', err);
  else console.log('Queue bound');
});

// Promise pattern
await fanoutExchange.bindQueue('notifications', 'broadcast-exchange');
console.log('Queue bound');
```

## Constructors

### Constructor

> **new ExchangeFanout**(): `ExchangeFanout`

#### Returns

`ExchangeFanout`

## Methods

### bindQueue()

#### Call Signature

> **bindQueue**(`queue`, `exchange`): `Promise`\<`void`\>

Binds a queue to a fanout exchange.

This method creates a binding between a queue and a fanout exchange, enabling
messages published to the exchange to be delivered to the bound queue.

##### Parameters

###### queue

The queue to bind (string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

The exchange to bind to (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

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
fanoutExchange.bindQueue('email-notifications', 'user-events', (err) => {
  if (err) {
    console.error('Failed to bind:', err);
  } else {
    console.log('Queue bound successfully');
  }
});

// Promise pattern
try {
  await fanoutExchange.bindQueue('email-notifications', 'user-events');
  console.log('Queue bound successfully');
} catch (err) {
  console.error('Failed to bind:', err);
}
```

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `cb`): `void`

Binds a queue to a fanout exchange.

This method creates a binding between a queue and a fanout exchange, enabling
messages published to the exchange to be delivered to the bound queue.

##### Parameters

###### queue

The queue to bind (string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

The exchange to bind to (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

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
fanoutExchange.bindQueue('email-notifications', 'user-events', (err) => {
  if (err) {
    console.error('Failed to bind:', err);
  } else {
    console.log('Queue bound successfully');
  }
});

// Promise pattern
try {
  await fanoutExchange.bindQueue('email-notifications', 'user-events');
  console.log('Queue bound successfully');
} catch (err) {
  console.error('Failed to bind:', err);
}
```

---

### create()

#### Call Signature

> **create**(`exchange`, `queuePolicy`): `Promise`\<`void`\>

Creates a fanout exchange.

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
fanoutExchange.create(
  'broadcast-exchange',
  EExchangeQueuePolicy.STANDARD,
  (err) => {
    if (err) console.error('Failed to create exchange:', err);
    else console.log('Exchange created');
  },
);

// Promise pattern
try {
  await fanoutExchange.create(
    'broadcast-exchange',
    EExchangeQueuePolicy.STANDARD,
  );
  console.log('Exchange created');
} catch (err) {
  console.error('Failed to create exchange:', err);
}
```

#### Call Signature

> **create**(`exchange`, `queuePolicy`, `cb`): `void`

Creates a fanout exchange.

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
fanoutExchange.create(
  'broadcast-exchange',
  EExchangeQueuePolicy.STANDARD,
  (err) => {
    if (err) console.error('Failed to create exchange:', err);
    else console.log('Exchange created');
  },
);

// Promise pattern
try {
  await fanoutExchange.create(
    'broadcast-exchange',
    EExchangeQueuePolicy.STANDARD,
  );
  console.log('Exchange created');
} catch (err) {
  console.error('Failed to create exchange:', err);
}
```

---

### delete()

#### Call Signature

> **delete**(`exchange`): `Promise`\<`void`\>

Deletes a fanout exchange from the system.

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
fanoutExchange.delete('old-broadcast-exchange', (err) => {
  if (err) {
    console.error('Failed to delete exchange:', err);
  } else {
    console.log('Exchange deleted successfully');
  }
});

// Promise pattern
try {
  await fanoutExchange.delete('old-broadcast-exchange');
  console.log('Exchange deleted successfully');
} catch (err) {
  console.error('Failed to delete exchange:', err);
}
```

#### Call Signature

> **delete**(`exchange`, `cb`): `void`

Deletes a fanout exchange from the system.

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
fanoutExchange.delete('old-broadcast-exchange', (err) => {
  if (err) {
    console.error('Failed to delete exchange:', err);
  } else {
    console.log('Exchange deleted successfully');
  }
});

// Promise pattern
try {
  await fanoutExchange.delete('old-broadcast-exchange');
  console.log('Exchange deleted successfully');
} catch (err) {
  console.error('Failed to delete exchange:', err);
}
```

---

### getBindings()

#### Call Signature

> **getBindings**(`exchange`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Retrieves all bound queues for a fanout exchange.

This method returns the complete list of queues bound to the fanout exchange.

##### Parameters

###### exchange

The exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
fanoutExchange.getBindings('broadcast-exchange', (err, queues) => {
  if (err) {
    console.error('Failed to get bindings:', err);
  } else {
    console.log(`Found ${queues.length} bound queues`);
  }
});

// Promise pattern
try {
  const queues = await fanoutExchange.getBindings('broadcast-exchange');
  console.log(`Found ${queues.length} bound queues`);
} catch (err) {
  console.error('Failed to get bindings:', err);
}
```

#### Call Signature

> **getBindings**(`exchange`, `cb`): `void`

Retrieves all bound queues for a fanout exchange.

This method returns the complete list of queues bound to the fanout exchange.

##### Parameters

###### exchange

The exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Optional callback invoked with the list of bound queues

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
fanoutExchange.getBindings('broadcast-exchange', (err, queues) => {
  if (err) {
    console.error('Failed to get bindings:', err);
  } else {
    console.log(`Found ${queues.length} bound queues`);
  }
});

// Promise pattern
try {
  const queues = await fanoutExchange.getBindings('broadcast-exchange');
  console.log(`Found ${queues.length} bound queues`);
} catch (err) {
  console.error('Failed to get bindings:', err);
}
```

---

### matchQueues()

#### Call Signature

> **matchQueues**(`exchange`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Retrieves all queues bound to the specified fanout exchange.

This method returns all queues that are currently bound to the fanout exchange.
In a fanout exchange, messages are delivered to all bound queues regardless
of routing keys.

##### Parameters

###### exchange

The exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
fanoutExchange.matchQueues('broadcast-exchange', (err, queues) => {
  if (err) {
    console.error('Failed to get bound queues:', err);
  } else {
    console.log(`Found ${queues.length} bound queues`);
  }
});

// Promise pattern
try {
  const queues = await fanoutExchange.matchQueues('broadcast-exchange');
  console.log(`Found ${queues.length} bound queues`);
} catch (err) {
  console.error('Failed to get bound queues:', err);
}
```

#### Call Signature

> **matchQueues**(`exchange`, `cb`): `void`

Retrieves all queues bound to the specified fanout exchange.

This method returns all queues that are currently bound to the fanout exchange.
In a fanout exchange, messages are delivered to all bound queues regardless
of routing keys.

##### Parameters

###### exchange

The exchange identifier (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Optional callback invoked with the list of bound queues

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
fanoutExchange.matchQueues('broadcast-exchange', (err, queues) => {
  if (err) {
    console.error('Failed to get bound queues:', err);
  } else {
    console.log(`Found ${queues.length} bound queues`);
  }
});

// Promise pattern
try {
  const queues = await fanoutExchange.matchQueues('broadcast-exchange');
  console.log(`Found ${queues.length} bound queues`);
} catch (err) {
  console.error('Failed to get bound queues:', err);
}
```

---

### unbindQueue()

#### Call Signature

> **unbindQueue**(`queue`, `exchange`): `Promise`\<`void`\>

Unbinds a queue from a fanout exchange.

This method removes the binding between a queue and a fanout exchange, stopping
message delivery from the exchange to the specified queue.

##### Parameters

###### queue

The queue to unbind (string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

The exchange to unbind from (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

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
fanoutExchange.unbindQueue('email-notifications', 'user-events', (err) => {
  if (err) {
    console.error('Failed to unbind:', err);
  } else {
    console.log('Queue unbound successfully');
  }
});

// Promise pattern
try {
  await fanoutExchange.unbindQueue('email-notifications', 'user-events');
  console.log('Queue unbound successfully');
} catch (err) {
  console.error('Failed to unbind:', err);
}
```

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `cb`): `void`

Unbinds a queue from a fanout exchange.

This method removes the binding between a queue and a fanout exchange, stopping
message delivery from the exchange to the specified queue.

##### Parameters

###### queue

The queue to unbind (string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

The exchange to unbind from (string name or object with ns/name)

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

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
fanoutExchange.unbindQueue('email-notifications', 'user-events', (err) => {
  if (err) {
    console.error('Failed to unbind:', err);
  } else {
    console.log('Queue unbound successfully');
  }
});

// Promise pattern
try {
  await fanoutExchange.unbindQueue('email-notifications', 'user-events');
  console.log('Queue unbound successfully');
} catch (err) {
  console.error('Failed to unbind:', err);
}
```

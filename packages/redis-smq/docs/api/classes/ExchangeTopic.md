[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ExchangeTopic

# Class: ExchangeTopic

Topic exchange operations.

This class manages binding, unbinding, matching, and deleting of topic exchanges.
A topic exchange routes messages to queues based on pattern matching between
routing keys and binding patterns using AMQP-style wildcards.

Topic Pattern Syntax:

- Tokens are separated by dots (.)
- '\*' matches exactly one token
- '#' matches zero or more tokens
- Literal tokens match exactly

## Example

```typescript
const topicExchange = new ExchangeTopic();

// Callback pattern
topicExchange.bindQueue('order-processor', 'events', 'order.#', (err) => {
  if (err) console.error('Failed to bind:', err);
  else console.log('Queue bound');
});

// Promise pattern
await topicExchange.bindQueue('order-processor', 'events', 'order.#');
console.log('Queue bound');
```

## Constructors

### Constructor

> **new ExchangeTopic**(): `ExchangeTopic`

Creates a new ExchangeTopic instance.
The logger is namespaced with the class name for consistent logging context.

#### Returns

`ExchangeTopic`

## Methods

### bindQueue()

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `routingPattern`): `Promise`\<`void`\>

Bind a queue to a topic exchange using a binding pattern.

This method creates a binding between a queue and an exchange using a topic
pattern. Messages published to the exchange with routing keys that match
the pattern will be routed to the bound queue.

Idempotency:

- If the binding already exists, the operation succeeds without changes.

##### Parameters

###### queue

Queue name or parameter object

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name or parameter object

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingPattern

`string`

Topic binding pattern (e.g., 'order.\*.created', 'user.#')

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided

##### Throws

InvalidQueueParametersError

##### Throws

InvalidExchangeParametersError

##### Throws

InvalidTopicBindingPatternError

##### Throws

QueueNotFoundError

##### Throws

ExchangeNotFoundError

##### Throws

NamespaceMismatchError

##### Example

```typescript
// Callback pattern
topicExchange.bindQueue('order-processor', 'events', 'order.#', (err) => {
  if (err) {
    console.error('Failed to bind queue:', err);
  } else {
    console.log('Queue bound successfully');
  }
});

// Promise pattern
try {
  await topicExchange.bindQueue('order-processor', 'events', 'order.#');
  console.log('Queue bound successfully');
} catch (err) {
  console.error('Failed to bind queue:', err);
}
```

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `routingPattern`, `cb`): `void`

Bind a queue to a topic exchange using a binding pattern.

This method creates a binding between a queue and an exchange using a topic
pattern. Messages published to the exchange with routing keys that match
the pattern will be routed to the bound queue.

Idempotency:

- If the binding already exists, the operation succeeds without changes.

##### Parameters

###### queue

Queue name or parameter object

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name or parameter object

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingPattern

`string`

Topic binding pattern (e.g., 'order.\*.created', 'user.#')

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

InvalidTopicBindingPatternError

##### Throws

QueueNotFoundError

##### Throws

ExchangeNotFoundError

##### Throws

NamespaceMismatchError

##### Example

```typescript
// Callback pattern
topicExchange.bindQueue('order-processor', 'events', 'order.#', (err) => {
  if (err) {
    console.error('Failed to bind queue:', err);
  } else {
    console.log('Queue bound successfully');
  }
});

// Promise pattern
try {
  await topicExchange.bindQueue('order-processor', 'events', 'order.#');
  console.log('Queue bound successfully');
} catch (err) {
  console.error('Failed to bind queue:', err);
}
```

---

### create()

#### Call Signature

> **create**(`exchange`, `queuePolicy`): `Promise`\<`void`\>

Creates a topic exchange.

##### Parameters

###### exchange

Exchange name or parameter object

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
topicExchange.create('events', EExchangeQueuePolicy.STANDARD, (err) => {
  if (err) console.error('Failed to create exchange:', err);
  else console.log('Exchange created');
});

// Promise pattern
try {
  await topicExchange.create('events', EExchangeQueuePolicy.STANDARD);
  console.log('Exchange created');
} catch (err) {
  console.error('Failed to create exchange:', err);
}
```

#### Call Signature

> **create**(`exchange`, `queuePolicy`, `cb`): `void`

Creates a topic exchange.

##### Parameters

###### exchange

Exchange name or parameter object

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
topicExchange.create('events', EExchangeQueuePolicy.STANDARD, (err) => {
  if (err) console.error('Failed to create exchange:', err);
  else console.log('Exchange created');
});

// Promise pattern
try {
  await topicExchange.create('events', EExchangeQueuePolicy.STANDARD);
  console.log('Exchange created');
} catch (err) {
  console.error('Failed to create exchange:', err);
}
```

---

### delete()

#### Call Signature

> **delete**(`exchange`): `Promise`\<`void`\>

Delete a topic exchange.

This method removes a topic exchange and all its associated data structures.
The operation is atomic and ensures data consistency across all related Redis keys.

##### Parameters

###### exchange

Exchange name or parameter object

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
topicExchange.delete('events', (err) => {
  if (err) {
    console.error('Failed to delete exchange:', err);
  } else {
    console.log('Exchange deleted successfully');
  }
});

// Promise pattern
try {
  await topicExchange.delete('events');
  console.log('Exchange deleted successfully');
} catch (err) {
  console.error('Failed to delete exchange:', err);
}
```

#### Call Signature

> **delete**(`exchange`, `cb`): `void`

Delete a topic exchange.

This method removes a topic exchange and all its associated data structures.
The operation is atomic and ensures data consistency across all related Redis keys.

##### Parameters

###### exchange

Exchange name or parameter object

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
topicExchange.delete('events', (err) => {
  if (err) {
    console.error('Failed to delete exchange:', err);
  } else {
    console.log('Exchange deleted successfully');
  }
});

// Promise pattern
try {
  await topicExchange.delete('events');
  console.log('Exchange deleted successfully');
} catch (err) {
  console.error('Failed to delete exchange:', err);
}
```

---

### getBindings()

#### Call Signature

> **getBindings**(`exchange`): `Promise`\<`Record`\<`string`, [`IQueueParams`](../interfaces/IQueueParams.md)[]\>\>

Retrieves all bindings for a topic exchange.

This method returns a complete mapping of routing patterns to the queues bound to them.

##### Parameters

###### exchange

Exchange name or parameter object

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<`Record`\<`string`, [`IQueueParams`](../interfaces/IQueueParams.md)[]\>\>

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
topicExchange.getBindings('notifications', (err, bindings) => {
  if (err) {
    console.error('Failed to get bindings:', err);
  } else {
    for (const [pattern, queues] of Object.entries(bindings)) {
      console.log(`Pattern "${pattern}": ${queues.length} queues`);
    }
  }
});

// Promise pattern
try {
  const bindings = await topicExchange.getBindings('notifications');
  for (const [pattern, queues] of Object.entries(bindings)) {
    console.log(`Pattern "${pattern}": ${queues.length} queues`);
  }
} catch (err) {
  console.error('Failed to get bindings:', err);
}
```

#### Call Signature

> **getBindings**(`exchange`, `cb`): `void`

Retrieves all bindings for a topic exchange.

This method returns a complete mapping of routing patterns to the queues bound to them.

##### Parameters

###### exchange

Exchange name or parameter object

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
topicExchange.getBindings('notifications', (err, bindings) => {
  if (err) {
    console.error('Failed to get bindings:', err);
  } else {
    for (const [pattern, queues] of Object.entries(bindings)) {
      console.log(`Pattern "${pattern}": ${queues.length} queues`);
    }
  }
});

// Promise pattern
try {
  const bindings = await topicExchange.getBindings('notifications');
  for (const [pattern, queues] of Object.entries(bindings)) {
    console.log(`Pattern "${pattern}": ${queues.length} queues`);
  }
} catch (err) {
  console.error('Failed to get bindings:', err);
}
```

---

### getRoutingPatternBoundQueues()

#### Call Signature

> **getRoutingPatternBoundQueues**(`exchange`, `bindingPattern`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Retrieve all queues bound to a specific routing pattern within a topic exchange.

This method returns all queues that are bound to the exchange using the
specified routing pattern.

##### Parameters

###### exchange

Exchange name or parameter object

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### bindingPattern

`string`

The binding pattern to query (e.g., 'order.\*.created')

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
topicExchange.getRoutingPatternBoundQueues(
  'notifications',
  'user.#',
  (err, queues) => {
    if (err) {
      console.error('Failed to get pattern queues:', err);
    } else {
      console.log(`Found ${queues.length} queues for pattern 'user.#'`);
    }
  },
);

// Promise pattern
try {
  const queues = await topicExchange.getRoutingPatternBoundQueues(
    'notifications',
    'user.#',
  );
  console.log(`Found ${queues.length} queues for pattern 'user.#'`);
} catch (err) {
  console.error('Failed to get pattern queues:', err);
}
```

#### Call Signature

> **getRoutingPatternBoundQueues**(`exchange`, `bindingPattern`, `cb`): `void`

Retrieve all queues bound to a specific routing pattern within a topic exchange.

This method returns all queues that are bound to the exchange using the
specified routing pattern.

##### Parameters

###### exchange

Exchange name or parameter object

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### bindingPattern

`string`

The binding pattern to query (e.g., 'order.\*.created')

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Optional callback invoked with an array of queues bound to the pattern

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
topicExchange.getRoutingPatternBoundQueues(
  'notifications',
  'user.#',
  (err, queues) => {
    if (err) {
      console.error('Failed to get pattern queues:', err);
    } else {
      console.log(`Found ${queues.length} queues for pattern 'user.#'`);
    }
  },
);

// Promise pattern
try {
  const queues = await topicExchange.getRoutingPatternBoundQueues(
    'notifications',
    'user.#',
  );
  console.log(`Found ${queues.length} queues for pattern 'user.#'`);
} catch (err) {
  console.error('Failed to get pattern queues:', err);
}
```

---

### getRoutingPatterns()

#### Call Signature

> **getRoutingPatterns**(`exchange`): `Promise`\<`string`[]\>

Retrieve all routing patterns registered for a topic exchange.

This method returns all patterns that have been used to bind queues to the
exchange. Each pattern represents a different routing rule that can match
incoming routing keys.

##### Parameters

###### exchange

Exchange name or parameter object

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<`string`[]\>

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
topicExchange.getRoutingPatterns('notifications', (err, patterns) => {
  if (err) {
    console.error('Failed to get patterns:', err);
  } else {
    console.log('Routing patterns:', patterns);
  }
});

// Promise pattern
try {
  const patterns = await topicExchange.getRoutingPatterns('notifications');
  console.log('Routing patterns:', patterns);
} catch (err) {
  console.error('Failed to get patterns:', err);
}
```

#### Call Signature

> **getRoutingPatterns**(`exchange`, `cb`): `void`

Retrieve all routing patterns registered for a topic exchange.

This method returns all patterns that have been used to bind queues to the
exchange. Each pattern represents a different routing rule that can match
incoming routing keys.

##### Parameters

###### exchange

Exchange name or parameter object

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`\<`string`[]\>

Optional callback invoked with an array of binding patterns

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Example

```typescript
// Callback pattern
topicExchange.getRoutingPatterns('notifications', (err, patterns) => {
  if (err) {
    console.error('Failed to get patterns:', err);
  } else {
    console.log('Routing patterns:', patterns);
  }
});

// Promise pattern
try {
  const patterns = await topicExchange.getRoutingPatterns('notifications');
  console.log('Routing patterns:', patterns);
} catch (err) {
  console.error('Failed to get patterns:', err);
}
```

---

### matchQueues()

#### Call Signature

> **matchQueues**(`exchange`, `routingKey`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Resolve queues bound to a topic exchange for a given routing key.

This method performs pattern matching between the routing key and all binding
patterns registered for the exchange. Queues bound to matching patterns are
returned, with duplicates removed (a queue may match multiple patterns).

Pattern Matching Rules:

- 'order.\*' matches 'order.created', 'order.updated', but not 'order.item.created'
- 'order.#' matches 'order.created', 'order.item.created', 'order.item.variant.updated'
- 'order.\*.created' matches 'order.premium.created', but not 'order.created'

##### Parameters

###### exchange

Exchange name or parameter object

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key to match against binding patterns

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Throws

InvalidExchangeRoutingKeyError

##### Example

```typescript
// Callback pattern
topicExchange.matchQueues(
  'notifications',
  'user.premium.signup',
  (err, queues) => {
    if (err) {
      console.error('Failed to match queues:', err);
    } else {
      console.log(`Found ${queues.length} matching queues`);
    }
  },
);

// Promise pattern
try {
  const queues = await topicExchange.matchQueues(
    'notifications',
    'user.premium.signup',
  );
  console.log(`Found ${queues.length} matching queues`);
} catch (err) {
  console.error('Failed to match queues:', err);
}
```

#### Call Signature

> **matchQueues**(`exchange`, `routingKey`, `cb`): `void`

Resolve queues bound to a topic exchange for a given routing key.

This method performs pattern matching between the routing key and all binding
patterns registered for the exchange. Queues bound to matching patterns are
returned, with duplicates removed (a queue may match multiple patterns).

Pattern Matching Rules:

- 'order.\*' matches 'order.created', 'order.updated', but not 'order.item.created'
- 'order.#' matches 'order.created', 'order.item.created', 'order.item.variant.updated'
- 'order.\*.created' matches 'order.premium.created', but not 'order.created'

##### Parameters

###### exchange

Exchange name or parameter object

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key to match against binding patterns

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Optional callback invoked with an array of matching queues

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

InvalidExchangeParametersError

##### Throws

InvalidExchangeRoutingKeyError

##### Example

```typescript
// Callback pattern
topicExchange.matchQueues(
  'notifications',
  'user.premium.signup',
  (err, queues) => {
    if (err) {
      console.error('Failed to match queues:', err);
    } else {
      console.log(`Found ${queues.length} matching queues`);
    }
  },
);

// Promise pattern
try {
  const queues = await topicExchange.matchQueues(
    'notifications',
    'user.premium.signup',
  );
  console.log(`Found ${queues.length} matching queues`);
} catch (err) {
  console.error('Failed to match queues:', err);
}
```

---

### unbindQueue()

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `routingPattern`): `Promise`\<`void`\>

Unbind a queue from a topic exchange binding pattern.

This method removes a binding between a queue and an exchange for a specific
topic pattern. After unbinding, messages matching the pattern will no longer
be routed to the queue.

##### Parameters

###### queue

Queue name or parameter object

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name or parameter object

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingPattern

`string`

Topic binding pattern to unbind

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided

##### Throws

InvalidQueueParametersError

##### Throws

InvalidExchangeParametersError

##### Throws

InvalidTopicBindingPatternError

##### Throws

NamespaceMismatchError

##### Throws

QueueNotBoundError

##### Example

```typescript
// Callback pattern
topicExchange.unbindQueue(
  'order-processor',
  'events',
  'order.cancelled',
  (err) => {
    if (err) {
      console.error('Failed to unbind queue:', err);
    } else {
      console.log('Queue unbound successfully');
    }
  },
);

// Promise pattern
try {
  await topicExchange.unbindQueue(
    'order-processor',
    'events',
    'order.cancelled',
  );
  console.log('Queue unbound successfully');
} catch (err) {
  console.error('Failed to unbind queue:', err);
}
```

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `routingPattern`, `cb`): `void`

Unbind a queue from a topic exchange binding pattern.

This method removes a binding between a queue and an exchange for a specific
topic pattern. After unbinding, messages matching the pattern will no longer
be routed to the queue.

##### Parameters

###### queue

Queue name or parameter object

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name or parameter object

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingPattern

`string`

Topic binding pattern to unbind

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

InvalidTopicBindingPatternError

##### Throws

NamespaceMismatchError

##### Throws

QueueNotBoundError

##### Example

```typescript
// Callback pattern
topicExchange.unbindQueue(
  'order-processor',
  'events',
  'order.cancelled',
  (err) => {
    if (err) {
      console.error('Failed to unbind queue:', err);
    } else {
      console.log('Queue unbound successfully');
    }
  },
);

// Promise pattern
try {
  await topicExchange.unbindQueue(
    'order-processor',
    'events',
    'order.cancelled',
  );
  console.log('Queue unbound successfully');
} catch (err) {
  console.error('Failed to unbind queue:', err);
}
```

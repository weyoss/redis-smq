[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / Exchange

# Class: Exchange

Exchange management operations.

This class provides methods for querying and retrieving exchange information
across the RedisSMQ system. It handles exchange discovery at global, namespace,
and queue-specific levels.

All methods are read-only operations that query existing exchange data from Redis.
For exchange creation, binding, and deletion operations, use the specific exchange
type classes (ExchangeDirect, ExchangeTopic, ExchangeFanout).

## Example

```typescript
const exchange = new Exchange();

// Callback pattern
exchange.getAllExchanges((err, exchanges) => {
  if (err) console.error('Failed:', err);
  else console.log('Exchanges:', exchanges.length);
});

// Promise pattern
const exchanges = await exchange.getAllExchanges();
console.log('Exchanges:', exchanges.length);
```

## Constructors

### Constructor

> **new Exchange**(): `Exchange`

Creates a new Exchange instance.
Initializes the logger with the class name for consistent logging context.

#### Returns

`Exchange`

## Methods

### getAllExchanges()

#### Call Signature

> **getAllExchanges**(`cb?`): `Promise`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Retrieve all exchanges across all namespaces in the system.

This method queries the global exchanges index and returns all registered
exchanges regardless of their namespace or type. Each exchange entry includes
its namespace, name, and type information.

##### Parameters

###### cb?

`ICallback`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Optional callback invoked with an array of all exchange parameters or an error

##### Returns

`Promise`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

- Returns a Promise if no callback is provided

##### Throws

CallbackEmptyReplyError via callback on unexpected empty Redis reply.

##### Example

```typescript
// Callback pattern
exchange.getAllExchanges((err, exchanges) => {
  if (err) {
    console.error('Failed to get exchanges:', err);
    return;
  }
  console.log(`Found ${exchanges.length} exchanges`);
  exchanges.forEach((ex) => {
    console.log(`- ${ex.name} (${ex.type}) in ${ex.ns}`);
  });
});

// Promise pattern
try {
  const exchanges = await exchange.getAllExchanges();
  console.log(`Found ${exchanges.length} exchanges`);
  exchanges.forEach((ex) => {
    console.log(`- ${ex.name} (${ex.type}) in ${ex.ns}`);
  });
} catch (err) {
  console.error('Failed to get exchanges:', err);
}
```

#### Call Signature

> **getAllExchanges**(`cb`): `void`

Retrieve all exchanges across all namespaces in the system.

This method queries the global exchanges index and returns all registered
exchanges regardless of their namespace or type. Each exchange entry includes
its namespace, name, and type information.

##### Parameters

###### cb

`ICallback`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Optional callback invoked with an array of all exchange parameters or an error

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

CallbackEmptyReplyError via callback on unexpected empty Redis reply.

##### Example

```typescript
// Callback pattern
exchange.getAllExchanges((err, exchanges) => {
  if (err) {
    console.error('Failed to get exchanges:', err);
    return;
  }
  console.log(`Found ${exchanges.length} exchanges`);
  exchanges.forEach((ex) => {
    console.log(`- ${ex.name} (${ex.type}) in ${ex.ns}`);
  });
});

// Promise pattern
try {
  const exchanges = await exchange.getAllExchanges();
  console.log(`Found ${exchanges.length} exchanges`);
  exchanges.forEach((ex) => {
    console.log(`- ${ex.name} (${ex.type}) in ${ex.ns}`);
  });
} catch (err) {
  console.error('Failed to get exchanges:', err);
}
```

---

### getNamespaceExchanges()

#### Call Signature

> **getNamespaceExchanges**(`ns`): `Promise`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Retrieve all exchanges within a specific namespace.

This method queries the namespace-specific exchanges index and returns all
exchanges registered within the given namespace. The namespace parameter
is validated to ensure it conforms to Redis key naming requirements.

##### Parameters

###### ns

`string`

The namespace to query. Must be a valid Redis key identifier.

##### Returns

`Promise`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

- Returns a Promise if no callback is provided

##### Throws

When the namespace is invalid.

##### Example

```typescript
// Callback pattern
exchange.getNamespaceExchanges('production', (err, exchanges) => {
  if (err) {
    console.error('Failed to get namespace exchanges:', err);
    return;
  }
  console.log(`Production namespace has ${exchanges.length} exchanges:`);
  exchanges.forEach((ex) => {
    console.log(`- ${ex.name} (${ex.type})`);
  });
});

// Promise pattern
try {
  const exchanges = await exchange.getNamespaceExchanges('staging');
  console.log(`Staging namespace has ${exchanges.length} exchanges`);
  exchanges.forEach((ex) => console.log(`- ${ex.name} (${ex.type})`));
} catch (err) {
  console.error('Failed to get namespace exchanges:', err);
}
```

#### Call Signature

> **getNamespaceExchanges**(`ns`, `cb`): `void`

Retrieve all exchanges within a specific namespace.

This method queries the namespace-specific exchanges index and returns all
exchanges registered within the given namespace. The namespace parameter
is validated to ensure it conforms to Redis key naming requirements.

##### Parameters

###### ns

`string`

The namespace to query. Must be a valid Redis key identifier.

###### cb

`ICallback`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Optional callback invoked with an array of exchange parameters for the namespace or an error

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

When the namespace is invalid.

##### Example

```typescript
// Callback pattern
exchange.getNamespaceExchanges('production', (err, exchanges) => {
  if (err) {
    console.error('Failed to get namespace exchanges:', err);
    return;
  }
  console.log(`Production namespace has ${exchanges.length} exchanges:`);
  exchanges.forEach((ex) => {
    console.log(`- ${ex.name} (${ex.type})`);
  });
});

// Promise pattern
try {
  const exchanges = await exchange.getNamespaceExchanges('staging');
  console.log(`Staging namespace has ${exchanges.length} exchanges`);
  exchanges.forEach((ex) => console.log(`- ${ex.name} (${ex.type})`));
} catch (err) {
  console.error('Failed to get namespace exchanges:', err);
}
```

---

### getQueueExchanges()

#### Call Signature

> **getQueueExchanges**(`queue`): `Promise`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Retrieve all exchanges that a specific queue is bound to.

This method queries the queue's reverse binding index to find all exchanges
(of any type) that the queue is currently bound to. This is useful for
understanding message routing paths and managing queue dependencies.

The queue parameter can be either a string name (using the default namespace)
or a complete IQueueParams object specifying both namespace and name.

##### Parameters

###### queue

Queue name (string) or complete queue parameters (IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

- Returns a Promise if no callback is provided

##### Throws

When the queue parameters are invalid.

##### Example

```typescript
// Callback pattern - using queue name (default namespace)
exchange.getQueueExchanges('order-processing', (err, exchanges) => {
  if (err) {
    console.error('Failed to get queue bindings:', err);
    return;
  }
  console.log(`Queue is bound to ${exchanges.length} exchanges:`);
  exchanges.forEach((ex) => {
    console.log(`- ${ex.name} (${ex.type}) in ${ex.ns}`);
  });
});

// Promise pattern - using complete queue parameters
try {
  const exchanges = await exchange.getQueueExchanges({
    name: 'notifications',
    ns: 'production',
  });
  console.log(`Queue bound to ${exchanges.length} exchanges`);
  exchanges.forEach((ex) => console.log(`- ${ex.name} (${ex.type})`));
} catch (err) {
  console.error('Failed to get queue bindings:', err);
}
```

#### Call Signature

> **getQueueExchanges**(`queue`, `cb`): `void`

Retrieve all exchanges that a specific queue is bound to.

This method queries the queue's reverse binding index to find all exchanges
(of any type) that the queue is currently bound to. This is useful for
understanding message routing paths and managing queue dependencies.

The queue parameter can be either a string name (using the default namespace)
or a complete IQueueParams object specifying both namespace and name.

##### Parameters

###### queue

Queue name (string) or complete queue parameters (IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Optional callback invoked with an array of exchange parameters the queue is bound to or an error

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

When the queue parameters are invalid.

##### Example

```typescript
// Callback pattern - using queue name (default namespace)
exchange.getQueueExchanges('order-processing', (err, exchanges) => {
  if (err) {
    console.error('Failed to get queue bindings:', err);
    return;
  }
  console.log(`Queue is bound to ${exchanges.length} exchanges:`);
  exchanges.forEach((ex) => {
    console.log(`- ${ex.name} (${ex.type}) in ${ex.ns}`);
  });
});

// Promise pattern - using complete queue parameters
try {
  const exchanges = await exchange.getQueueExchanges({
    name: 'notifications',
    ns: 'production',
  });
  console.log(`Queue bound to ${exchanges.length} exchanges`);
  exchanges.forEach((ex) => console.log(`- ${ex.name} (${ex.type})`));
} catch (err) {
  console.error('Failed to get queue bindings:', err);
}
```

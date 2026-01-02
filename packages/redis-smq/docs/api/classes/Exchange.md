[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Exchange

# Class: Exchange

Exchange management operations.

This class provides methods for querying and retrieving exchange information
across the RedisSMQ system. It handles exchange discovery at global, namespace,
and queue-specific levels.

All methods are read-only operations that query existing exchange data from Redis.
For exchange creation, binding, and deletion operations, use the specific exchange
type classes (ExchangeDirect, ExchangeTopic, ExchangeFanout).

## Constructors

### Constructor

> **new Exchange**(): `Exchange`

Creates a new Exchange instance.
Initializes the logger with the class name for consistent logging context.

#### Returns

`Exchange`

## Methods

### getAllExchanges()

> **getAllExchanges**(`cb`): `void`

Retrieve all exchanges across all namespaces in the system.

This method queries the global exchanges index and returns all registered
exchanges regardless of their namespace or type. Each exchange entry includes
its namespace, name, and type information.

#### Parameters

##### cb

`ICallback`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Callback invoked with an array of all exchange parameters or an error.

#### Returns

`void`

#### Throws

CallbackEmptyReplyError via callback on unexpected empty Redis reply.

#### Example

```typescript
exchange.getAllExchanges((err, exchanges) => {
  if (err) {
    console.error('Failed to get exchanges:', err);
    return;
  }

  console.log(`Found ${exchanges.length} exchanges:`);
  exchanges.forEach((ex) => {
    console.log(`- ${ex.name} (${ex.type}) in namespace ${ex.ns}`);
  });
});
```

---

### getNamespaceExchanges()

> **getNamespaceExchanges**(`ns`, `cb`): `void`

Retrieve all exchanges within a specific namespace.

This method queries the namespace-specific exchanges index and returns all
exchanges registered within the given namespace. The namespace parameter
is validated to ensure it conforms to Redis key naming requirements.

#### Parameters

##### ns

`string`

The namespace to query. Must be a valid Redis key identifier.

##### cb

`ICallback`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Callback invoked with an array of exchange parameters for the namespace or an error.

#### Returns

`void`

#### Throws

InvalidNamespaceError

#### Example

```typescript
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
```

---

### getQueueBoundExchanges()

> **getQueueBoundExchanges**(`queue`, `cb`): `void`

Retrieve all exchanges that a specific queue is bound to.

This method queries the queue's reverse binding index to find all exchanges
(of any type) that the queue is currently bound to. This is useful for
understanding message routing paths and managing queue dependencies.

The queue parameter can be either a string name (using the default namespace)
or a complete IQueueParams object specifying both namespace and name.

#### Parameters

##### queue

Queue name (string) or complete queue parameters (IQueueParams).

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Callback invoked with an array of exchange parameters the queue is bound to or an error.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Example

```typescript
// Using queue name (default namespace)
exchange.getQueueBoundExchanges('order-processing', (err, exchanges) => {
  if (err) {
    console.error('Failed to get queue bindings:', err);
    return;
  }

  console.log(`Queue is bound to ${exchanges.length} exchanges:`);
  exchanges.forEach((ex) => {
    console.log(`- ${ex.name} (${ex.type}) in ${ex.ns}`);
  });
});

// Using complete queue parameters
exchange.getQueueBoundExchanges(
  { name: 'notifications', ns: 'production' },
  (err, exchanges) => {
    // Handle results...
  },
);
```

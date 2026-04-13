[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / Exchange

# Class: Exchange

Provides read-only exchange discovery operations.

For exchange creation, binding, and deletion, use ExchangeDirect, ExchangeTopic, or ExchangeFanout.

## Example

```ts
const exchange = new Exchange();

// Get all exchanges
const exchanges = await exchange.getAllExchanges();

// Get exchanges in a namespace
const nsExchanges = await exchange.getNamespaceExchanges('production');
```

## Constructors

### Constructor

> **new Exchange**(): `Exchange`

#### Returns

`Exchange`

## Methods

### getAllExchanges()

#### Call Signature

> **getAllExchanges**(`cb?`): `Promise`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Gets all exchanges across all namespaces.

##### Parameters

###### cb?

`ICallback`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

(err, exchanges) => void. Returns IExchangeParsedParams[]

##### Returns

`Promise`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const exchanges = await exchange.getAllExchanges();

// Callback
exchange.getAllExchanges((err, exchanges) => {
  if (err) throw err;
  console.log(exchanges.length);
});
```

#### Call Signature

> **getAllExchanges**(`cb`): `void`

Gets all exchanges across all namespaces.

##### Parameters

###### cb

`ICallback`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

(err, exchanges) => void. Returns IExchangeParsedParams[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const exchanges = await exchange.getAllExchanges();

// Callback
exchange.getAllExchanges((err, exchanges) => {
  if (err) throw err;
  console.log(exchanges.length);
});
```

---

### getNamespaceExchanges()

#### Call Signature

> **getNamespaceExchanges**(`ns`): `Promise`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Gets all exchanges within a specific namespace.

##### Parameters

###### ns

`string`

Namespace name

##### Returns

`Promise`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const exchanges = await exchange.getNamespaceExchanges('production');

// Callback
exchange.getNamespaceExchanges('production', (err, exchanges) => {
  if (err) throw err;
  console.log(exchanges);
});
```

#### Call Signature

> **getNamespaceExchanges**(`ns`, `cb`): `void`

Gets all exchanges within a specific namespace.

##### Parameters

###### ns

`string`

Namespace name

###### cb

`ICallback`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

(err, exchanges) => void. Returns IExchangeParsedParams[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const exchanges = await exchange.getNamespaceExchanges('production');

// Callback
exchange.getNamespaceExchanges('production', (err, exchanges) => {
  if (err) throw err;
  console.log(exchanges);
});
```

---

### getQueueExchanges()

#### Call Signature

> **getQueueExchanges**(`queue`): `Promise`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Gets all exchanges that a queue is bound to.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const exchanges = await exchange.getQueueExchanges('orders');

// Callback
exchange.getQueueExchanges('orders', (err, exchanges) => {
  if (err) throw err;
  console.log(exchanges);
});
```

#### Call Signature

> **getQueueExchanges**(`queue`, `cb`): `void`

Gets all exchanges that a queue is bound to.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)[]\>

(err, exchanges) => void. Returns IExchangeParsedParams[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const exchanges = await exchange.getQueueExchanges('orders');

// Callback
exchange.getQueueExchanges('orders', (err, exchanges) => {
  if (err) throw err;
  console.log(exchanges);
});
```

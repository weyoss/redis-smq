[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / NamespaceManager

# Class: NamespaceManager

Manages message queue namespaces.

Provides methods to get namespaces, retrieve queues in a namespace,
and delete namespaces with all their queues.

## Example

```ts
const namespaceManager = new NamespaceManager();

// Get all namespaces
const namespaces = await namespaceManager.getNamespaces();

// Get queues in a namespace
const queues = await namespaceManager.getNamespaceQueues('production');
```

## Constructors

### Constructor

> **new NamespaceManager**(): `NamespaceManager`

#### Returns

`NamespaceManager`

## Methods

### delete()

#### Call Signature

> **delete**(`namespace`): `Promise`\<`void`\>

Deletes a namespace and all its queues.

##### Parameters

###### namespace

`string`

Namespace name

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await namespaceManager.delete('staging');

// Callback
namespaceManager.delete('staging', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **delete**(`namespace`, `cb`): `void`

Deletes a namespace and all its queues.

##### Parameters

###### namespace

`string`

Namespace name

###### cb

`ICallback`\<`void`\>

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await namespaceManager.delete('staging');

// Callback
namespaceManager.delete('staging', (err) => {
  if (err) throw err;
});
```

---

### getNamespaceQueues()

#### Call Signature

> **getNamespaceQueues**(`namespace`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Gets all queues in a namespace.

##### Parameters

###### namespace

`string`

Namespace name

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await namespaceManager.getNamespaceQueues('production');
queues.forEach((q) => console.log(q.name));

// Callback
namespaceManager.getNamespaceQueues('production', (err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

#### Call Signature

> **getNamespaceQueues**(`namespace`, `cb`): `void`

Gets all queues in a namespace.

##### Parameters

###### namespace

`string`

Namespace name

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

(err, queues) => void. Returns IQueueParams[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await namespaceManager.getNamespaceQueues('production');
queues.forEach((q) => console.log(q.name));

// Callback
namespaceManager.getNamespaceQueues('production', (err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

---

### getNamespaces()

#### Call Signature

> **getNamespaces**(): `Promise`\<`string`[]\>

Gets all namespaces.

##### Returns

`Promise`\<`string`[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const namespaces = await namespaceManager.getNamespaces();
console.log(namespaces);

// Callback
namespaceManager.getNamespaces((err, namespaces) => {
  if (err) throw err;
  console.log(namespaces);
});
```

#### Call Signature

> **getNamespaces**(`cb`): `void`

Gets all namespaces.

##### Parameters

###### cb

`ICallback`\<`string`[]\>

(err, namespaces) => void. Returns string[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const namespaces = await namespaceManager.getNamespaces();
console.log(namespaces);

// Callback
namespaceManager.getNamespaces((err, namespaces) => {
  if (err) throw err;
  console.log(namespaces);
});
```

[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / RunnableWorker

# Class: RunnableWorker\<InitialPayload\>

## Extends

- `Worker`\<`void`\>

## Type Parameters

### InitialPayload

`InitialPayload`

## Implements

- [`IRunnableWorker`](../interfaces/IRunnableWorker.md)

## Constructors

### Constructor

> **new RunnableWorker**\<`InitialPayload`\>(`workerFilename`, `initialPayload`, `logger`): `RunnableWorker`\<`InitialPayload`\>

#### Parameters

##### workerFilename

`string`

##### initialPayload

`InitialPayload`

##### logger

[`ILogger`](../interfaces/ILogger.md)

#### Returns

`RunnableWorker`\<`InitialPayload`\>

#### Overrides

`Worker<void>.constructor`

## Methods

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` _extends_ keyof `TWorkerEvent`

#### Parameters

##### event

`E`

##### args

...`Parameters`\<`TWorkerEvent`\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

`Worker.emit`

---

### getId()

> **getId**(): `string`

Get worker ID

#### Returns

`string`

#### Inherited from

`Worker.getId`

---

### getWorkerFilename()

> **getWorkerFilename**(): `string`

#### Returns

`string`

#### Inherited from

`Worker.getWorkerFilename`

---

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof `TWorkerEvent`

#### Parameters

##### event

`E`

##### listener

`TWorkerEvent`\[`E`\]

#### Returns

`this`

#### Inherited from

`Worker.on`

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof `TWorkerEvent`

#### Parameters

##### event

`E`

##### listener

`TWorkerEvent`\[`E`\]

#### Returns

`this`

#### Inherited from

`Worker.once`

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof `TWorkerEvent`

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Inherited from

`Worker.removeAllListeners`

---

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof `TWorkerEvent`

#### Parameters

##### event

`E`

##### listener

`TWorkerEvent`\[`E`\]

#### Returns

`this`

#### Inherited from

`Worker.removeListener`

---

### run()

> **run**(`cb`): `void`

Run the worker in fire-and-forget mode
No response expected from worker thread

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)

#### Returns

`void`

#### Implementation of

[`IRunnableWorker`](../interfaces/IRunnableWorker.md).[`run`](../interfaces/IRunnableWorker.md#run)

---

### shutdown()

> **shutdown**(`cb`): `void`

Shutdown worker with proper cleanup

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)

#### Returns

`void`

#### Implementation of

[`IRunnableWorker`](../interfaces/IRunnableWorker.md).[`shutdown`](../interfaces/IRunnableWorker.md#shutdown)

#### Overrides

`Worker.shutdown`

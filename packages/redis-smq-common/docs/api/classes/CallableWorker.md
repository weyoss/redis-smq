[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / CallableWorker

# Class: CallableWorker\<Payload, Reply\>

## Extends

- `Worker`\<`Reply`\>

## Type Parameters

### Payload

`Payload`

### Reply

`Reply`

## Implements

- [`ICallableWorker`](../interfaces/ICallableWorker.md)\<`Payload`, `Reply`\>

## Constructors

### Constructor

> **new CallableWorker**\<`Payload`, `Reply`\>(`workerFilename`, `logger`): `CallableWorker`\<`Payload`, `Reply`\>

#### Parameters

##### workerFilename

`string`

##### logger

[`ILogger`](../interfaces/ILogger.md)

#### Returns

`CallableWorker`\<`Payload`, `Reply`\>

#### Overrides

`Worker<Reply>.constructor`

## Methods

### call()

> **call**(`payload`, `cb`): `void`

#### Parameters

##### payload

`Payload`

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`Reply`\>

#### Returns

`void`

#### Implementation of

[`ICallableWorker`](../interfaces/ICallableWorker.md).[`call`](../interfaces/ICallableWorker.md#call)

---

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

### shutdown()

> **shutdown**(`cb`): `void`

Shutdown worker with proper cleanup

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)

#### Returns

`void`

#### Inherited from

`Worker.shutdown`

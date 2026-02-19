[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TWorkerClusterEvent

# Type Alias: TWorkerClusterEvent

> **TWorkerClusterEvent** = `object`

## Properties

### workerCluster.error()

> **workerCluster.error**: (`err`) => `void`

#### Parameters

##### err

`Error`

#### Returns

`void`

---

### workerCluster.workerAdded()

> **workerCluster.workerAdded**: (`worker`) => `void`

#### Parameters

##### worker

[`RunnableWorker`](../classes/RunnableWorker.md)\<`unknown`\>

#### Returns

`void`

---

### workerCluster.workerRemoved()

> **workerCluster.workerRemoved**: (`workerId`) => `void`

#### Parameters

##### workerId

`string`

#### Returns

`void`

[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IBackgroundJob

# Interface: IBackgroundJob\<Payload, Meta\>

## Type Parameters

### Payload

`Payload`

### Meta

`Meta` _extends_ `Record`\<`string`, `unknown`\> = `never`

## Properties

### batchSize?

> `optional` **batchSize**: `number`

---

### completedAt?

> `optional` **completedAt**: `number`

---

### createdAt

> **createdAt**: `number`

---

### delay?

> `optional` **delay**: `number`

---

### error?

> `optional` **error**: `string`

---

### id

> **id**: `string`

---

### meta?

> `optional` **meta**: `Meta`

---

### payload

> **payload**: `Payload`

---

### startedAt?

> `optional` **startedAt**: `number`

---

### status

> **status**: [`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)

---

### updatedAt?

> `optional` **updatedAt**: `number`

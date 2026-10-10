[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IPurgeQueueJob

# Interface: IPurgeQueueJob

A background job that deletes messages from a queue category.

Returned by `IQueueMessages.getPurgeJob()` and referenced by
`getPurgeJobStatus()`. The job runs asynchronously: `IQueueMessages.purge()`
returns its ID immediately; the actual deletion happens on a
background worker over the following seconds or minutes, depending on
queue size.

The `meta.purged` counter is updated as batches complete, so a caller
polling the job can display progress without needing any other
information.

## Properties

### completedAt?

> `optional` **completedAt?**: `number`

When the job reached a terminal state, in milliseconds since the epoch.

---

### createdAt

> **createdAt**: `number`

Milliseconds since the Unix epoch, when the job was created.

---

### error?

> `optional` **error?**: `string`

Error message if the job failed. Absent on success and in-flight jobs.

---

### id

> **id**: `string`

Unique job ID.

---

### meta

> **meta**: `object`

Progress metadata.

#### purged

> **purged**: `number`

Number of messages deleted so far.

---

### startedAt?

> `optional` **startedAt?**: `number`

When the job started running, in milliseconds since the epoch.

---

### status

> **status**: [`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)

Current job status.

---

### updatedAt?

> `optional` **updatedAt?**: `number`

Last time the job's status changed, in milliseconds since the epoch.

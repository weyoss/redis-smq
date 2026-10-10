[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageManagerDeleteResponse

# Interface: IMessageManagerDeleteResponse

Error information from a batch delete operation.

Returned by `deleteMessagesByIds` and `deleteMessageById`. The
`status` field summarizes the overall outcome; the `stats` object
gives the per-message counts that produced the summary.

The status is derived from the counts:

- `OK`: every requested message was deleted.
- `PARTIAL_SUCCESS`: at least one message was deleted, but at least
  one was not (typically because it was not found, or was in a
  state that prevents deletion).
- `MESSAGE_NOT_DELETED`: no message was deleted.

Callers who need to know exactly which messages failed should delete
messages one at a time and inspect the error for each call, rather
than relying on the batch response.

## Properties

### stats

> **stats**: `object`

#### inProcess

> **inProcess**: `number`

Number of messages skipped because they were in the PROCESSING state.

#### notFound

> **notFound**: `number`

Number of messages that were not found.

#### processed

> **processed**: `number`

Total number of messages processed (deleted or not).

#### success

> **success**: `number`

Number of messages successfully deleted.

---

### status

> **status**: [`TMessageManagerDeleteStatus`](../type-aliases/TMessageManagerDeleteStatus.md)

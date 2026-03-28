[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageUnacknowledgementRecord

# Interface: IMessageUnacknowledgementRecord

## Properties

### action

> **action**: [`EMessageUnacknowledgementAction`](../enumerations/EMessageUnacknowledgementAction.md)

---

### cause

> **cause**: [`EMessageUnacknowledgementCause`](../enumerations/EMessageUnacknowledgementCause.md)

---

### consumerId

> **consumerId**: `string`

---

### deadLetterCause?

> `optional` **deadLetterCause**: [`EMessageDeadLetterCause`](../enumerations/EMessageDeadLetterCause.md)

---

### messageId

> **messageId**: `string`

---

### queue

> **queue**: [`IQueueParsedParams`](IQueueParsedParams.md)

---

### retryCount

> **retryCount**: `number`

---

### timestamp

> **timestamp**: `number`

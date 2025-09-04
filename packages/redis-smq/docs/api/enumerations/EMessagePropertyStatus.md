[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EMessagePropertyStatus

# Enumeration: EMessagePropertyStatus

## Enumeration Members

### ACKNOWLEDGED

> **ACKNOWLEDGED**: `4`

Message has been successfully consumed and acknowledged.

***

### DEAD\_LETTERED

> **DEAD\_LETTERED**: `7`

Message has failed processing and has been moved to the dead-letter queue.

***

### NEW

> **NEW**: `0`

Message has been created but not yet published to the queue.
This is the default state of a message before it enters the message queue.

***

### PENDING

> **PENDING**: `1`

Message is waiting to be consumed.

***

### PROCESSING

> **PROCESSING**: `2`

Message is being processed by a consumer.

***

### SCHEDULED

> **SCHEDULED**: `3`

Message is scheduled to be delivered at a later time.

***

### UNACK\_DELAYING

> **UNACK\_DELAYING**: `6`

Message has been unacknowledged and is waiting in the delayed queue for a scheduled retry.

***

### UNACK\_REQUEUING

> **UNACK\_REQUEUING**: `5`

Message has been unacknowledged and is waiting in the requeue list to be moved back to the pending queue.

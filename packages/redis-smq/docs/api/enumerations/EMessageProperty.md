[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EMessageProperty

# Enumeration: EMessageProperty

The integer values are used as hash field names in Redis for memory efficiency.
Assigning explicit values prevents accidental reordering from breaking data compatibility.

## Enumeration Members

### ACKNOWLEDGED\_AT

> **ACKNOWLEDGED\_AT**: `7`

***

### ATTEMPTS

> **ATTEMPTS**: `16`

***

### DEAD\_LETTERED\_AT

> **DEAD\_LETTERED\_AT**: `6`

***

### EFFECTIVE\_SCHEDULED\_DELAY

> **EFFECTIVE\_SCHEDULED\_DELAY**: `19`

***

### EXPIRED

> **EXPIRED**: `18`

***

### ID

> **ID**: `0`

***

### LAST\_REQUEUED\_AT

> **LAST\_REQUEUED\_AT**: `13`

A timestamp that is updated each time a message is manually requeued.

***

### LAST\_RETRIED\_ATTEMPT\_AT

> **LAST\_RETRIED\_ATTEMPT\_AT**: `14`

A timestamp that is set only when a message is automatically
retried after a processing failure (e.g., from an unacknowledged message).

***

### LAST\_SCHEDULED\_AT

> **LAST\_SCHEDULED\_AT**: `10`

***

### LAST\_UNACKNOWLEDGED\_AT

> **LAST\_UNACKNOWLEDGED\_AT**: `9`

***

### MESSAGE

> **MESSAGE**: `2`

***

### PROCESSING\_STARTED\_AT

> **PROCESSING\_STARTED\_AT**: `5`

***

### PUBLISHED\_AT

> **PUBLISHED\_AT**: `4`

***

### REQUEUE\_COUNT

> **REQUEUE\_COUNT**: `12`

A counter for how many times a message has been requeued.

***

### REQUEUED\_AT

> **REQUEUED\_AT**: `11`

A timestamp that is set only when a message is manually requeued
for the first time.
This is used for tracking the "clone" action.

***

### REQUEUED\_MESSAGE\_PARENT\_ID

> **REQUEUED\_MESSAGE\_PARENT\_ID**: `22`

***

### SCHEDULED\_AT

> **SCHEDULED\_AT**: `3`

***

### SCHEDULED\_CRON\_FIRED

> **SCHEDULED\_CRON\_FIRED**: `15`

***

### SCHEDULED\_MESSAGE\_PARENT\_ID

> **SCHEDULED\_MESSAGE\_PARENT\_ID**: `21`

***

### SCHEDULED\_REPEAT\_COUNT

> **SCHEDULED\_REPEAT\_COUNT**: `17`

***

### SCHEDULED\_TIMES

> **SCHEDULED\_TIMES**: `20`

***

### STATUS

> **STATUS**: `1`

***

### UNACKNOWLEDGED\_AT

> **UNACKNOWLEDGED\_AT**: `8`

[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EMessageProperty

# Enumeration: EMessageProperty

The integer values are used as hash field names in Redis for memory efficiency.
Assigning explicit values prevents accidental reordering from breaking data compatibility.

## Enumeration Members

### ACKNOWLEDGED_AT

> **ACKNOWLEDGED_AT**: `7`

---

### ATTEMPTS

> **ATTEMPTS**: `16`

---

### DEAD_LETTERED_AT

> **DEAD_LETTERED_AT**: `6`

---

### EFFECTIVE_SCHEDULED_DELAY

> **EFFECTIVE_SCHEDULED_DELAY**: `19`

---

### EXPIRED

> **EXPIRED**: `18`

---

### ID

> **ID**: `0`

---

### LAST_REQUEUED_AT

> **LAST_REQUEUED_AT**: `13`

A timestamp that is updated each time a message is manually requeued.

---

### LAST_RETRIED_ATTEMPT_AT

> **LAST_RETRIED_ATTEMPT_AT**: `14`

A timestamp that is set only when a message is automatically
retried after a processing failure (e.g., from an unacknowledged message).

---

### LAST_SCHEDULED_AT

> **LAST_SCHEDULED_AT**: `10`

---

### LAST_UNACKNOWLEDGED_AT

> **LAST_UNACKNOWLEDGED_AT**: `9`

---

### MESSAGE

> **MESSAGE**: `2`

---

### PROCESSING_STARTED_AT

> **PROCESSING_STARTED_AT**: `5`

---

### PUBLISHED_AT

> **PUBLISHED_AT**: `4`

---

### REQUEUE_COUNT

> **REQUEUE_COUNT**: `12`

A counter for how many times a message has been requeued.

---

### REQUEUED_AT

> **REQUEUED_AT**: `11`

A timestamp that is set only when a message is manually requeued
for the first time.
This is used for tracking the "clone" action.

---

### REQUEUED_MESSAGE_PARENT_ID

> **REQUEUED_MESSAGE_PARENT_ID**: `22`

---

### SCHEDULED_AT

> **SCHEDULED_AT**: `3`

---

### SCHEDULED_CRON_FIRED

> **SCHEDULED_CRON_FIRED**: `15`

---

### SCHEDULED_MESSAGE_PARENT_ID

> **SCHEDULED_MESSAGE_PARENT_ID**: `21`

---

### SCHEDULED_REPEAT_COUNT

> **SCHEDULED_REPEAT_COUNT**: `17`

---

### SCHEDULED_TIMES

> **SCHEDULED_TIMES**: `20`

---

### STATUS

> **STATUS**: `1`

---

### UNACKNOWLEDGED_AT

> **UNACKNOWLEDGED_AT**: `8`

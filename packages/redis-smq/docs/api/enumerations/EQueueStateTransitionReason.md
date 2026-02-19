[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EQueueStateTransitionReason

# Enumeration: EQueueStateTransitionReason

Minimal set of queue state transition reasons covering most common cases

## Enumeration Members

### CONFIG_CHANGE

> **CONFIG_CHANGE**: `"CONFIG_CHANGE"`

Configuration change requiring state transition

---

### EMERGENCY

> **EMERGENCY**: `"EMERGENCY"`

Emergency situation requiring immediate action

---

### ERROR

> **ERROR**: `"ERROR"`

Error condition requiring intervention

---

### MANUAL

> **MANUAL**: `"MANUAL"`

Manual user action via API, CLI, or UI

---

### PERFORMANCE

> **PERFORMANCE**: `"PERFORMANCE"`

Performance issue (high latency, resource exhaustion, etc.)

---

### PURGE_QUEUE_CANCEL

> **PURGE_QUEUE_CANCEL**: `"PURGE_QUEUE_CANCEL"`

---

### PURGE_QUEUE_COMPLETE

> **PURGE_QUEUE_COMPLETE**: `"PURGE_QUEUE_COMPLETE"`

---

### PURGE_QUEUE_FAIL

> **PURGE_QUEUE_FAIL**: `"PURGE_QUEUE_FAIL"`

---

### PURGE_QUEUE_START

> **PURGE_QUEUE_START**: `"PURGE_QUEUE_START"`

---

### RECOVERY

> **RECOVERY**: `"RECOVERY"`

Recovery from a failed or degraded state

---

### SCHEDULED

> **SCHEDULED**: `"SCHEDULED"`

Scheduled operation (maintenance, deployment, etc.)

---

### SYSTEM_INIT

> **SYSTEM_INIT**: `"SYSTEM_INIT"`

System initialization - default state when queue is created

---

### TESTING

> **TESTING**: `"TESTING"`

Testing or debugging activity

---

### UNKNOWN

> **UNKNOWN**: `"UNKNOWN"`

Unknown or unspecified reason

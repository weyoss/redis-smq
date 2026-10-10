[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EStateTransitionReason

# Enumeration: EStateTransitionReason

Reasons for a state transition that a caller may supply.

These are the values accepted in `TQueueStateTransitionUserOptions`
and passed to `IQueueStateManager.pause` / `resume` / `stop`. A caller
who omits the reason defaults to `MANUAL`.

The values are persisted in the queue's state history list (as part of
the JSON-serialized transition records). Renaming a member is a
breaking change to persisted history.

## Enumeration Members

### CONFIG\_CHANGE

> **CONFIG\_CHANGE**: `"CONFIG_CHANGE"`

The transition was made because configuration changed — for example,
a queue's rate limit was raised and the queue was temporarily
stopped to apply the new value.

---

### EMERGENCY

> **EMERGENCY**: `"EMERGENCY"`

The transition was made in response to an emergency — a failing
downstream service, a data integrity issue, or similar. Semantically
distinct from MANUAL so that post-incident reviews can filter to
transitions that were reactive.

---

### ERROR

> **ERROR**: `"ERROR"`

The transition was made automatically in response to an error. The
library does not currently perform automatic error-driven
transitions; this reason exists for callers that pause or stop a
queue from within an error handler and want the history to reflect
the trigger.

---

### MANUAL

> **MANUAL**: `"MANUAL"`

The transition was made explicitly by an operator or an application
through the public API. This is the default when no reason is
supplied.

---

### OTHER

> **OTHER**: `"OTHER"`

The transition was made for a reason that does not fit any other
category. Prefer a specific reason when one applies.

---

### PERFORMANCE

> **PERFORMANCE**: `"PERFORMANCE"`

The transition was made to protect or recover performance — for
example, pausing a queue to shed load while a downstream service
catches up.

---

### SCHEDULED

> **SCHEDULED**: `"SCHEDULED"`

The transition was scheduled — for example, a periodic maintenance
window that pauses a queue at a known time. The library does not
currently schedule transitions itself; this reason exists for
callers that implement their own scheduling and want the transition
history to reflect the intent.

---

### TESTING

> **TESTING**: `"TESTING"`

The transition was made by a test harness. Kept distinct from MANUAL
so that test-generated transitions can be filtered out of production
audits.

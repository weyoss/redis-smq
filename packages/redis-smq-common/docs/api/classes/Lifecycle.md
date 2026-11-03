[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Lifecycle

# Class: Lifecycle

Small state machine for tracking lifecycle transitions (init / shutdown,
start / stop, up / down).

## Two-phase transitions

`goingUp()` / `goingDown()` request a transition; they do **not** apply
it. The transition sits in a `GOING_*` state until one of:

- `commit()` — applies the transition (GOING_UP → UP, GOING_DOWN → DOWN)
- `rollback()` — discards the transition (GOING_UP → DOWN only)

While a transition is pending, all new `goingUp()` / `goingDown()` calls
return `false` — the machine enforces a single in-flight transition so
that `commit()` / `rollback()` always refer to a well-defined target.

## Rollback

`rollback()` is only permitted from `GOING_UP`. Startup is retryable —
if initialization fails, aborting the attempt and returning to `DOWN`
is the correct response, and a subsequent `goingUp()` can begin a new
attempt. Shutdown, by contrast, is one-way: once `goingDown()` has been
called, consumers have been told to stop accepting work, and rolling
back would violate that contract. If a shutdown step fails, the correct
response is to proceed with `commit()` anyway (force down) — not to
cancel the transition.

## Return value contract

Every public method returns `boolean`. `false` means "this call had no
effect" (wrong state, no pending transition, or a transition is already
in progress). Methods never throw.

## `isRunning()` vs `isUp()`

These are **not** synonyms:

- `isUp()` → true in `UP` and `GOING_DOWN` (committed up, or
  transitioning from up)
- `isRunning()` → true only in `UP` (committed up, nothing pending)

During `goingDown()`, `isUp()` is still `true` (commit hasn't happened)
but `isRunning()` is `false` — signalling "shutdown requested, stop
accepting new work." Consumers doing operational work should gate on
`isRunning()`, not `isUp()`.

## Constructors

### Constructor

> **new Lifecycle**(): `Lifecycle`

#### Returns

`Lifecycle`

## Methods

### commit()

> **commit**(): `boolean`

Apply the pending transition.

GOING_UP → UP
GOING_DOWN → DOWN

Returns `false` if no transition is pending (`state` is already
`UP` or `DOWN`). Not idempotent in the return-value sense: a second
`commit()` after a successful one returns `false`.

#### Returns

`boolean`

---

### getState()

> **getState**(): [`TLifecycleState`](../type-aliases/TLifecycleState.md)

Return the current state as a discriminated value.

Complements the `is*()` predicates: they answer one question each
("am I up?", "am I running?"), while `getState()` returns the whole
answer at once, suitable for logging, snapshot tests, or an
exhaustive `switch` in a consumer.

Note: consuming the returned union couples the caller to
`TLifecycleState`. If future versions add a fifth state, exhaustive
`switch` statements in the caller will fail to compile — which is
the intended signal for "re-examine your state handling."

#### Returns

[`TLifecycleState`](../type-aliases/TLifecycleState.md)

---

### goingDown()

> **goingDown**(): `boolean`

Begin a transition to DOWN.

Returns `false` if:

- the lifecycle is already down or going down (`isDown()` is true), or
- a transition to up is pending.

On success, `isGoingDown()` is `true`. Call `commit()` to apply.
There is **no rollback path** from `GOING_DOWN` — shutdown is
one-way by design. If a shutdown step fails, call `commit()` anyway
(force down); do not attempt to cancel the transition.

#### Returns

`boolean`

---

### goingUp()

> **goingUp**(): `boolean`

Begin a transition to UP.

Returns `false` if:

- the lifecycle is already up or going up (`isUp()` is true), or
- a transition to down is pending.

On success, `isGoingUp()` is `true`. Call `commit()` to apply,
`rollback()` to discard and return to `DOWN`.

#### Returns

`boolean`

---

### isDown()

> **isDown**(): `boolean`

True if the lifecycle is committed to the DOWN state.

Includes `DOWN` (fully down) and `GOING_UP` (still committed to down,
transitioning up). Excludes `UP` and `GOING_DOWN`.

#### Returns

`boolean`

---

### isGoingDown()

> **isGoingDown**(): `boolean`

True if a transition to DOWN is pending (committable only).

#### Returns

`boolean`

---

### isGoingUp()

> **isGoingUp**(): `boolean`

True if a transition to UP is pending (committable or rollback-able).

#### Returns

`boolean`

---

### isRunning()

> **isRunning**(): `boolean`

True if the lifecycle is in the `UP` state **and** no transition is
pending.

Distinct from `isUp()`: during `goingDown()`, `isUp()` is still
`true` (the lifecycle hasn't committed to down yet) but `isRunning()`
is `false`. Consumers performing operational work should gate on
`isRunning()`, not `isUp()` — the former becomes `false` as soon as
shutdown starts, which is the correct time to stop accepting new
work. The latter remains `true` until shutdown completes, which
would let new work queue up during the shutdown window.

#### Returns

`boolean`

---

### isUp()

> **isUp**(): `boolean`

True if the lifecycle is committed to the UP state.

Includes `UP` (fully up) and `GOING_DOWN` (still committed to up,
transitioning out). Excludes `DOWN` and `GOING_UP`.

For "up and stable, ready to accept work," use `isRunning()`
instead.

#### Returns

`boolean`

---

### rollback()

> **rollback**(): `boolean`

Discard the pending **startup** transition.

GOING_UP → DOWN

Returns `true` on success — `state` returns to `DOWN` and a new
`goingUp()` can be requested immediately.

Returns `false` in every other state:

- `UP` / `DOWN` — nothing to roll back.
- `GOING_DOWN` — shutdown is one-way; cancelling a
  transition to down would allow the
  lifecycle to accept work again after
  consumers have been told to stop. If a
  shutdown step fails, call `commit()`
  anyway to force the lifecycle down.

Use this when the operation that justified the startup transition
failed: the lifecycle remains in `DOWN` and can retry.

#### Returns

`boolean`

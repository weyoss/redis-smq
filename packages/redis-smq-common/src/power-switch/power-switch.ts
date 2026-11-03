/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * The four states `PowerSwitch` can occupy.
 *
 *   DOWN        — committed off; no transition in progress
 *   GOING_UP    — transition to on pending (committable or rollback-able)
 *   UP          — committed on; no transition in progress
 *   GOING_DOWN  — transition to off pending (committable only)
 *
 * The two `GOING_*` states exist so consumers can distinguish "shutdown
 * requested" from "shutdown complete" — the difference between
 * `goingDown()` (stop accepting new work) and `commit()` (fully stopped).
 *
 * Note that `GOING_UP` is cancellable but `GOING_DOWN` is not: see
 * `rollback()`.
 */
export type TPowerSwitchState = 'DOWN' | 'GOING_UP' | 'UP' | 'GOING_DOWN';

/**
 * Small state machine for tracking power on/off transitions.
 *
 * ## States and transitions
 *
 *   ┌────────┐ goingUp() ┌──────────┐  commit()  ┌────────┐
 *   │  DOWN  │ ────────► │ GOING_UP │ ─────────► │   UP   │
 *   └────────┘           └──────────┘            └────────┘
 *        ▲                    │                       │
 *        │              rollback()                    │ goingDown()
 *        │                    │                       ▼
 *        │                    ▼                ┌────────────┐
 *        └──────────────  DOWN                 │ GOING_DOWN │
 *                                              └────────────┘
 *                                                    │
 *                                    commit()        │
 *                                                    ▼
 *                                                  DOWN
 *
 * ## Two-phase transitions
 *
 * `goingUp()` / `goingDown()` request a transition; they do **not** apply
 * it. The transition sits in a `GOING_*` state until one of:
 *
 *   - `commit()`   — applies the transition (GOING_UP → UP, GOING_DOWN → DOWN)
 *   - `rollback()` — discards the transition (GOING_UP → DOWN only)
 *
 * While a transition is pending, all new `goingUp()` / `goingDown()` calls
 * return `false` — the machine enforces a single in-flight transition so
 * that `commit()` / `rollback()` always refer to a well-defined target.
 *
 * ## Why rollback is asymmetric
 *
 * `rollback()` is only permitted from `GOING_UP`. Startup is retryable —
 * if initialization fails, aborting the attempt and returning to `DOWN`
 * is the correct response, and a subsequent `goingUp()` can begin a new
 * attempt. Shutdown, by contrast, is one-way: once `goingDown()` has been
 * called, consumers have been told to stop accepting work, and rolling
 * back would violate that contract. If a shutdown step fails, the correct
 * response is to proceed with `commit()` anyway (force down) — not to
 * cancel the transition.
 *
 * ## Return value contract
 *
 * Every public method returns `boolean`. `false` means "this call had no
 * effect" (wrong state, no pending transition, or a transition is already
 * in progress). Methods never throw.
 *
 * ## `isRunning()` vs `isUp()`
 *
 * These are **not** synonyms:
 *
 *   - `isUp()`      → true in `UP` and `GOING_DOWN` (committed on, or
 *                     transitioning from on)
 *   - `isRunning()` → true only in `UP` (committed on, nothing pending)
 *
 * During `goingDown()`, `isUp()` is still `true` (commit hasn't happened)
 * but `isRunning()` is `false` — signalling "shutdown requested, stop
 * accepting new work." Consumers doing operational work should gate on
 * `isRunning()`, not `isUp()`.
 */
export class PowerSwitch {
  /**
   * The current state. Single source of truth — every query method below
   * is a discriminated comparison against this field.
   */
  protected state: TPowerSwitchState = 'DOWN';

  /**
   * Attempt to begin a transition to state `s`.
   *
   * Returns `false` — and leaves `state` untouched — unless the switch is
   * in the stable state opposite to `s`:
   *
   *   - `switch(true)`  succeeds only from `DOWN`  (→ `GOING_UP`)
   *   - `switch(false)` succeeds only from `UP`    (→ `GOING_DOWN`)
   *
   * On success, `state` becomes the corresponding `GOING_*` state and the
   * method returns `true`. The transition is **not** applied here; the
   * caller must `commit()` (or, for `GOING_UP` only, `rollback()`).
   *
   * Subclasses may override this to add custom admissibility rules
   * (rate-limiting, capability checks, etc.). `goingUp()` / `goingDown()`
   * delegate here, so an override affects both.
   *
   * Note: `switch` is a reserved word in JavaScript, but it is allowed
   * as a method name.
   */
  protected switch(s: boolean): boolean {
    if (s === true) {
      if (this.state !== 'DOWN') return false;
      this.state = 'GOING_UP';
      return true;
    }
    if (this.state !== 'UP') return false;
    this.state = 'GOING_DOWN';
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Queries
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * True if the switch is in, or transitioning from, the UP state.
   *
   * Both `UP` and `GOING_DOWN` return true — the switch has not yet
   * committed to down. For "up and stable, ready to accept work," use
   * `isRunning()` instead.
   */
  isUp(): boolean {
    return this.state === 'UP' || this.state === 'GOING_DOWN';
  }

  /**
   * True if the switch is in, or transitioning from, the DOWN state.
   *
   * Both `DOWN` and `GOING_UP` return true.
   */
  isDown(): boolean {
    return this.state === 'DOWN' || this.state === 'GOING_UP';
  }

  /** True if a transition to UP is pending (committable or rollback-able). */
  isGoingUp(): boolean {
    return this.state === 'GOING_UP';
  }

  /** True if a transition to DOWN is pending (committable only). */
  isGoingDown(): boolean {
    return this.state === 'GOING_DOWN';
  }

  /**
   * True if the switch is in the `UP` state **and** no transition is
   * pending.
   *
   * Distinct from `isUp()`: during `goingDown()`, `isUp()` is still
   * `true` (the switch hasn't committed to down yet) but `isRunning()`
   * is `false`. Consumers performing operational work should gate on
   * `isRunning()`, not `isUp()` — the former becomes `false` as soon as
   * shutdown starts, which is the correct time to stop accepting new
   * work. The latter remains `true` until shutdown completes, which
   * would let new work queue up during the shutdown window.
   */
  isRunning(): boolean {
    return this.state === 'UP';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Transition requests
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Begin a transition to UP.
   *
   * Returns `false` if:
   *   - the switch is already up or going up (`isUp()` is true), or
   *   - a transition to down is pending.
   *
   * On success, `isGoingUp()` is `true`. Call `commit()` to apply,
   * `rollback()` to discard and return to `DOWN`.
   */
  goingUp(): boolean {
    return this.switch(true);
  }

  /**
   * Begin a transition to DOWN.
   *
   * Returns `false` if:
   *   - the switch is already down or going down (`isDown()` is true), or
   *   - a transition to up is pending.
   *
   * On success, `isGoingDown()` is `true`. Call `commit()` to apply.
   * There is **no rollback path** from `GOING_DOWN` — shutdown is
   * one-way by design. If a shutdown step fails, call `commit()` anyway
   * (force down); do not attempt to cancel the transition.
   */
  goingDown(): boolean {
    return this.switch(false);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Transition settlement
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Apply the pending transition.
   *
   *   GOING_UP   → UP
   *   GOING_DOWN → DOWN
   *
   * Returns `false` if no transition is pending (`state` is already
   * `UP` or `DOWN`). Not idempotent in the return-value sense: a second
   * `commit()` after a successful one returns `false`.
   */
  commit(): boolean {
    if (this.state === 'GOING_UP') {
      this.state = 'UP';
      return true;
    }
    if (this.state === 'GOING_DOWN') {
      this.state = 'DOWN';
      return true;
    }
    return false;
  }

  /**
   * Discard the pending **startup** transition.
   *
   *   GOING_UP → DOWN
   *
   * Returns `true` on success — `state` returns to `DOWN` and a new
   * `goingUp()` can be requested immediately.
   *
   * Returns `false` in every other state:
   *
   *   - `UP` / `DOWN`      — nothing to roll back.
   *   - `GOING_DOWN`       — shutdown is one-way; cancelling a
   *                          transition to down would allow the switch
   *                          to accept work again after consumers have
   *                          been told to stop. If a shutdown step
   *                          fails, call `commit()` anyway to force
   *                          the switch down.
   *
   * Use this when the operation that justified the startup transition
   * failed: the switch remains in `DOWN` and can retry.
   */
  rollback(): boolean {
    if (this.state === 'GOING_UP') {
      this.state = 'DOWN';
      return true;
    }
    return false;
  }
}

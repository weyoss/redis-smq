/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { PowerSwitch } from 'redis-smq-common';

/**
 * The library's lifecycle state machine.
 *
 * RedisSMQ is always in exactly one of four states:
 *
 *   - `DOWN`        — fully stopped. No resources held.
 *   - `GOING_UP`    — initialization in progress.
 *   - `UP`          — fully started. All resources available.
 *   - `GOING_DOWN`  — shutdown in progress.
 *
 * Transitions are one-way within a lifecycle:
 *
 *   DOWN ──goingUp()──▶ GOING_UP ──commit()──▶ UP
 *                          │
 *                          └──rollback()──▶ DOWN
 *
 *   UP ──goingDown()──▶ GOING_DOWN ──commit()──▶ DOWN
 *
 * `rollback()` is the failure path for `GOING_UP`: it returns the state
 * to `DOWN` and lets the caller retry initialization from a clean slate.
 * There is no equivalent on the shutdown path — a shutdown that starts
 * always completes, because tearing down is best-effort and the state
 * machine does not need to distinguish partial shutdown from complete
 * shutdown.
 *
 * ---
 *
 * ### Why a state machine
 *
 * `LifecycleManager` needs to answer three questions before it acts:
 *
 *   1. Are we already up? (idempotent `initialize`)
 *   2. Is a transition in flight? (queue the caller behind it)
 *   3. Are we going down? (refuse new work)
 *
 * A boolean `isRunning` cannot answer any of them. The four-state
 * machine answers all three, and it prevents the class of bugs that
 * arises from a bare boolean: a failed initialization that leaves the
 * flag set, a shutdown that races an initialization, a second
 * initialization that overwrites the first.
 *
 * ---
 *
 * ### Why this is internal
 *
 * `StateManager` is not part of the public API. A caller who wants to
 * know whether RedisSMQ is running calls `RedisSMQ.isRunning()`, which
 * delegates here. A caller who wants to start or stop the library calls
 * `RedisSMQ.initialize()` or `RedisSMQ.shutdown()`, both of which manage
 * the transitions through `LifecycleManager`.
 *
 * The `goingUp`, `goingDown`, `commit`, and `rollback` methods are
 * exposed only for `LifecycleManager`. They should not be called from
 * anywhere else. Doing so would bypass the resource sequence that the
 * lifecycle manager owns and leave the library in a state where the
 * flag says "up" but the resources do not exist.
 */
export class StateManager {
  /**
   * The underlying state holder.
   *
   * `PowerSwitch` is a small finite-state machine from
   * `redis-smq-common` — the same primitive `Runnable` uses for its
   * per-component lifecycle. Reusing it here keeps the state machine's
   * behavior identical at both the library level and the component
   * level, and it means the transition rules (which states permit which
   * calls) are tested in one place, not two.
   */
  private static state = new PowerSwitch();

  // ═══════════════════════════════════════════════════════════════════════
  // Queries
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Returns whether RedisSMQ is fully up.
   *
   * True only in the `UP` state. False during `GOING_UP`, `GOING_DOWN`,
   * and `DOWN`. A caller who wants "up or starting up" should use
   * `isRunning()`.
   */
  static isUp(): boolean {
    return this.state.isUp();
  }

  /**
   * Returns whether RedisSMQ is starting up.
   *
   * True only in the `GOING_UP` state. `LifecycleManager.initialize`
   * uses this to queue concurrent callers behind an in-flight
   * initialization.
   */
  static isGoingUp(): boolean {
    return this.state.isGoingUp();
  }

  /**
   * Returns whether RedisSMQ is shutting down.
   *
   * True only in the `GOING_DOWN` state. `LifecycleManager.initialize`
   * refuses new initializations while this is true; it is a programming
   * error to start the library while it is stopping.
   */
  static isGoingDown(): boolean {
    return this.state.isGoingDown();
  }

  /**
   * Returns whether RedisSMQ is currently running.
   *
   * True only in the `UP` state. This is the check `build` uses to
   * guard construction: components can be created only when the library
   * is fully started, because the components depend on the connection
   * pool, the configuration, and the event buses that the lifecycle
   * manager brings up.
   *
   * Note: `PowerSwitch.isRunning()` in `redis-smq-common` returns
   * `isUp() && !isGoingDown()`. Since `GOING_DOWN` and `UP` are
   * mutually exclusive states in the switch, the two are equivalent —
   * this method is a semantic alias for `isUp()`, kept for readability
   * at the call sites that mean "can I construct things?"
   */
  static isRunning(): boolean {
    return this.state.isRunning();
  }

  /**
   * Returns whether RedisSMQ is fully down.
   *
   * True only in the `DOWN` state. `LifecycleManager.shutdown` uses
   * this to short-circuit a shutdown when there is nothing to tear down.
   */
  static isDown(): boolean {
    return this.state.isDown();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Transitions
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Enters the `GOING_UP` state.
   *
   * Called by `LifecycleManager.initialize` before it begins the
   * resource sequence. After this call, concurrent `initialize` calls
   * will queue behind the in-flight one, and `build` calls will throw
   * `PanicError` until initialization completes.
   *
   * The transition must be resolved by exactly one of `commit()`
   * (success) or `rollback()` (failure). Leaving the state in
   * `GOING_UP` indefinitely would leave the library permanently
   * un-constructible.
   */
  static goingUp(): void {
    this.state.goingUp();
  }

  /**
   * Enters the `GOING_DOWN` state.
   *
   * Called by `LifecycleManager.shutdown` before it begins tearing down
   * resources. After this call, `build` calls will throw `PanicError`,
   * and concurrent `initialize` calls will fail with `PanicError`.
   *
   * The transition must be resolved by `commit()`. There is no
   * `rollback()` on the shutdown path — a shutdown that has begun
   * always completes.
   */
  static goingDown(): void {
    this.state.goingDown();
  }

  /**
   * Commits the current transition.
   *
   * `GOING_UP` → `UP`. `GOING_DOWN` → `DOWN`. Any other state is a
   * no-op or an error, depending on `PowerSwitch`'s rules — the
   * lifecycle manager only calls this from the two valid states.
   *
   * When `commit()` returns after a `GOING_UP`, the library is fully
   * started and all resources are available. When it returns after a
   * `GOING_DOWN`, all resources are released and a fresh `initialize()`
   * can begin.
   */
  static commit(): void {
    this.state.commit();
  }

  /**
   * Rolls back the current transition.
   *
   * Valid only in `GOING_UP`. Returns the state to `DOWN` so that a
   * subsequent `initialize()` can retry from a clean slate. This is the
   * failure path for a partial initialization: resources that were
   * acquired are released (by `LifecycleManager`'s rollback sequence)
   * and the state machine forgets that an attempt was ever made.
   *
   * Calling `rollback()` from `UP` or `DOWN` has no effect.
   */
  static rollback(): void {
    this.state.rollback();
  }
}

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { v4 as uuid } from 'uuid';
import { async } from '../async/index.js';
import { ICallback } from '../async/index.js';
import { AbortError } from '../errors/index.js';
import { EventEmitter, TEventEmitterEvent } from '../event/index.js';
import { PowerSwitch } from '../power-switch/index.js';
import { ILogger } from '../logger/index.js';

/**
 * A robust base class for long-running components/services with explicit lifecycle management.
 *
 * Features:
 * - `goingUp()` / `goingDown()` hooks returning callback-based tasks (executed in series)
 * - Safe concurrent `run()` / `shutdown()` / `ensureIsOperational()` calls
 * - Automatic abort of startup when shutdown is requested
 *
 * @template Event - The type of events that the Runnable class can emit.
 *
 * @extends EventEmitter<Event>
 */
export abstract class Runnable<
  Event extends TEventEmitterEvent = TEventEmitterEvent,
> extends EventEmitter<Event> {
  protected readonly id: string;
  protected readonly powerSwitch: PowerSwitch;
  protected readonly forceShutdownOnError: boolean;

  protected abstract readonly logger: ILogger;

  /** Callbacks waiting for the Runnable to become fully up */
  private waitingForUpCallbacks: ICallback<void>[] = [];
  /** Callbacks waiting for the Runnable to finish shutting down */
  private waitingForDownCallbacks: ICallback<void>[] = [];

  protected constructor(forceShutdownOnError = true) {
    super();
    this.id = uuid();
    this.powerSwitch = new PowerSwitch();
    this.forceShutdownOnError = forceShutdownOnError;
  }

  /**
   * Returns an array of tasks to be executed when the Runnable instance is going up.
   *
   * @returns {Array<(cb: ICallback<void>) => void>} - An array of tasks. Each task is a function that takes a callback function as a parameter.
   * The callback function should be called when the task is completed.
   * If an error occurs during the task execution, the callback function should be called with the error as the first parameter.
   * If the task execution is successful, the callback function should be called with no arguments.
   *
   * By default, this method returns an empty array. Subclasses can override this method to define their own tasks.
   */
  protected goingUp(): Array<(cb: ICallback<void>) => void> {
    return [];
  }

  /**
   * Returns an array of tasks to be executed when the Runnable instance is going down.
   *
   * @returns {Array<(cb: ICallback<void>) => void>} - An array of tasks. Each task is a function that takes a callback function as a parameter.
   * The callback function should be called when the task is completed.
   * If an error occurs during the task execution, the callback function should be called with the error as the first parameter.
   * If the task execution is successful, the callback function should be called with no arguments.
   *
   * By default, this method returns an empty array. Subclasses can override this method to define their own tasks.
   */
  protected goingDown(): Array<(cb: ICallback<void>) => void> {
    return [];
  }

  /**
   * Marks the Runnable instance as up
   */
  protected finalizeUp(): void {
    if (!this.powerSwitch.commit()) {
      const err = new Error('Failed to commit "up" state');
      this.flushWaitingForUp(err);
      return;
    }

    this.flushWaitingForUp();
  }

  /**
   * Marks the Runnable instance as down.
   */
  protected finalizeDown(): void {
    this.powerSwitch.commit(); // safe / idempotent
    this.flushWaitingForUp(new Error('Runnable has been shut down'));
    this.flushWaitingForDown();
  }

  /**
   * Handles errors that occur within the Runnable instance.
   * Reacts to errors only when in an operational state:
   * - Going up (starting) - errors during startup should trigger shutdown
   * - Up and running (operational) - errors during operation should trigger shutdown
   * Does NOT react to errors when:
   * - Going down (already shutting down)
   * - Down (fully stopped)
   *
   * @param err - The error that occurred within the Runnable instance.
   * @returns {void} - This function does not return any value.
   */
  protected handleError(err: Error): void {
    if (!this.isOperational()) return;

    this.logger.error(err);
    this.shutdown(() => void 0);
  }

  private flushWaitingForUp(error?: Error | null): void {
    const callbacks = this.waitingForUpCallbacks;
    this.waitingForUpCallbacks = [];

    for (const cb of callbacks) {
      try {
        cb(error ?? null);
      } catch (e) {
        this.logger.error('Error in waitingForUp callback:', e);
      }
    }
  }

  private flushWaitingForDown(error?: Error | null): void {
    const callbacks = this.waitingForDownCallbacks;
    this.waitingForDownCallbacks = [];

    for (const cb of callbacks) {
      try {
        cb(error ?? null);
      } catch (e) {
        this.logger.error('Error in waitingForDown callback:', e);
      }
    }
  }

  protected executeGoingUpTasks(): void {
    const tasks = this.goingUp().map((task) => (taskCb: ICallback<void>) => {
      if (!this.isGoingUp()) {
        return taskCb(new AbortError({ message: 'Startup aborted' }));
      }

      task((err) => {
        if (!this.isGoingUp()) {
          taskCb(new AbortError({ message: 'Startup aborted by shutdown' }));
        } else {
          taskCb(err);
        }
      });
    });

    async.series(tasks, (err) => {
      if (!this.isGoingUp()) {
        return this.flushWaitingForUp(
          new AbortError({ message: 'Startup aborted by shutdown' }),
        );
      }

      if (err) {
        this.powerSwitch.rollback();
        this.flushWaitingForUp(err);
        if (this.forceShutdownOnError) this.executeGoingDownTasks();
        return;
      }

      this.finalizeUp();
    });
  }

  protected executeGoingDownTasks(): void {
    async.series(this.goingDown(), (taskErr) => {
      if (taskErr) {
        this.logger.error('Error in goingDown tasks:', taskErr);
      }
      this.finalizeDown();
    });
  }

  /**
   * Checks if the Runnable is in an operational state where it can process work or start up.
   * Operational states:
   * - DOWN and GOING_UP (starting up)
   * - UP and not GOING_DOWN (fully operational)
   *
   * Non-operational states:
   * - UP and GOING_DOWN (shutting down)
   * - DOWN and not GOING_UP (fully stopped)
   */
  isOperational(): boolean {
    return this.isGoingUp() || (this.isUp() && !this.isGoingDown());
  }

  /**
   * Checks if the Runnable instance is currently running (fully up with no pending transitions).
   *
   * @returns {boolean} - Returns `true` if the Runnable instance is fully up and running.
   */
  isRunning(): boolean {
    return this.powerSwitch.isRunning();
  }

  /**
   * Checks if the Runnable instance is currently going up.
   *
   * @returns {boolean} - Returns `true` if the Runnable instance is going up, `false` otherwise.
   */
  isGoingUp(): boolean {
    return this.powerSwitch.isGoingUp();
  }

  /**
   * Checks if the Runnable instance is currently going down.
   *
   * @returns {boolean} - Returns `true` if the Runnable instance is going down, `false` otherwise.
   */
  isGoingDown(): boolean {
    return this.powerSwitch.isGoingDown();
  }

  /**
   * Checks if the Runnable instance is currently up.
   *
   * @returns {boolean} - Returns `true` if the Runnable instance is up, `false` otherwise.
   */
  isUp(): boolean {
    return this.powerSwitch.isUp();
  }

  /**
   * Checks if the Runnable instance is currently down.
   *
   * @returns {boolean} - Returns `true` if the Runnable instance is down, `false` otherwise.
   */
  isDown(): boolean {
    return this.powerSwitch.isDown();
  }

  /**
   * Initiates the Runnable instance's execution.
   *
   * The `run` method starts the Runnable instance by executing the `goingUp` tasks.
   * If the Runnable instance is already running or going up, the method will return immediately without executing any tasks.
   *
   * @param cb - A callback function that will be called after the execution process is completed.
   *             If an error occurs during the execution process, the error will be passed as the first parameter to the callback.
   *             If the execution process is successful, the callback will be called with no arguments.
   */
  run(cb: ICallback): void {
    if (this.isRunning()) return cb(null);
    if (this.isGoingUp()) return void this.waitingForUpCallbacks.push(cb);
    if (this.isGoingDown())
      return cb(new Error('Cannot run: shutdown is in progress'));

    if (!this.powerSwitch.goingUp()) {
      return cb(
        new Error('Cannot initiate startup – invalid state transition'),
      );
    }

    this.waitingForUpCallbacks.push(cb);
    this.executeGoingUpTasks();
  }

  /**
   * Performs a graceful shutdown of the Runnable instance.
   *
   * The shutdown process involves executing the `goingDown` tasks, which are responsible for cleaning up resources.
   * The shutdown behavior depends on the current state of the Runnable instance:
   * - If the Runnable is running (`isRunning()`) and going up (`isGoingUp()`), the shutdown process will rollback the going up state.
   * - If the Runnable is running (`isRunning()`) and up (`isUp()`), the shutdown process will mark the Runnable as going down.
   * - After executing the `goingDown` tasks, the Runnable will call the `down` method to finalize the shutdown process.
   *
   * @param cb - A callback function that will be called after the shutdown process is completed.
   *             If an error occurs during the shutdown process, the error will be passed as the first parameter to the callback.
   *             If the shutdown process is successful, the callback will be called with no arguments.
   */
  shutdown(cb: ICallback): void {
    this.waitingForDownCallbacks.push(cb);

    if (this.isGoingDown()) return; // callback will be called from finalizeDown

    if (!this.isOperational()) {
      this.flushWaitingForDown(); // already down → success
      return;
    }

    if (this.isGoingUp()) {
      this.powerSwitch.rollback();
      this.flushWaitingForUp(
        new AbortError({ message: 'Startup aborted by shutdown' }),
      );
      this.executeGoingDownTasks();
      return;
    }

    // Fully running
    if (!this.powerSwitch.goingDown()) {
      this.flushWaitingForDown(
        new Error('Cannot initiate shutdown – invalid state transition'),
      );
      return;
    }

    this.executeGoingDownTasks();
  }

  /**
   * Ensures the Runnable instance is operational (either starting up or fully running).
   * If it's not operational, starts it.
   * Calls the callback when the instance is operational.
   *
   * @param {ICallback<void>} cb - Callback function to be called when the instance is operational.
   * @returns {void}
   */
  ensureIsOperational(cb: ICallback): void {
    if (this.isGoingDown()) {
      return cb(new AbortError({ message: 'Shutdown in progress' }));
    }
    if (this.isRunning()) {
      return cb(null);
    }
    if (this.isGoingUp()) {
      this.waitingForUpCallbacks.push((err) => cb(err));
      return;
    }

    // Fully down → just start it (run() will call the callback when ready)
    this.run(cb);
  }

  /**
   * Retrieves the unique identifier of the Runnable instance.
   *
   * @returns {string} - The unique identifier of the Runnable instance.
   */
  getId(): string {
    return this.id;
  }
}

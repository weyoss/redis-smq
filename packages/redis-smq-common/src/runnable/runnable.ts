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
import { withOptionalCallback } from '../async/with-optional-callback.js';

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
    this.logger.debug(`Going up`);
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
    this.logger.debug(`Going down`);
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
    this.logger.debug(`Up and running`);
  }

  /**
   * Marks the Runnable instance as down.
   */
  protected finalizeDown(): void {
    this.powerSwitch.commit(); // safe / idempotent
    this.flushWaitingForUp(new Error('Runnable has been shut down'));
    this.flushWaitingForDown();
    this.logger.debug(`Completely shut down`);
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
  protected handleError(err: unknown): void {
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
   * This method starts the Runnable instance by executing all tasks defined in the `goingUp()` hook.
   * The startup sequence is executed in series, and each task's completion is awaited before proceeding.
   *
   * **State Transitions:**
   * - If the instance is already running (`isRunning()`), the callback is called immediately with no error.
   * - If the instance is already going up, the callback is queued to be called when startup completes.
   * - If the instance is going down, an error is returned as startup cannot proceed during shutdown.
   * - If the instance is down, the startup process begins and the callback will be called when startup completes or fails.
   *
   * **Error Handling:**
   * - If any task in the startup sequence fails, the startup is aborted and the error is propagated.
   * - If `forceShutdownOnError` is `true` (default), the instance will automatically begin shutdown after a startup error.
   *
   * @param {ICallback<void>} [cb] - Optional callback function to be called when the startup process completes.
   *   - If no error occurs, the callback is called with `null` (or no arguments).
   *   - If an error occurs during startup, the error is passed as the first argument.
   *   - If not provided, the method returns a Promise that resolves when startup completes or rejects with any error.
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided, otherwise returns void.
   *
   * @example
   * ```typescript
   * // Using callback pattern
   * const runnable = new MyRunnable();
   * runnable.run((err) => {
   *   if (err) {
   *     console.error('Failed to start:', err);
   *   } else {
   *     console.log('Started successfully');
   *   }
   * });
   *
   * // Using promise pattern
   * await runnable.run();
   * console.log('Started successfully');
   *
   * // Multiple calls are safe - only one startup process runs
   * runnable.run((err) => console.log('First callback'));
   * runnable.run((err) => console.log('Second callback')); // Queued
   * ```
   */
  run(): Promise<void>;
  run(cb: ICallback): void;
  run(cb?: ICallback): Promise<void> | void {
    return withOptionalCallback(cb, (callback) => {
      if (this.isRunning()) return callback(null);
      if (this.isGoingUp())
        return void this.waitingForUpCallbacks.push(callback);
      if (this.isGoingDown())
        return callback(new Error('Cannot run: shutdown is in progress'));

      if (!this.powerSwitch.goingUp()) {
        return callback(
          new Error('Cannot initiate startup – invalid state transition'),
        );
      }

      this.waitingForUpCallbacks.push(callback);
      this.executeGoingUpTasks();
    });
  }

  /**
   * Performs a graceful shutdown of the Runnable instance.
   *
   * This method initiates a clean shutdown process by executing all tasks defined in the `goingDown()` hook.
   * The shutdown sequence is executed in series, and each task's completion is awaited before proceeding.
   *
   * **State Transitions:**
   * - **If the instance is starting up (`isGoingUp()`)**:
   *   - Startup is aborted (rolled back)
   *   - All pending startup callbacks receive an `AbortError`
   *   - Shutdown tasks are executed immediately
   * - **If the instance is fully running (`isUp()`)**:
   *   - The instance transitions to going down state
   *   - Shutdown tasks are executed
   *   - Once complete, the instance transitions to down state
   * - **If already down or going down**:
   *   - No action is taken, but callbacks are queued to be called when shutdown completes
   * - **If not operational**:
   *   - Success is returned immediately (already down)
   *
   * **Error Handling:**
   * - If any task in the shutdown sequence fails, the error is logged but shutdown continues
   * - The instance always transitions to down state regardless of task errors
   * - All queued callbacks are eventually called
   *
   * **Idempotency:**
   * - Calling `shutdown()` multiple times is safe
   * - Subsequent calls will queue their callbacks to be called when the shutdown process completes
   *
   * @param {ICallback<void>} [cb] - Optional callback function to be called when the shutdown process completes.
   *   - If no error occurs, the callback is called with `null` (or no arguments).
   *   - Any errors during shutdown are passed to the callback as the first argument.
   *   - If not provided, the method returns a Promise that resolves when shutdown completes or rejects with any error.
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided, otherwise returns void.
   *
   * @example
   * ```typescript
   * // Using callback pattern
   * const runnable = new MyRunnable();
   * await runnable.run();
   *
   * runnable.shutdown((err) => {
   *   if (err) {
   *     console.error('Error during shutdown:', err);
   *   } else {
   *     console.log('Shutdown complete');
   *   }
   * });
   *
   * // Using promise pattern
   * await runnable.run();
   * await runnable.shutdown();
   * console.log('Shutdown complete');
   *
   * // Shutdown during startup
   * runnable.run(); // Starts async startup
   * await runnable.shutdown(); // Aborts startup and shuts down
   *
   * // Multiple shutdown calls are safe
   * runnable.shutdown(() => console.log('First'));
   * runnable.shutdown(() => console.log('Second')); // Called after shutdown
   * ```
   */
  shutdown(): Promise<void>;
  shutdown(cb: ICallback): void;
  shutdown(cb?: ICallback): Promise<void> | void {
    return withOptionalCallback(cb, (callback) => {
      this.waitingForDownCallbacks.push(callback);

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
    });
  }

  /**
   * Ensures the Runnable instance is operational (either starting up or fully running).
   *
   * This method checks the current state and takes appropriate action:
   * - If the instance is running (`isRunning()`), the callback is called immediately.
   * - If the instance is going up (`isGoingUp()`), the callback is queued to be called when startup completes.
   * - If the instance is down (`isDown()`), it initiates startup and calls the callback when ready.
   * - If the instance is going down (`isGoingDown()`), an error is returned as operation cannot be ensured during shutdown.
   *
   * This is useful for methods that need the component to be ready before performing operations,
   * automatically starting it if it's not already running.
   *
   * **Use Cases:**
   * - Ensuring a service is ready before processing requests
   * - Lazy initialization of components
   * - Recovery scenarios where the component might have been stopped
   *
   * @param {ICallback<void>} [cb] - Optional callback function to be called when the instance is operational.
   *   - If no error occurs, the callback is called with `null` (or no arguments).
   *   - If the instance is shutting down, an `AbortError` is passed.
   *   - If startup fails, the error is passed.
   *   - If not provided, the method returns a Promise that resolves when operational or rejects with any error.
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided, otherwise returns void.
   *
   * @throws {AbortError} When called while the instance is shutting down.
   * @throws {Error} Any error that occurs during startup if the instance was down.
   *
   * @example
   * ```typescript
   * // Using callback pattern
   * class MessageProcessor extends Runnable {
   *   processMessage(message: string, cb: ICallback) {
   *     this.ensureIsOperational((err) => {
   *       if (err) return cb(err);
   *       // Process message now that we're operational
   *       this.handleMessage(message, cb);
   *     });
   *   }
   * }
   *
   * // Using promise pattern
   * class MessageProcessor extends Runnable {
   *   async processMessage(message: string): Promise<void> {
   *     await this.ensureIsOperational();
   *     // Process message now that we're operational
   *     await this.handleMessage(message);
   *   }
   * }
   *
   * // Usage
   * const processor = new MessageProcessor();
   *
   * // This will automatically start the processor if needed
   * await processor.processMessage('Hello');
   *
   * // Subsequent calls will use the already running instance
   * await processor.processMessage('World');
   * ```
   */
  ensureIsOperational(): Promise<void>;
  ensureIsOperational(cb: ICallback): void;
  ensureIsOperational(cb?: ICallback): Promise<void> | void {
    return withOptionalCallback(cb, (callback) => {
      if (this.isGoingDown()) {
        return callback(new AbortError({ message: 'Shutdown in progress' }));
      }
      if (this.isRunning()) {
        return callback(null);
      }
      if (this.isGoingUp()) {
        this.waitingForUpCallbacks.push((err) => callback(err));
        return;
      }

      // Fully down → just start it (run() will call the callback when ready)
      this.run(callback);
    });
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

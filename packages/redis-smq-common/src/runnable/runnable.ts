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
 * A Runnable class that provides a foundation for managing long-running tasks.
 * It provides methods for starting, stopping, and handling errors during the execution of tasks.
 *
 * @template Event - The type of events that the Runnable class can emit.
 *
 * @extends EventEmitter<Event>
 */
export abstract class Runnable<
  Event extends TEventEmitterEvent,
> extends EventEmitter<Event> {
  protected id;
  protected powerSwitch;
  protected forceShutdownOnError = true;
  protected cleanUpBeforeShutdown = false;
  protected abstract logger: ILogger;

  /**
   * Callbacks waiting for the Runnable to be up
   */
  private waitingForUpCallbacks: ICallback<void>[] = [];

  protected constructor() {
    super();
    this.id = uuid();
    this.powerSwitch = new PowerSwitch();
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
  protected goingUp(): ((cb: ICallback<void>) => void)[] {
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
  protected goingDown(): ((cb: ICallback<void>) => void)[] {
    return [];
  }

  /**
   * Marks the Runnable instance as up and calls the provided callback function.
   *
   * @param {ICallback<boolean>} cb - The callback function to be called after marking the Runnable instance as up.
   * The callback function should be called with a boolean parameter indicating whether the Runnable instance was running or not.
   * If the Runnable instance was not running, the callback function should be called with `true`.
   * If the Runnable instance was already running, the callback function should be called with `false`.
   */
  protected up(cb: ICallback<boolean>): void {
    this.powerSwitch.commit();
    // Notify all waiting callbacks that we're now up
    this.flushWaitingCallbacks();
    cb(null, true);
  }

  /**
   * Marks the Runnable instance as down and calls the provided callback function.
   *
   * @param {ICallback<boolean>} cb - The callback function to be called after marking the Runnable instance as down.
   * The callback function should be called with a boolean parameter indicating whether the Runnable instance was running or not.
   * If the Runnable instance was not running, the callback function should be called with `true`.
   * If the Runnable instance was already running, the callback function should be called with `false`.
   */
  protected down(cb: ICallback<boolean>): void {
    this.powerSwitch.commit();
    // Notify all waiting callbacks that we're down (with error)
    this.flushWaitingCallbacks(new Error('Runnable is down'));
    cb(null, true);
  }

  /**
   * Handles errors that occur within the Runnable instance.
   * If the Runnable instance is currently running, logs the error and initiates a shutdown.
   *
   * @param err - The error that occurred within the Runnable instance.
   * @returns {void} - This function does not return any value.
   */
  protected handleError(err: Error): void {
    if (this.isRunning()) {
      this.logger.error(err);
      // Notify waiting callbacks before shutdown
      this.flushWaitingCallbacks(err);
      this.shutdown(() => void 0);
    }
  }

  /**
   * Flush all waiting callbacks with the given error (or success if null)
   */
  private flushWaitingCallbacks(error?: Error | null): void {
    const callbacks = this.waitingForUpCallbacks;
    this.waitingForUpCallbacks = [];

    callbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (e) {
        this.logger.error('Error in waiting callback:', e);
      }
    });
  }

  /**
   * Checks if the Runnable instance is currently running or going up.
   *
   * @returns {boolean} - Returns `true` if the Runnable instance is running or going up, `false` otherwise.
   */
  isRunning(): boolean {
    return this.powerSwitch.isRunning() || this.powerSwitch.isGoingUp();
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
   *             If the execution process is successful, the callback will be called with a boolean parameter indicating whether the Runnable instance was running or not.
   *             If the Runnable instance was not running, the callback will be called with `true`.
   *             If the Runnable instance was already running, the callback will be called with `false`.
   */
  run(cb: ICallback<boolean>): void {
    const r = this.powerSwitch.goingUp();
    if (r) {
      const tasks = this.goingUp().map((task) => (cb: ICallback<void>) => {
        if (this.isGoingUp()) {
          this.cleanUpBeforeShutdown = true;
          task(cb);
        } else cb(new AbortError());
      });
      async.series(tasks, (err) => {
        if (this.isRunning()) {
          if (err) {
            if (this.forceShutdownOnError) {
              // Notify waiting callbacks before shutdown
              this.flushWaitingCallbacks(err);
              this.shutdown(() => cb(err));
            } else {
              // Notify waiting callbacks and call original callback
              this.flushWaitingCallbacks(err);
              cb(err);
            }
          } else this.up(cb);
        } else {
          // Notify waiting callbacks before calling the original callback
          this.flushWaitingCallbacks(new AbortError());
          this.shutdown(() => cb(new AbortError()));
        }
      });
    } else {
      // Can't go up, notify any waiting callbacks
      this.flushWaitingCallbacks(
        new Error('Cannot start Runnable - already running'),
      );
      cb(null, r);
    }
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
  shutdown(cb: ICallback<void>): void {
    /*
    down and null -> do nothing
    down and goingUp -> rollback
    up and null -> rollback
    up and goingDown -> do nothing
     */
    if (this.isRunning()) {
      if (this.isGoingUp()) {
        this.powerSwitch.rollback();
        // Notify waiting callbacks about rollback
        this.flushWaitingCallbacks(
          new Error('Runnable startup was rolled back'),
        );
      }
      if (this.isUp()) this.powerSwitch.goingDown();
      const tasks = this.goingDown();
      this.cleanUpBeforeShutdown = false;
      async.series(tasks, () => {
        if (this.cleanUpBeforeShutdown) this.shutdown(cb);
        else this.down(() => cb());
      });
    } else {
      // Notify any remaining waiting callbacks
      this.flushWaitingCallbacks(new Error('Runnable is not running'));
      cb();
    }
  }

  /**
   * Ensures the Runnable instance is running. If it's not running or going up, starts it.
   * Calls the callback when the instance is fully up and running.
   *
   * @param {ICallback<void>} cb - Callback function to be called when the instance is up and running.
   * @returns {void}
   */
  ensureIsRunning(cb: ICallback<void>): void {
    if (this.isUp()) {
      // Already up and running, call callback immediately
      cb();
    } else if (this.isGoingUp()) {
      // Currently going up, add callback to queue
      this.waitingForUpCallbacks.push(cb);
    } else {
      // Not running at all, start it
      this.run((err, wasRunning) => {
        if (err) {
          cb(err);
        } else if (!wasRunning) {
          cb(new Error('Failed to start Runnable instance'));
        } else {
          // Successfully started going up, add callback to queue
          this.waitingForUpCallbacks.push(cb);
        }
      });
    }
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

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { v4 as uuid } from 'uuid';
import { async } from '../async/index.js';
import { ICallback } from '../common/index.js';
import { AbortError } from '../errors/index.js';
import { EventEmitter, TEventEmitterEvent } from '../event/index.js';
import { ILogger } from '../logger/index.js';
import { PowerSwitch } from '../power-switch/index.js';

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
      this.getLogger().error(err);
      this.shutdown(() => void 0);
    }
  }

  /**
   * Retrieves the logger instance associated with the Runnable instance.
   *
   * The `getLogger` method is an abstract method that must be implemented by each subclass of Runnable.
   * It returns an instance of the ILogger interface, which provides logging functionality for the Runnable instance.
   *
   * @returns {ILogger} - An instance of the ILogger interface, providing logging functionality for the Runnable instance.
   */
  protected abstract getLogger(): ILogger;

  /**
   * Checks if the Runnable instance is currently running or going up.
   *
   * @returns {boolean} - Returns `true` if the Runnable instance is running or going up, `false` otherwise.
   */
  isRunning() {
    return this.powerSwitch.isRunning() || this.powerSwitch.isGoingUp();
  }

  /**
   * Checks if the Runnable instance is currently going up.
   *
   * @returns {boolean} - Returns `true` if the Runnable instance is going up, `false` otherwise.
   */
  isGoingUp() {
    return this.powerSwitch.isGoingUp();
  }

  /**
   * Checks if the Runnable instance is currently going down.
   *
   * @returns {boolean} - Returns `true` if the Runnable instance is going down, `false` otherwise.
   */
  isGoingDown() {
    return this.powerSwitch.isGoingDown();
  }

  /**
   * Checks if the Runnable instance is currently up.
   *
   * @returns {boolean} - Returns `true` if the Runnable instance is up, `false` otherwise.
   */
  isUp() {
    return this.powerSwitch.isUp();
  }

  /**
   * Checks if the Runnable instance is currently down.
   *
   * @returns {boolean} - Returns `true` if the Runnable instance is down, `false` otherwise.
   */
  isDown() {
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
      async.waterfall(tasks, (err) => {
        if (this.isRunning()) {
          if (err) {
            if (this.forceShutdownOnError) this.shutdown(() => cb(err));
            else cb(err);
          } else this.up(cb);
        } else this.shutdown(() => cb(new AbortError()));
      });
    } else cb(null, r);
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
      if (this.isGoingUp()) this.powerSwitch.rollback();
      if (this.isUp()) this.powerSwitch.goingDown();
      const tasks = this.goingDown();
      this.cleanUpBeforeShutdown = false;
      async.waterfall(tasks, () => {
        if (this.cleanUpBeforeShutdown) this.shutdown(cb);
        else this.down(() => cb());
      });
    } else cb();
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

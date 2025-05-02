/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

// type-coverage:ignore-file

import { ICallback } from './types/callback.js';

/**
 * Executes an array of functions in sequence, where each function receives the result
 * of the previous function as its first argument.
 *
 * The first function receives only a callback, while subsequent functions
 * receive the result of the previous function and a callback.
 *
 * @param tasks An array of functions to execute in sequence
 * @param callback A callback to run after all functions complete or an error occurs
 */

// Empty tasks array
// @ts-expect-error TS2394
export function waterfall(tasks: [], callback: ICallback<void>): void;

// One task
export function waterfall<R1>(
  tasks: [(cb: ICallback<R1>) => void],
  callback: ICallback<R1>,
): void;

// Two tasks
export function waterfall<R1, R2>(
  tasks: [(cb: ICallback<R1>) => void, (arg: R1, cb: ICallback<R2>) => void],
  callback: ICallback<R2>,
): void;

// Three tasks
export function waterfall<R1, R2, R3>(
  tasks: [
    (cb: ICallback<R1>) => void,
    (arg: R1, cb: ICallback<R2>) => void,
    (arg: R2, cb: ICallback<R3>) => void,
  ],
  callback: ICallback<R3>,
): void;

// Four tasks
export function waterfall<R1, R2, R3, R4>(
  tasks: [
    (cb: ICallback<R1>) => void,
    (arg: R1, cb: ICallback<R2>) => void,
    (arg: R2, cb: ICallback<R3>) => void,
    (arg: R3, cb: ICallback<R4>) => void,
  ],
  callback: ICallback<R4>,
): void;

// Five tasks
export function waterfall<R1, R2, R3, R4, R5>(
  tasks: [
    (cb: ICallback<R1>) => void,
    (arg: R1, cb: ICallback<R2>) => void,
    (arg: R2, cb: ICallback<R3>) => void,
    (arg: R3, cb: ICallback<R4>) => void,
    (arg: R4, cb: ICallback<R5>) => void,
  ],
  callback: ICallback<R5>,
): void;

// Six tasks
export function waterfall<R1, R2, R3, R4, R5, R6>(
  tasks: [
    (cb: ICallback<R1>) => void,
    (arg: R1, cb: ICallback<R2>) => void,
    (arg: R2, cb: ICallback<R3>) => void,
    (arg: R3, cb: ICallback<R4>) => void,
    (arg: R4, cb: ICallback<R5>) => void,
    (arg: R5, cb: ICallback<R6>) => void,
  ],
  callback: ICallback<R6>,
): void;

// Seven tasks
export function waterfall<R1, R2, R3, R4, R5, R6, R7>(
  tasks: [
    (cb: ICallback<R1>) => void,
    (arg: R1, cb: ICallback<R2>) => void,
    (arg: R2, cb: ICallback<R3>) => void,
    (arg: R3, cb: ICallback<R4>) => void,
    (arg: R4, cb: ICallback<R5>) => void,
    (arg: R5, cb: ICallback<R6>) => void,
    (arg: R6, cb: ICallback<R7>) => void,
  ],
  callback: ICallback<R7>,
): void;

// Eight tasks
export function waterfall<R1, R2, R3, R4, R5, R6, R7, R8>(
  tasks: [
    (cb: ICallback<R1>) => void,
    (arg: R1, cb: ICallback<R2>) => void,
    (arg: R2, cb: ICallback<R3>) => void,
    (arg: R3, cb: ICallback<R4>) => void,
    (arg: R4, cb: ICallback<R5>) => void,
    (arg: R5, cb: ICallback<R6>) => void,
    (arg: R6, cb: ICallback<R7>) => void,
    (arg: R7, cb: ICallback<R8>) => void,
  ],
  callback: ICallback<R8>,
): void;

// Nine tasks
export function waterfall<R1, R2, R3, R4, R5, R6, R7, R8, R9>(
  tasks: [
    (cb: ICallback<R1>) => void,
    (arg: R1, cb: ICallback<R2>) => void,
    (arg: R2, cb: ICallback<R3>) => void,
    (arg: R3, cb: ICallback<R4>) => void,
    (arg: R4, cb: ICallback<R5>) => void,
    (arg: R5, cb: ICallback<R6>) => void,
    (arg: R6, cb: ICallback<R7>) => void,
    (arg: R7, cb: ICallback<R8>) => void,
    (arg: R8, cb: ICallback<R9>) => void,
  ],
  callback: ICallback<R9>,
): void;

// Ten tasks
export function waterfall<R1, R2, R3, R4, R5, R6, R7, R8, R9, R10>(
  tasks: [
    (cb: ICallback<R1>) => void,
    (arg: R1, cb: ICallback<R2>) => void,
    (arg: R2, cb: ICallback<R3>) => void,
    (arg: R3, cb: ICallback<R4>) => void,
    (arg: R4, cb: ICallback<R5>) => void,
    (arg: R5, cb: ICallback<R6>) => void,
    (arg: R6, cb: ICallback<R7>) => void,
    (arg: R7, cb: ICallback<R8>) => void,
    (arg: R8, cb: ICallback<R9>) => void,
    (arg: R9, cb: ICallback<R10>) => void,
  ],
  callback: ICallback<R10>,
): void;

// Implementation signature that's compatible with all overloads
export function waterfall(
  tasks: ((...args: unknown[]) => void)[],
  callback: ICallback<unknown>,
): void {
  if (!Array.isArray(tasks)) {
    return callback(
      new Error('First argument to waterfall must be an array of functions'),
    );
  }

  if (tasks.length === 0) {
    return callback();
  }

  let taskIndex = 0;

  function nextTask(error?: Error | null, result?: unknown): void {
    if (error) {
      return callback(error);
    }

    taskIndex = taskIndex + 1;

    // If all tasks are done, call the final callback
    if (taskIndex >= tasks.length) {
      return callback(null, result);
    }

    // Schedule next task asynchronously to prevent stack overflow
    setImmediate(() => {
      try {
        // Call the next task with the result from the previous task
        if (taskIndex === 0) {
          tasks[taskIndex](nextTask);
        } else {
          tasks[taskIndex](result, nextTask);
        }
      } catch (err) {
        callback(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  try {
    // Start with the first task
    tasks[0](nextTask);
  } catch (err) {
    callback(err instanceof Error ? err : new Error(String(err)));
  }
}

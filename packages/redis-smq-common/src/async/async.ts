/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, TFunction } from '../common/index.js';

/**
 * Iterates over each element in an array asynchronously.
 *
 * This function applies an iteratee function to each item in the collection
 * one at a time, in a non-blocking manner using setTimeout to prevent call stack overflow.
 * The iteration continues until all items are processed or an error occurs.
 *
 * @template T - The type of elements in the array
 * @param {T[]} collection - The array to iterate over
 * @param {function} iteratee - The function to apply to each item
 * @param {function} callback - The callback function called after all items have been processed or when an error occurs
 * @returns {void}
 */
const eachOf = <T>(
  collection: T[],
  iteratee: (item: T, key: number, callback: ICallback<void>) => void,
  callback: ICallback<void>,
): void => {
  if (collection.length) {
    let idx = 0;
    const iterate = () => {
      iteratee(collection[idx], idx, (err) => {
        idx += 1;
        if (err || idx >= collection.length) callback(err);
        else setTimeout(() => iterate(), 0);
      });
    };
    iterate();
  } else {
    callback();
  }
};

/**
 * Iterates over each property in an object asynchronously.
 *
 * This function applies an iteratee function to each property in the object
 * one at a time, in a non-blocking manner using setTimeout to prevent call stack overflow.
 * The iteration continues until all properties are processed or an error occurs.
 *
 * @template T - The type of values in the object
 * @param {Record<string, T>} collection - The object to iterate over
 * @param {function} iteratee - The function to apply to each property
 * @param {function} callback - The callback function called after all properties have been processed or when an error occurs
 * @returns {void}
 */
const eachIn = <T>(
  collection: Record<string, T>,
  iteratee: (item: T, key: string, callback: ICallback<void>) => void,
  callback: ICallback<void>,
): void => {
  const keys = Object.keys(collection);
  if (keys.length) {
    let idx = 0;
    const iterate = () => {
      const key = keys[idx];
      iteratee(collection[key], key, (err) => {
        idx += 1;
        if (err || idx >= keys.length) callback(err);
        else setTimeout(() => iterate(), 0);
      });
    };
    iterate();
  } else callback();
};

/**
 * Iterates over each element or property in a collection (array or object) asynchronously.
 *
 * This function applies an iteratee function to each item or property in the collection
 * one at a time, in a non-blocking manner using setTimeout to prevent call stack overflow.
 * The iteration continues until all items or properties are processed or an error occurs.
 *
 * @template T - The type of elements or values in the collection
 * @param {T[] | Record<string, T>} collection - The array or object to iterate over
 * @param {function} iteratee - The function to apply to each item or property
 * @param {function} callback - The callback function called after all items or properties have been processed or when an error occurs
 * @returns {void}
 */
const each = <T>(
  collection: T[] | Record<string, T>,
  iteratee: (item: T, key: number | string, callback: ICallback<void>) => void,
  callback: ICallback<void>,
): void => {
  if (Array.isArray(collection)) eachOf(collection, iteratee, callback);
  else eachIn(collection, iteratee, callback);
};

/**
 * Executes an array of tasks in a waterfall pattern, passing the result of each task to the next.
 *
 * This function takes an array of tasks, where each task is a function that accepts a variable number of arguments,
 * and a callback function. The tasks are executed in the order they are provided, and the result of each task is passed
 * to the next task. If an error occurs during the execution of a task, the waterfall process is stopped, and the
 * callback function is invoked with the error.
 *
 * @template T - The type of the result returned by the tasks.
 * @param {TFunction[]} tasks - An array of functions to execute in a waterfall pattern.
 * @param {ICallback<T>} callback - A callback function to be invoked after all tasks have been executed or an error occurs.
 * @returns {void}
 */
const waterfall = <T>(tasks: TFunction[], callback: ICallback<T>): void => {
  if (tasks.length) {
    let idx = 0;
    const exec = (
      err?: Error | null,
      ...args: [result: T, ...rest: unknown[]]
    ): void => {
      idx += 1;
      if (err) {
        callback(err);
      } else if (idx < tasks.length) {
        setTimeout(() => {
          if (args.length) tasks[idx](...args, exec);
          else tasks[idx](exec);
        }, 0);
      } else if (args.length) {
        callback(null, args[0]);
      } else callback();
    };
    tasks[idx](exec);
  } else callback();
};

export const async = {
  each,
  eachIn,
  eachOf,
  waterfall,
};

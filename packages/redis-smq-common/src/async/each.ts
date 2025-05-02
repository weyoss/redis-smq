/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { eachIn } from './each-in.js';
import { eachOf } from './each-of.js';
import { ICallback } from './types/index.js';

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
export const each = <T>(
  collection: T[] | Record<string, T>,
  iteratee: (item: T, key: number | string, callback: ICallback<void>) => void,
  callback: ICallback<void>,
): void => {
  if (Array.isArray(collection)) eachOf(collection, iteratee, callback);
  else eachIn(collection, iteratee, callback);
};

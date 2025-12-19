/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from './types/index.js';

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
export const eachOf = <T>(
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

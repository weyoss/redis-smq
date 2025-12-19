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
export const eachIn = <T>(
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

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { dirname } from 'path';
import { PanicError } from '../errors/index.js';

function isStackTraces(stack: unknown): stack is NodeJS.CallSite[] {
  return !!(stack && Array.isArray(stack));
}

export function getDirname(): string {
  const prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (
    err: Error,
    stackTraces: NodeJS.CallSite[],
  ): NodeJS.CallSite[] => {
    return stackTraces;
  };
  const err = new Error();
  const stack: unknown = err.stack;
  Error.prepareStackTrace = prepareStackTrace;
  if (isStackTraces(stack)) {
    const filename = stack[1].getFileName();
    if (filename) {
      const cleanFilename = filename.startsWith('file://')
        ? filename.substring(7)
        : filename;
      return dirname(cleanFilename);
    }
  }
  throw new PanicError(`Could not get current dir`);
}

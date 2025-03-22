/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { dirname } from 'path';

function isStackTraces(stack: unknown): stack is NodeJS.CallSite[] {
  return Array.isArray(stack);
}

export function getDirname(): string {
  const originalPrepareStackTrace = Error.prepareStackTrace;

  try {
    // Temporarily override prepareStackTrace to extract stack traces
    Error.prepareStackTrace = (
      _: Error,
      stackTraces: NodeJS.CallSite[],
    ): NodeJS.CallSite[] => stackTraces;

    const err = new Error();
    const stack = err.stack;

    if (!isStackTraces(stack) || stack.length < 2) {
      throw new Error('Invalid stack trace');
    }

    const callSite = stack[1];
    const filename = callSite.getFileName();

    if (!filename) {
      throw new Error('Unable to determine filename from stack trace');
    }

    // Normalize filename to remove 'file://' prefix if present
    const cleanFilename = filename.startsWith('file://')
      ? filename.slice(7)
      : filename;

    return dirname(cleanFilename);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get current directory: ${errorMessage}`);
  } finally {
    // Restore the original prepareStackTrace function
    Error.prepareStackTrace = originalPrepareStackTrace;
  }
}

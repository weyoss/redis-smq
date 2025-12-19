/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

function isNonNullObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function hasStringMessage(value: unknown): value is { message: string } {
  if (!isNonNullObject(value)) return false;
  if (!('message' in value)) return false;
  return typeof value.message === 'string';
}

function hasObjectDetails(value: unknown): value is { details: object } {
  if (!isNonNullObject(value)) return false;
  if (!('details' in value)) return false;
  return typeof value.details === 'object' && value.details !== null;
}

export function getErrorMessage(error: unknown): {
  message: string;
  details?: object;
} | null {
  // Null/undefined => no error
  if (error == null) return null;

  // String errors (ignore empty/whitespace-only)
  if (typeof error === 'string') {
    const message = error.trim();
    return message ? { message } : null;
  }

  // Native Error instances
  if (error instanceof Error) {
    return {
      message: error.message?.trim() || error.name || 'Unknown error',
      details: {
        name: error.name,
        stack: error.stack ?? undefined,
      },
    };
  }

  // Plain objects with a string message (and optional details object)
  if (hasStringMessage(error)) {
    const result: { message: string; details?: object } = {
      message: error.message.trim(),
    };
    if (result.message) {
      if (hasObjectDetails(error)) {
        result.details = error.details;
      }
      return result;
    }
  }

  // Fallback
  return { message: 'An unexpected error occurred' };
}

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '@/lib/error';

describe('getErrorMessage', () => {
  it('returns empty string for nullish', () => {
    expect(getErrorMessage(null)).toBe('');
    expect(getErrorMessage(undefined)).toBe('');
  });

  it('returns plain strings unchanged', () => {
    expect(getErrorMessage('boom')).toBe('boom');
  });

  it('unwraps Error instances', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('unwraps API envelopes', () => {
    expect(
      getErrorMessage({ error: { code: 400, message: 'Bad request' } }),
    ).toBe('Bad request');
  });

  it('unwraps axios-style errors', () => {
    expect(
      getErrorMessage({
        response: { data: { error: { code: 500, message: 'Server error' } } },
      }),
    ).toBe('Server error');
  });

  it('falls back for unknown shapes', () => {
    expect(getErrorMessage({ weird: true })).toBe(
      'An unexpected error occurred',
    );
  });
});

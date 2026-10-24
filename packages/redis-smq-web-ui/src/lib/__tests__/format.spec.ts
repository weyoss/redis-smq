/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import {
  formatCompact,
  formatDuration,
  formatNumber,
  formatSince,
} from '@/lib/format';

describe('format', () => {
  it('formatCompact handles values', () => {
    expect(formatCompact(1234)).toBe('1.2K');
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(null)).toBe('0');
    expect(formatCompact(undefined)).toBe('0');
  });

  it('formatNumber adds separators', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(null)).toBe('0');
  });

  it('formatSince returns relative time', () => {
    expect(formatSince(null)).toBe('—');
    expect(formatSince(Date.now() - 30_000)).toBe('30s ago');
    expect(formatSince(Date.now() - 5 * 60_000)).toBe('5m ago');
  });

  it('formatDuration switches units', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(5_000)).toBe('5s');
    expect(formatDuration(90_000)).toBe('1m');
    expect(formatDuration(3_600_000)).toBe('1h');
    expect(formatDuration(86_400_000)).toBe('1d');
  });
});

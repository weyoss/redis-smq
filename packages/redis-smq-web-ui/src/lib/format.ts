/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Formats a number into a compact, human-readable string.
 * - Uses 'K' for thousands, 'M' for millions, etc.
 * - Handles non-number inputs gracefully.
 *
 * @param {number | undefined | null} num - The number to format.
 * @returns {string} The formatted number string, or '0' if the input is invalid.
 */
export function formatNumber(num: number | undefined | null): string {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  // Use the Intl.NumberFormat API for modern, locale-aware formatting.
  // The 'compact' notation is ideal for dashboard stats.
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num);
}

export function formatDateSince(millis: number): string {
  const time = Date.now() - millis;
  const seconds = Math.floor(time / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function formatDate(dateStringOrMillis?: string | number | null) {
  if (!dateStringOrMillis) return 'N/A';
  try {
    const date =
      typeof dateStringOrMillis === 'string'
        ? parseISO(dateStringOrMillis)
        : new Date(dateStringOrMillis);
    return `${date.toLocaleString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
  } catch {
    return 'Invalid Date';
  }
}

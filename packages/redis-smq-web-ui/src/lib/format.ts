/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

const COMPACT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

const FULL = new Intl.NumberFormat('en-US');

export function formatCompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '0';
  return COMPACT.format(n);
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '0';
  return FULL.format(n);
}

export function formatDate(ts: number | string | null | undefined): string {
  if (ts == null) return '—';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export function formatSince(ts: number | null | undefined): string {
  if (ts == null) return '—';
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

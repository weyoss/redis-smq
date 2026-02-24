/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * TTL = 120_000
 * BASE_INTERVAL = TTL / 3 = 40_000 // beat 3 times within TTL window
 * MAX_BACKOFF = TTL * 0.6 = 72_000 // backoff up to 60% of TTL
 * SAFETY_MARGIN = TTL - maxBackoff - interval = 8_000
 */
export function _calculateConfigFromTTL(ttl: number) {
  if (ttl <= 3_000) throw new Error(`Heartbeat TTL is too small`);

  const interval = Math.floor(ttl / 3); // Beat 3 times
  const maxBackoff = Math.floor(ttl * 0.66); // Use 66% of TTL
  const safetyMargin = ttl - maxBackoff - interval;

  return { interval, maxBackoff, ttl, safetyMargin };
}

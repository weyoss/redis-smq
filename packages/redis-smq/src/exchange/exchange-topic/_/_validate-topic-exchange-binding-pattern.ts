/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

// Precompiled regex for literal token:
// - starts with an alphabetic char
// - then alphanumerics
// - '-' or '_' allowed only between alphanumerics (not at start/end, not consecutive)
const LITERAL_TOKEN_RE = /^[A-Za-z][A-Za-z0-9]*(?:[-_][A-Za-z0-9]+)*$/;

/**
 * Validate AMQP-like topic pattern:
 * - Tokens separated by '.'
 * - Each token is one of:
 *   - '*' (matches exactly one token)
 *   - '#' (matches zero or more tokens)
 *   - literal token matching LITERAL_TOKEN_RE
 * - No empty tokens (i.e., no leading/trailing/double '.')
 */
export function _validateTopicExchangeBindingPattern(p: unknown): boolean {
  if (typeof p !== 'string' || p.length === 0) return false;

  const tokens = p.split('.');
  // No empty tokens; disallow leading/trailing/double dots
  if (tokens.some((t) => t.length === 0)) return false;

  for (const tok of tokens) {
    if (tok === '*' || tok === '#') continue;
    if (!LITERAL_TOKEN_RE.test(tok)) return false;
  }
  return true;
}

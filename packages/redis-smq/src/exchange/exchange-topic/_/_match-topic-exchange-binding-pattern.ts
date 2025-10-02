/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Compile an AMQP-like topic pattern to a RegExp.
 * - "." separates tokens
 * - "*" matches exactly one token (no dots)
 * - "#" matches zero or more tokens (can span dots)
 */
function compileTopicPattern(pattern: string): RegExp {
  const tokens = pattern.length ? pattern.split('.') : [];
  const esc = (s: string) => s.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');

  let re = '^';
  let prevWasHash = false;

  tokens.forEach((tok, idx) => {
    if (tok === '#') {
      re += idx === 0 ? '(?:[^.]+(?:\\.[^.]+)*)?' : '(?:\\.[^.]+)*';
      prevWasHash = true;
      return;
    }

    if (idx > 0) {
      re += prevWasHash ? '(?:\\.)?' : '\\.';
    }
    prevWasHash = false;

    if (tok === '*') re += '[^.]+';
    else re += esc(tok);
  });

  re += '$';
  return new RegExp(re);
}

export function _matchTopicExchangeBindingPattern(
  routingKey: string,
  pattern: string,
): boolean {
  return compileTopicPattern(pattern).test(routingKey);
}

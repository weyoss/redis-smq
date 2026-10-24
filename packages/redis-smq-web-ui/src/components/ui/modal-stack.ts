/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export const modalStack: symbol[] = [];

function getCount(): number {
  return Number(document.body.dataset.modalCount ?? '0');
}

export function lockScroll(): void {
  document.body.dataset.modalCount = String(getCount() + 1);
  document.body.style.overflow = 'hidden';
}

export function unlockScroll(): void {
  const next = Math.max(0, getCount() - 1);
  document.body.dataset.modalCount = String(next);
  if (next === 0) document.body.style.overflow = '';
}

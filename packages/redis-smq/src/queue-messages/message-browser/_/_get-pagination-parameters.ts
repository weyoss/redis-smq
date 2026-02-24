/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IBrowserPageInfo } from '../types/index.js';

export function _getPaginationParameters(
  page: number,
  totalItems: number,
  pageSize: number,
): IBrowserPageInfo {
  // Ensure valid inputs
  if (pageSize <= 0) pageSize = 10;
  if (page < 1) page = 1;

  // Handle edge case: no items
  if (totalItems <= 0) {
    return {
      offsetStart: 0,
      offsetEnd: -1,
      currentPage: 1,
      totalPages: 1,
      pageSize,
    };
  }

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.min(page, totalPages);

  // Calculate Redis-style inclusive range
  const offsetStart = (currentPage - 1) * pageSize;
  const offsetEnd = Math.min(offsetStart + pageSize, totalItems) - 1;

  return {
    offsetStart,
    offsetEnd,
    currentPage,
    totalPages,
    pageSize,
  };
}

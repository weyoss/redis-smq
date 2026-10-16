/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { TErrors } from '../../../errors/index.js';

/**
 * Response shape of `DELETE /api/namespaces/:ns`.
 *
 * Deleting a namespace requires every resource under it to be
 * deletable. The error list reflects that precondition: a namespace
 * whose queues still hold messages, have active consumers, or have
 * bound exchanges is rejected rather than force-deleted. The caller
 * is expected to empty and unbind resources first.
 */
export type DeleteNamespaceControllerResponseDTO =
  | readonly [204, null]
  | TErrors['InvalidNamespaceError']
  | TErrors['NamespaceNotFoundError']
  | TErrors['QueueNotFoundError']
  | TErrors['QueueNotEmptyError']
  | TErrors['QueueHasActiveConsumersError']
  | TErrors['QueueHasBoundExchangesError']
  | TErrors['ConsumerSetMismatchError']
  | TErrors['UnexpectedScriptReplyError'];

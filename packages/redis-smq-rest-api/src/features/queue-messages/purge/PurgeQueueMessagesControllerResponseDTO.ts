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
 * `purge()` enqueues a background job that deletes messages in
 * batches. The HTTP handler returns as soon as the job is scheduled —
 * not when the messages are gone. `202 Accepted` is the correct
 * status for "the operation has been accepted for processing but
 * has not completed."
 *
 * The previous version of this endpoint returned 204, which is
 * semantically wrong: 204 means "successful and there is nothing to
 * return," implying the deletion was complete by the time the
 * response arrived. Clients had no way to know when the purge
 * actually finished except by polling the message count until it
 * reached zero — an implicit contract not stated in any schema.
 */
export type PurgeQueueMessagesControllerResponseDTO =
  | readonly [202, { jobId: string }]
  | TErrors['InvalidQueueParametersError']
  | TErrors['ConsumerGroupRequiredError']
  | TErrors['ConsumerGroupsNotSupportedError']
  | TErrors['QueueNotFoundError']
  | TErrors['AcknowledgmentAuditDisabledError']
  | TErrors['DeadLetterAuditDisabledError']
  | TErrors['QueueLockedError'];

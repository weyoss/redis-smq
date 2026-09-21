/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { MessageEnvelope } from '../../message/message-envelope.js';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementAction,
  EMessageUnacknowledgementCause,
} from '../../../contracts/index.js';

/**
 * How a failed message should be resolved.
 *
 * A discriminated union over the resolution action. The action determines
 * which fields are present:
 *
 *   - `REQUEUE` and `DELAY` carry only the cause and the action. The
 *     message is re-enqueued for another attempt, immediately or after
 *     the configured delay.
 *
 *   - `DEAD_LETTER` carries the cause, the action, and a
 *     `deadLetterCause` that distinguishes the three paths into the
 *     dead-letter list (TTL expiry, retry-threshold exhaustion, or
 *     periodic-message termination).
 *
 * Produced by `MessageUnacknowledger.getResolution` for each failed
 * message. Consumed by `_executeUnacknowledgementScript`, which
 * serializes the action into the unacknowledgement Lua script's
 * arguments.
 *
 * Not part of the public API. A user inspecting an unacknowledgement
 * sees the flat fields on `IMessageUnacknowledgementRecord` or the
 * event payload on `consumer.messageUnacknowledged`.
 */
export type TUnacknowledgementResolution =
  | {
      cause: EMessageUnacknowledgementCause;
      action:
        | EMessageUnacknowledgementAction.REQUEUE
        | EMessageUnacknowledgementAction.DELAY;
    }
  | {
      cause: EMessageUnacknowledgementCause;
      action: EMessageUnacknowledgementAction.DEAD_LETTER;
      deadLetterCause: EMessageDeadLetterCause;
    };

/**
 * The result of a batched unacknowledgement.
 *
 * Maps each unacknowledged message's ID to the resolution the pipeline
 * applied to it. Produced by `_executeUnacknowledgementScript` and
 * consumed by `AcknowledgementPipeline`, which iterates the map to emit
 * per-message events (`messageUnacknowledged`, plus one of
 * `messageDeadLettered`, `messageRequeued`, `messageDelayed`).
 *
 * Empty when the batch contained no resolvable messages — for example,
 * if every message in the batch was already gone from the processing
 * queue by the time the script ran.
 *
 * Not part of the public API.
 */
export type TUnacknowledgementResult = Record<
  string,
  TUnacknowledgementResolution
>;

/**
 * The pipeline's in-flight unacknowledgement batch.
 *
 * Accumulates messages and their resolutions between flushes. When the
 * batch reaches `consumerOptions.batchUnacks.batchSize`, or when the
 * `batchTimeoutMs` elapses, the batch is flushed to
 * `_executeUnacknowledgementScript` and the result is delivered to every
 * callback registered in `callbacks`.
 *
 * The `timer` field holds the pending flush timer while a batch is
 * accumulating; it is cleared when the batch flushes.
 *
 * Not part of the public API. Internal to `MessageUnacknowledger`.
 */
export type TUnacknowledgementBatch = {
  messages: {
    message: MessageEnvelope;
    resolution: TUnacknowledgementResolution;
  }[];
  callbacks: ICallback<TUnacknowledgementResult>[];
  timer: NodeJS.Timeout | null;
};

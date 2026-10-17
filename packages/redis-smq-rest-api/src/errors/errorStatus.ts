/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { errors } from 'redis-smq';
import { InvalidApiServerParamsError } from './InvalidApiServerParamsError.js';
import { RequestValidationError } from './RequestValidationError.js';
import { ResponseValidationError } from './ResponseValidationError.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ErrorConstructor = abstract new (...args: any[]) => Error;

/**
 * HTTP status for every error class exported by `redis-smq`.
 *
 * The `satisfies Record<keyof typeof errors, number>` clause is the
 * whole design: it forces this object to have **exactly** the keys
 * `redis-smq` exports. Not one missing, not one extra.
 *
 *   - A new error in a future `redis-smq` release fails the build
 *     until a status is added here.
 *   - A typo in a key (say, `QueueNotFoundErrorr`) fails the build
 *     because that name isn't in `errors`.
 *
 * Both failures point at this file, one line from the fix.
 *
 * The class references do not appear here. They're looked up by name
 * from `errors` at map-construction time (below). That's why there's
 * only one string per error in the entire package.
 */
const redisSmqStatuses = {
  // 400 — Bad Request
  BackgroundJobNotFoundError: 400,
  BackgroundJobWorkerNotFoundError: 400,
  ConfigurationNotFoundError: 400,
  ConsumerGroupNotFoundError: 400,
  ExchangeNotFoundError: 400,
  ExchangeRequiredError: 400,
  InvalidConfigurationError: 400,
  InvalidConsumerGroupIdError: 400,
  InvalidCronExpressionError: 400,
  InvalidDirectExchangeParametersError: 400,
  InvalidExchangeParametersError: 400,
  InvalidExchangeRoutingKeyError: 400,
  InvalidFanoutExchangeParametersError: 400,
  InvalidMessageAuditHistorySizeError: 400,
  InvalidMessageAuditQueueSizeError: 400,
  InvalidMessageHandlerSignatureError: 400,
  InvalidMessageHandlerTypeError: 400,
  InvalidNamespaceError: 400,
  InvalidPurgeQueueJobIdError: 400,
  InvalidQueueLockIdError: 400,
  InvalidQueueParametersError: 400,
  InvalidQueueStateError: 400,
  InvalidRateLimitIntervalError: 400,
  InvalidRateLimitValueError: 400,
  InvalidRedisKeyError: 400,
  InvalidSchedulingParametersError: 400,
  InvalidTopicBindingPatternError: 400,
  InvalidTopicExchangeParamsError: 400,
  MessageExchangeRequiredError: 400,
  MessageHandlerFileError: 400,
  MessageHandlerFilenameExtensionError: 400,
  MessageNotFoundError: 400,
  MessagePriorityRequiredError: 400,
  MessagePropertyInvalidValueError: 400,
  NamespaceNotFoundError: 400,
  ProducerNotRunningError: 400,
  QueueHasNoConsumerGroupsError: 400,
  QueueNotFoundError: 400,
  RoutingKeyRequiredError: 400,

  // 403 — Forbidden
  BackgroundJobCanceledError: 403,
  BackgroundJobNotCancellableError: 403,
  BackgroundJobNotCompletableError: 403,
  BackgroundJobNotFailableError: 403,
  BackgroundJobNotStartableError: 403,
  BackgroundJobTargetLockedError: 403,
  ConsumerSetMismatchError: 403,
  NamespaceMismatchError: 403,
  QueueLockOwnerMismatchError: 403,
  QueueLockedError: 403,
  QueueNotActiveError: 403,
  QueueNotLockedError: 403,
  QueueOperationForbiddenError: 403,
  QueuePausedError: 403,
  QueueStoppedError: 403,

  // 409 — Conflict
  BackgroundJobAlreadyExistsError: 409,
  ConsumerGroupHasActiveConsumersError: 409,
  ExchangeAlreadyExistsError: 409,
  ExchangeHasBoundQueuesError: 409,
  MessageAlreadyExistsError: 409,
  MessageHandlerAlreadyExistsError: 409,
  QueueAlreadyBeingPurgedError: 409,
  QueueAlreadyBoundError: 409,
  QueueAlreadyExistsError: 409,
  QueueHasBoundExchangesError: 409,

  // 412 — Precondition Failed
  AcknowledgmentAuditDisabledError: 412,
  ConsumerGroupNotEmptyError: 412,
  ConsumerGroupRequiredError: 412,
  DeadLetterAuditDisabledError: 412,
  MessageDestinationQueueAlreadySetError: 412,
  MessageDestinationQueueRequiredError: 412,
  MessageNotRequeuableError: 412,
  PriorityQueuingNotEnabledError: 412,
  ProcessingQueueNotEmptyError: 412,
  QueueHasActiveConsumersError: 412,
  QueueNotBoundError: 412,
  QueueNotEmptyError: 412,
  UnacknowledgmentHistoryDisabledError: 412,

  // 422 — Unprocessable Entity
  ConfigurationMessageAuditExpireError: 422,
  ConfigurationNamespaceError: 422,
  ConfigurationUpdateError: 422,
  ConsumerGroupsNotSupportedError: 422,
  ExchangeQueuePolicyMismatchError: 422,
  ExchangeTypeMismatchError: 422,
  InvalidQueueTypeError: 422,
  NoMatchingQueuesError: 422,
  QueueStateTransitionError: 422,
  RequeueMessageScriptError: 422,
  ScriptResultMismatchError: 422,

  // 500 — Internal Server Error
  UnexpectedScriptReplyError: 500,
} as const satisfies Record<keyof typeof errors, number>;

/**
 * HTTP status for errors this package raises on its own behalf.
 *
 * Kept in a separate object because these classes don't exist on
 * `redis-smq`'s `errors` export and can't be validated against it.
 * Their completeness is a manual concern — the object is small and
 * the three classes are in this folder.
 */
const packageStatuses = {
  InvalidApiServerParamsError: 500,
  RequestValidationError: 400,
  ResponseValidationError: 500,
} as const;

/**
 * Class references for the package errors, keyed by the names in
 * `packageStatuses`. The `satisfies` clause ensures every name in
 * `packageStatuses` has a matching class here — a typo in either
 * object fails the build.
 */
const packageClasses = {
  InvalidApiServerParamsError,
  RequestValidationError,
  ResponseValidationError,
} as const satisfies Record<keyof typeof packageStatuses, ErrorConstructor>;

/**
 * Runtime lookup: class reference → HTTP status.
 *
 * Built at module load from the two status tables above. Class
 * references are resolved by name — `errors[name]` for redis-smq
 * errors, `packageClasses[name]` for package errors — so no class
 * is written twice in the source.
 *
 * Iteration order follows insertion order: redis-smq errors first
 * (in the order they appear in `redisSmqStatuses`), then package
 * errors. `instanceof` checks against these must consider subclass
 * relationships if any ever appear; none exist today.
 */
export const errorStatusMap: ReadonlyMap<ErrorConstructor, number> = new Map([
  ...(Object.entries(redisSmqStatuses) as [keyof typeof errors, number][]).map(
    ([name, status]) => [errors[name], status] as [ErrorConstructor, number],
  ),
  ...(
    Object.entries(packageStatuses) as [keyof typeof packageStatuses, number][]
  ).map(
    ([name, status]) =>
      [packageClasses[name], status] as [ErrorConstructor, number],
  ),
]);

/**
 * Resolves the HTTP status for a thrown error, or `null` if the error
 * is not a known class.
 *
 * The parameter is `unknown` so this function is safe to call before
 * any type-narrowing guard — a non-Error value simply doesn't match
 * any class and yields `null`.
 */
export function getHttpStatus(error: unknown): number | null {
  for (const [ctor, status] of errorStatusMap) {
    if (error instanceof ctor) return status;
  }
  return null;
}

/**
 * Response-DTO type. For every error name, produces a `readonly
 * [status, name]` tuple with both slots as literals.
 *
 *   TErrors['QueueNotFoundError']       = readonly [400, 'QueueNotFoundError']
 *   TErrors['QueueAlreadyExistsError']  = readonly [409, 'QueueAlreadyExistsError']
 *
 * Both halves are derived from the same status tables that build the
 * runtime map, so a DTO's declared error branch can't disagree with
 * the status the handler will actually emit.
 *
 * ## What this buys over inlining tuples in DTOs
 *
 *   - **Status changes are one edit.** If `QueueNotFoundError` moves
 *     from 400 to 404, change `redisSmqStatuses` once. Every DTO that
 *     references `TErrors['QueueNotFoundError']` reflects the change
 *     automatically.
 *
 *   - **Misspellings fail the build.** `TErrors['QueueNotFoundErr']`
 *     is a compile error. An inlined `readonly [400, 'QueueNotFoundErr']`
 *     is not — the string literal is just a string.
 *
 *   - **DTO responses and OpenAPI schemas stay in sync.** The
 *     `ts-json-schema-generator` reads `TErrors['X']` and emits
 *     `{ "const": 400 }` and `{ "const": "QueueNotFoundError" }`. Both
 *     halves come from the map's entry.
 */
export type TErrors = {
  [K in keyof typeof redisSmqStatuses]: readonly [
    (typeof redisSmqStatuses)[K],
    K,
  ];
} & {
  [K in keyof typeof packageStatuses]: readonly [
    (typeof packageStatuses)[K],
    K,
  ];
};

/** Every error name in the map, as a string-literal union. */
export type TErrorName = keyof TErrors;

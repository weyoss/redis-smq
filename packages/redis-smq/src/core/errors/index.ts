/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

// Background jobs
export * from './background-jobs/background-job-already-exists.error.js';
export * from './background-jobs/background-job-canceled.error.js';
export * from './background-jobs/background-job-not-cancellable.error.js';
export * from './background-jobs/background-job-not-completable.error.js';
export * from './background-jobs/background-job-not-failable.error.js';
export * from './background-jobs/background-job-not-found.error.js';
export * from './background-jobs/background-job-not-startable.error.js';
export * from './background-jobs/background-job-target-locked.error.js';
export * from './background-jobs/background-job-worker-not-found.error.js';

// Configuration
export * from './configuration/configuration-message-audit-expire.error.js';
export * from './configuration/configuration-namespace.error.js';
export * from './configuration/configuration-not-found.error.js';
export * from './configuration/configuration-update.error.js';
export * from './configuration/invalid-configuration.error.js';
export * from './configuration/invalid-message-audit-history-size.error.js';
export * from './configuration/invalid-message-audit-queue-size.error.js';

// Consumer groups
export * from './consumer-group/consumer-group-has-active-consumers.error.js';
export * from './consumer-group/consumer-group-not-empty.error.js';
export * from './consumer-group/consumer-group-not-found.error.js';
export * from './consumer-group/consumer-group-required.error.js';
export * from './consumer-group/consumer-groups-not-supported.error.js';
export * from './consumer-group/invalid-consumer-group-id.error.js';

// Consumer
export * from './consumer/consumer-set-mismatch.error.js';
export * from './consumer/processing-queue-not-empty.error.js';

// Exchanges
export * from './exchange/exchange-already-exists.error.js';
export * from './exchange/exchange-has-bound-queues.error.js';
export * from './exchange/exchange-not-found.error.js';
export * from './exchange/exchange-queue-policy-mismatch.error.js';
export * from './exchange/exchange-required.error.js';
export * from './exchange/exchange-type-mismatch.error.js';
export * from './exchange/invalid-direct-exchange-parameters.error.js';
export * from './exchange/invalid-exchange-parameters.error.js';
export * from './exchange/invalid-exchange-routing-key.error.js';
export * from './exchange/invalid-fanout-exchange-parameters.error.js';
export * from './exchange/invalid-topic-binding-pattern.error.js';
export * from './exchange/invalid-topic-exchange-params.error.js';

// Messages
export * from './message/invalid-cron-expression.error.js';
export * from './message/invalid-scheduling-parameters.error.js';
export * from './message/message-already-exists.error.js';
export * from './message/message-destination-queue-already-set.error.js';
export * from './message/message-destination-queue-required.error.js';
export * from './message/message-exchange-required.error.js';
export * from './message/message-not-found.error.js'; // duplicate removed
export * from './message/message-not-requeuable.error.js';
export * from './message/message-priority-required.error.js';
export * from './message/message-property-invalid-value.error.js';
export * from './message/priority-queuing-not-enabled.error.js';
export * from './message/requeue-message-script.error.js';
export * from './message/acknowledgment-audit-disabled.error.js';
export * from './message/dead-letter-audit-disabled.error.js';
export * from './message/unacknowledgment-history-disabled.error.js';

// Namespaces
export * from './namespace/invalid-namespace.error.js';
export * from './namespace/namespace-mismatch.error.js';
export * from './namespace/namespace-not-found.error.js';

// Producers
export * from './producer/no-matching-queues.error.js';
export * from './producer/producer-not-running.error.js';
export * from './producer/routing-key-required.error.js';

// Queues
export * from './queue/invalid-queue-lock-id.error.js';
export * from './queue/invalid-queue-parameters.error.js';
export * from './queue/invalid-queue-state.error.js';
export * from './queue/invalid-queue-type.error.js';
export * from './queue/queue-already-being-purged.error.js';
export * from './queue/queue-already-bound.error.js'; // renamed
export * from './queue/queue-already-exists.error.js';
export * from './queue/queue-has-active-consumers.error.js';
export * from './queue/queue-has-bound-exchanges.error.js';
export * from './queue/queue-lock-owner-mismatch.error.js';
export * from './queue/queue-locked.error.js';
export * from './queue/queue-not-active.error.js';
export * from './queue/queue-not-bound.error.js';
export * from './queue/queue-not-empty.error.js';
export * from './queue/queue-not-found.error.js';
export * from './queue/queue-not-locked.error.js';
export * from './queue/queue-operation-forbidden.error.js';
export * from './queue/queue-paused.error.js';
export * from './queue/queue-state-transition.error.js';
export * from './queue/queue-stopped.error.js';
export * from './queue/queue-has-no-consumer-groups.error.js';
export * from './queue/invalid-purge-queue-job-id.error.js';
export * from './queue/invalid-rate-limit-interval.error.js';
export * from './queue/invalid-rate-limit-value.error.js';

// Scripts / Lua
export * from './redis/script-result-mismatch.error.js';
export * from './redis/unexpected-script-reply.error.js';
export * from './redis/invalid-redis-key.error.js';

// Message handlers
export * from './consumer/invalid-message-handler-signature.error.js';
export * from './consumer/invalid-message-handler-type.error.js';
export * from './consumer/message-handler-already-exists.error.js';
export * from './consumer/message-handler-file.error.js';
export * from './consumer/message-handler-filename-extension.error.js';

#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEMPLATE_FILE = path.resolve(
  __dirname,
  '../src/errors/errors.template.ts',
);
const OUTPUT_FILE = path.resolve(__dirname, '../src/errors/errors.ts');
const PLACEHOLDER = '/* __ERRORS__ */';

// Status code mapping configuration
const errorStatusCodeMap = {
  // 409 Conflict - Resource already exists or conflict
  QueueAlreadyExistsError: 409,
  ExchangeAlreadyExistsError: 409,
  MessageAlreadyExistsError: 409,
  QueueAlreadyBoundError: 409,
  ExchangeHasBoundQueuesError: 409,
  QueueHasBoundExchangesError: 409,
  BackgroundJobAlreadyExistsError: 409,
  QueueAlreadyBeingPurgedError: 409,
  MessageHandlerAlreadyExistsError: 409,
  ConsumerGroupHasActiveConsumersError: 409,

  // 403 Forbidden - Operation not allowed in current state
  QueueOperationForbiddenError: 403,
  QueueLockedError: 403,
  QueueStoppedError: 403,
  QueuePausedError: 403,
  QueueNotActiveError: 403,
  QueueNotLockedError: 403,
  QueueLockOwnerMismatchError: 403,
  BackgroundJobTargetLockedError: 403,
  BackgroundJobNotCancellableError: 403,
  BackgroundJobNotCompletableError: 403,
  BackgroundJobNotFailableError: 403,
  BackgroundJobNotStartableError: 403,
  BackgroundJobCanceledError: 403,
  NamespaceMismatchError: 403,
  ConsumerSetMismatchError: 403,

  // 412 Precondition Failed - Prerequisites not met
  QueueNotBoundError: 412,
  QueueNotEmptyError: 412,
  QueueHasActiveConsumersError: 412,
  ConsumerGroupNotEmptyError: 412,
  ProcessingQueueNotEmptyError: 412,
  ConsumerGroupRequiredError: 412,
  MessageDestinationQueueRequiredError: 412,
  MessageDestinationQueueAlreadySetError: 412,
  MessageNotRequeuableError: 412,
  PriorityQueuingNotEnabledError: 412,
  AcknowledgmentAuditDisabledError: 412,
  DeadLetterAuditDisabledError: 412,
  UnacknowledgmentHistoryDisabledError: 412,

  // 422 Unprocessable Entity - Valid request but semantic errors
  InvalidQueueTypeError: 422,
  NoMatchingQueuesError: 422,
  ExchangeTypeMismatchError: 422,
  ExchangeQueuePolicyMismatchError: 422,
  RequeueMessageScriptError: 422,
  ScriptResultMismatchError: 422,
  QueueStateTransitionError: 422,
  ConfigurationUpdateError: 422,
  ConfigurationMessageAuditExpireError: 422,
  ConfigurationNamespaceError: 422,
  ConsumerGroupsNotSupportedError: 422,

  // 500
  UnexpectedScriptReplyError: 500,
};

/**
 * Get HTTP status code for a RedisSMQ error
 */
function getStatusCodeForError(errorName) {
  return errorStatusCodeMap[errorName] || 400;
}

/**
 * Format error mapping entry
 */
function formatErrorMapping(errorName, statusCode) {
  return `  ${errorName}: [${statusCode}, '${errorName}'] as const,`;
}

/**
 * Generate error mappings from RedisSMQ errors
 */
async function generateErrorMappings() {
  const { errors } = await import('redis-smq');

  return Object.keys(errors)
    .sort((a, b) => a.localeCompare(b))
    .map((errorName) => {
      const statusCode = getStatusCodeForError(errorName);
      return formatErrorMapping(errorName, statusCode);
    })
    .join('\n');
}

/**
 * Replace placeholder in template with generated mappings
 */
function replacePlaceholder(templateContent, mappings) {
  if (!templateContent.includes(PLACEHOLDER)) {
    throw new Error(
      `Template placeholder not found. Expected: ${PLACEHOLDER}. File: ${TEMPLATE_FILE}`,
    );
  }
  return templateContent.replace(PLACEHOLDER, mappings);
}

try {
  const templateContent = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  const mappings = await generateErrorMappings();
  const output = replacePlaceholder(templateContent, mappings);

  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

  const mappingCount = mappings
    .split('\n')
    .filter((line) => line.includes('[')).length;
  console.log(
    `✅ Generated ${OUTPUT_FILE} with ${mappingCount} error mappings`,
  );
} catch (error) {
  console.error('❌ Failed to generate error mappings:', error);
  process.exit(1);
}

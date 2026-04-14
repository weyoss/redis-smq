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

const errorStatusMap = {
  // 409 Conflict
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

  // 403 Forbidden
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

  // 412 Precondition Failed
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

  // 422 Unprocessable Entity
  InvalidQueueTypeError: 422,
  NoMatchingQueuesError: 422,
  ExchangeTypeMismatchError: 422,
  ExchangeQueuePolicyMismatchError: 422,
  UnexpectedScriptReplyError: 422,
  RequeueMessageScriptError: 422,
  ScriptResultMismatchError: 422,
  QueueStateTransitionError: 422,
  ConfigurationUpdateError: 422,
  ConfigurationMessageAuditExpireError: 422,
  ConfigurationNamespaceError: 422,
  ConsumerGroupsNotSupportedError: 422,
};

// Status code mapping rules. Keep in sync with StatusFor<> in the template.
const getStatusCodeForError = (errorName) => {
  if (errorStatusMap[errorName]) return errorStatusMap[errorName];
  return 400;
};

function renderMappingLines(map) {
  // map is Record<string, [number, string]>
  const lines = [];
  for (const [key, [code, name]] of Object.entries(map)) {
    lines.push(`${key}: [${code}, '${name}'],`);
  }
  return lines.join('\n');
}

async function buildMappings() {
  const { errors } = await import('redis-smq');
  const result = {};
  for (const name of Object.keys(errors)) {
    result[name] = [getStatusCodeForError(name), name];
  }
  return Object.keys(result)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, k) => {
      acc[k] = result[k];
      return acc;
    }, {});
}

function replacePlaceholder(templateContent, mappingText) {
  if (!templateContent.includes(PLACEHOLDER)) {
    throw new Error(
      `Template placeholder not found. Expected: ${PLACEHOLDER}. File: ${TEMPLATE_FILE}`,
    );
  }
  return templateContent.replace(PLACEHOLDER, mappingText);
}

try {
  const templateContent = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  const mappings = await buildMappings();
  const mappingText = renderMappingLines(mappings);
  const output = replacePlaceholder(templateContent, mappingText);
  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  console.log(
    `Generated ${OUTPUT_FILE} with ${Object.keys(mappings).length} error mappings`,
  );
} catch (e) {
  console.error('Failed to generate error mappings:', e);
  process.exit(1);
}

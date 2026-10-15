import type { Controller, PathInput } from '../../../http/index.js';
import type { PurgeConsumerGroupPendingMessagesControllerRequestPathDTO } from './PurgeConsumerGroupPendingMessagesControllerRequestPathDTO.js';
import type { PurgeConsumerGroupPendingMessagesControllerResponseDTO } from './PurgeConsumerGroupPendingMessagesControllerResponseDTO.js';
import { pathToQueue } from '../path-to-queue.js';

export const purgeConsumerGroupPendingMessages: Controller<
  PathInput<PurgeConsumerGroupPendingMessagesControllerRequestPathDTO>,
  PurgeConsumerGroupPendingMessagesControllerResponseDTO
> = async (deps, input) => {
  await deps.queuePendingMessages.purge({
    queueParams: pathToQueue(input.path),
    groupId: input.path.consumerGroupId,
  });
  return [204, null];
};

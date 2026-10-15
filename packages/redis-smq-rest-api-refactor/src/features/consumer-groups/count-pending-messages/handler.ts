import type { Controller, PathInput } from '../../../http/index.js';
import type { CountConsumerGroupPendingMessagesControllerRequestPathDTO } from './CountConsumerGroupPendingMessagesControllerRequestPathDTO.js';
import type { CountConsumerGroupPendingMessagesControllerResponseDTO } from './CountConsumerGroupPendingMessagesControllerResponseDTO.js';
import { pathToQueue } from '../path-to-queue.js';

export const countConsumerGroupPendingMessages: Controller<
  PathInput<CountConsumerGroupPendingMessagesControllerRequestPathDTO>,
  CountConsumerGroupPendingMessagesControllerResponseDTO
> = async (deps, input) => {
  const count = await deps.queuePendingMessages.countMessages({
    queueParams: pathToQueue(input.path),
    groupId: input.path.consumerGroupId,
  });
  return [200, count];
};

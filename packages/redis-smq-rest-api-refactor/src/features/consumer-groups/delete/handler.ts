import type { Controller, PathInput } from '../../../http/index.js';
import type { DeleteConsumerGroupControllerRequestPathDTO } from './DeleteConsumerGroupControllerRequestPathDTO.js';
import type { DeleteConsumerGroupControllerResponseDTO } from './DeleteConsumerGroupControllerResponseDTO.js';
import { pathToQueue } from '../path-to-queue.js';

export const deleteConsumerGroup: Controller<
  PathInput<DeleteConsumerGroupControllerRequestPathDTO>,
  DeleteConsumerGroupControllerResponseDTO
> = async (deps, input) => {
  await deps.consumerGroups.deleteConsumerGroup(
    pathToQueue(input.path),
    input.path.consumerGroupId,
  );
  return [204, null];
};

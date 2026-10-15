import type { Controller } from '../../../http/index.js';
import type { SaveConsumerGroupControllerRequestBodyDTO } from './SaveConsumerGroupControllerRequestBodyDTO.js';
import type { SaveConsumerGroupControllerResponseDTO } from './SaveConsumerGroupControllerResponseDTO.js';
import { pathToQueue } from '../path-to-queue.js';
import type { SaveConsumerGroupControllerRequestPathDTO } from './SaveConsumerGroupControllerRequestPathDTO.js';
import type { RequestInput } from '../../../http/index.js';

export const saveConsumerGroup: Controller<
  RequestInput<
    SaveConsumerGroupControllerRequestPathDTO,
    Record<string, never>,
    SaveConsumerGroupControllerRequestBodyDTO
  >,
  SaveConsumerGroupControllerResponseDTO
> = async (deps, input) => {
  await deps.consumerGroups.saveConsumerGroup(
    pathToQueue(input.path),
    input.body.consumerGroupId,
  );
  return [204, null];
};

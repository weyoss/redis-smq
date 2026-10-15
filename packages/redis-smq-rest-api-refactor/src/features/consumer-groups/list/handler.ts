import type { Controller, PathInput } from '../../../http/index.js';
import type { GetConsumerGroupsControllerRequestPathDTO } from './GetConsumerGroupsControllerRequestPathDTO.js';
import type { GetConsumerGroupsControllerResponseDTO } from './GetConsumerGroupsControllerResponseDTO.js';
import { pathToQueue } from '../path-to-queue.js';

export const getConsumerGroups: Controller<
  PathInput<GetConsumerGroupsControllerRequestPathDTO>,
  GetConsumerGroupsControllerResponseDTO
> = async (deps, input) => {
  const groups = await deps.consumerGroups.getConsumerGroups(
    pathToQueue(input.path),
  );
  return [200, groups];
};

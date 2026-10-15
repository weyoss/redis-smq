import type { Controller, RequestInput } from '../../../http/index.js';
import type { GetConsumerGroupPendingMessagesControllerRequestPathDTO } from './GetConsumerGroupPendingMessagesControllerRequestPathDTO.js';
import type { GetConsumerGroupPendingMessagesControllerRequestQueryDTO } from './GetConsumerGroupPendingMessagesControllerRequestQueryDTO.js';
import type { GetConsumerGroupPendingMessagesControllerResponseDTO } from './GetConsumerGroupPendingMessagesControllerResponseDTO.js';
import { pathToQueue } from '../path-to-queue.js';

/**
 * Returns a page of pending messages for a specific consumer group.
 *
 * Uses `deps.queuePendingMessages.getMessages` with the group id in
 * the filter — the same call the original `ConsumerGroupsService`
 * made. This is distinct from `queue-messages/get`, which browses the
 * queue without a group filter.
 */
export const getConsumerGroupPendingMessages: Controller<
  RequestInput<
    GetConsumerGroupPendingMessagesControllerRequestPathDTO,
    GetConsumerGroupPendingMessagesControllerRequestQueryDTO,
    unknown
  >,
  GetConsumerGroupPendingMessagesControllerResponseDTO
> = async (deps, input) => {
  const { page, pageSize } = input.query;
  const result = await deps.queuePendingMessages.getMessages(
    {
      queueParams: pathToQueue(input.path),
      groupId: input.path.consumerGroupId,
    },
    page,
    pageSize,
  );
  return [200, result];
};

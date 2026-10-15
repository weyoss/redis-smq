import type { TErrors } from '../../../errors/index.js';

export type CountConsumerGroupPendingMessagesControllerResponseDTO =
  | readonly [200, number]
  | TErrors['InvalidQueueParametersError']
  | TErrors['ConsumerGroupRequiredError']
  | TErrors['ConsumerGroupsNotSupportedError']
  | TErrors['QueueNotFoundError'];

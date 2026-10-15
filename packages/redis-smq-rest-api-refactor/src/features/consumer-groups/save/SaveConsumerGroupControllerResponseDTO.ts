import type { TErrors } from '../../../errors/index.js';

export type SaveConsumerGroupControllerResponseDTO =
  | readonly [204, null]
  | TErrors['InvalidQueueParametersError']
  | TErrors['QueueNotFoundError']
  | TErrors['InvalidConsumerGroupIdError']
  | TErrors['ConsumerGroupsNotSupportedError'];

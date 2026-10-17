import type { IBrowserPage, IMessageTransferable } from 'redis-smq';
import type { TErrors } from '../../../errors/index.js';

export type GetConsumerGroupPendingMessagesControllerResponseDTO =
  | readonly [200, IBrowserPage<IMessageTransferable>]
  | TErrors['InvalidQueueParametersError']
  | TErrors['ConsumerGroupRequiredError']
  | TErrors['ConsumerGroupsNotSupportedError']
  | TErrors['QueueNotFoundError'];

import type { TErrors } from '../../../errors/index.js';

export type DeleteConsumerGroupControllerResponseDTO =
  | readonly [204, null]
  | TErrors['InvalidQueueParametersError']
  | TErrors['QueueNotFoundError']
  | TErrors['ConsumerGroupNotEmptyError']
  | TErrors['ConsumerGroupsNotSupportedError']
  | TErrors['UnexpectedScriptReplyError'];

import type { TErrors } from '../../../errors/index.js';

export type GetConsumerGroupsControllerResponseDTO =
  readonly [200, string[]] | TErrors['InvalidQueueParametersError'];

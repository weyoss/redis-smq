import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetConsumerDeadLetteredRequestDTO } from './get-consumer-dead-lettered.request.DTO';
import { GetConsumerDeadLetteredResponseDTO } from './get-consumer-dead-lettered.response.DTO';
import { consumerTimeSeriesServiceInstance } from '../../../../../../services';

export const GetConsumerDeadLetteredHandler: TRouteControllerActionHandler<
  GetConsumerDeadLetteredRequestDTO,
  GetConsumerDeadLetteredResponseDTO
> = () => {
  return async (ctx) => {
    return consumerTimeSeriesServiceInstance().deadLettered(ctx.state.dto);
  };
};

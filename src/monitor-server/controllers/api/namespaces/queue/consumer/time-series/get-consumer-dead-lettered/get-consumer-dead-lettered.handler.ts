import { TRouteControllerActionHandler } from '../../../../../../../lib/routing';
import { GetConsumerDeadLetteredRequestDTO } from './get-consumer-dead-lettered.request.DTO';
import { GetConsumerDeadLetteredResponseDTO } from './get-consumer-dead-lettered.response.DTO';

export const GetConsumerDeadLetteredHandler: TRouteControllerActionHandler<
  GetConsumerDeadLetteredRequestDTO,
  GetConsumerDeadLetteredResponseDTO
> = (app) => {
  return async (ctx) => {
    const { consumerTimeSeriesService } = app.context.services;
    return consumerTimeSeriesService.deadLettered(ctx.state.dto);
  };
};

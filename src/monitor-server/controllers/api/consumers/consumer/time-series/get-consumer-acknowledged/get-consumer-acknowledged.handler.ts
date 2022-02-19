import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetConsumerAcknowledgedRequestDTO } from './get-consumer-acknowledged.request.DTO';
import { GetConsumerAcknowledgedResponseDTO } from './get-consumer-acknowledged.response.DTO';

export const GetConsumerAcknowledgedHandler: TRouteControllerActionHandler<
  GetConsumerAcknowledgedRequestDTO,
  GetConsumerAcknowledgedResponseDTO
> = (app) => {
  return async (ctx) => {
    const { consumerTimeSeriesService } = app.context.services;
    return consumerTimeSeriesService.acknowledged(ctx.state.dto);
  };
};

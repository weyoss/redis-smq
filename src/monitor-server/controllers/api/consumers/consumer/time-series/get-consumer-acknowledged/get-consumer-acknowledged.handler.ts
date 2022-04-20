import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetConsumerAcknowledgedRequestDTO } from './get-consumer-acknowledged.request.DTO';
import { GetConsumerAcknowledgedResponseDTO } from './get-consumer-acknowledged.response.DTO';
import { consumerTimeSeriesServiceInstance } from '../../../../../../services';

export const GetConsumerAcknowledgedHandler: TRouteControllerActionHandler<
  GetConsumerAcknowledgedRequestDTO,
  GetConsumerAcknowledgedResponseDTO
> = () => {
  return async (ctx) => {
    return consumerTimeSeriesServiceInstance().acknowledged(ctx.state.dto);
  };
};

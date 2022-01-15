import { TApplication } from '../../../../../../../types/common';
import { TProducerTimeSeriesRequestContext } from '../context';

export function GetProducerPublishedHandler(app: TApplication) {
  return async (ctx: TProducerTimeSeriesRequestContext) => {
    const { producerTimeSeriesService } = app.context.services;
    return producerTimeSeriesService.published(ctx.state.dto);
  };
}

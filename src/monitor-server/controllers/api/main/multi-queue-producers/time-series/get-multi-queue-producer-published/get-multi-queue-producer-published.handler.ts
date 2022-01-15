import { TApplication } from '../../../../../../types/common';
import { TMultiQueueProducerTimeSeriesRequestContext } from '../context';

export function GetMultiQueueProducerPublishedHandler(app: TApplication) {
  return async (ctx: TMultiQueueProducerTimeSeriesRequestContext) => {
    const { multiQueueProducerTimeSeriesService } = app.context.services;
    return multiQueueProducerTimeSeriesService.published(ctx.state.dto);
  };
}

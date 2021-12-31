import { TRequestContext } from '../../../types/common';
import { MultiQueueProducerTimeSeriesRequestDTO } from '../common/multi-queue-producer-time-series-request.DTO';

export type TMultiQueueProducerTimeSeriesRequestContext =
  TRequestContext<MultiQueueProducerTimeSeriesRequestDTO>;

import { IsUUID } from 'class-validator';
import { QueueTimeSeriesRequestDTO } from './queue-time-series-request.DTO';

export class ConsumerTimeSeriesRequestDTO extends QueueTimeSeriesRequestDTO {
  @IsUUID('4')
  consumerId!: string;
}

import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { QueueRequestDTO } from '../../common/queue-request.DTO';

export class GetMessagesRequestDTO extends QueueRequestDTO {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  skip?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  take?: number;
}

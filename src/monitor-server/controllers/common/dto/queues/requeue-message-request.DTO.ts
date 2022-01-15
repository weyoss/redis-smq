import { IsInt, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { QueueRequestDTO } from './queue-request.DTO';

export class RequeueMessageRequestDTO extends QueueRequestDTO {
  @IsUUID('4')
  id!: string;

  @IsInt()
  @Type(() => Number)
  sequenceId!: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  priority?: number;
}

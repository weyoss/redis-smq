import { IsInt, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { QueueRequestDTO } from './queue-request.DTO';

export class DeleteMessageRequestDTO extends QueueRequestDTO {
  @IsUUID('4')
  id!: string;

  @IsInt()
  @Type(() => Number)
  sequenceId!: number;
}

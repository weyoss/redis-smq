import { IsInt, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteScheduledMessageRequestDTO {
  @IsUUID('4')
  id!: string;

  @IsInt()
  @Type(() => Number)
  sequenceId!: number;
}

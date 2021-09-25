import { IsString, IsUUID } from 'class-validator';

export class DeleteScheduledMessageRequestDTO {
  @IsUUID('4')
  id!: string;

  @IsString()
  queueName!: string;
}

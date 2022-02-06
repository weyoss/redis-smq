import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DeletePendingMessageWithPriorityRequestDTO {
  @IsString()
  @IsNotEmpty()
  ns!: string;

  @IsString()
  @IsNotEmpty()
  queueName!: string;

  @IsUUID('4')
  id!: string;
}

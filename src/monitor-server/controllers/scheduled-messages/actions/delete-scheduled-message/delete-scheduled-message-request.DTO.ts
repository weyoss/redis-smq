import { IsUUID } from 'class-validator';

export class DeleteScheduledMessageRequestDTO {
  @IsUUID('4')
  id!: string;
}

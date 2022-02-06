import { IsNotEmpty, IsString } from 'class-validator';
import { NamespaceRequestDTO } from '../namespaces/namespace-request.DTO';

export class QueueRequestDTO extends NamespaceRequestDTO {
  @IsString()
  @IsNotEmpty()
  queueName!: string;
}

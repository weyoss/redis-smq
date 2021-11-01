import { Equals, IsInt } from 'class-validator';

export class PurgeQueueResponseDTO {
  @IsInt()
  @Equals(204)
  status!: number;

  @Equals(undefined)
  body: undefined;
}

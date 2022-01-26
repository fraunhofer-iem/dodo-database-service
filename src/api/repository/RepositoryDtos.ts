import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateRepositoryDto {
  @ApiProperty()
  @IsNotEmpty()
  owner: string;

  @ApiProperty()
  @IsNotEmpty()
  repository: string;
}

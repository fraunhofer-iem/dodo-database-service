import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateOrgDto {
  @ApiProperty()
  @IsNotEmpty()
  identifier: string;
}

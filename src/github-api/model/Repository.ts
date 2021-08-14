import { ApiProperty, PickType } from '@nestjs/swagger';

export class RepositoryIdentifierDto {
  @ApiProperty()
  owner: string;

  @ApiProperty()
  repo: string;
}

export class RepositoryDto {
  @ApiProperty()
  owner: string;

  @ApiProperty()
  repo: string;

  @ApiProperty()
  id: string;
}

export class CreateRepositoryDto extends PickType(RepositoryDto, [
  'owner',
  'repo',
] as const) {}

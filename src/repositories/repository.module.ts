import { Module } from '@nestjs/common';
import { RepositoryController } from './repository.controller';

@Module({
  providers: [],
  controllers: [RepositoryController],
})
export class RepositoryModule {}

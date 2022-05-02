import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Repository, RepositorySchema } from './model/schemas';
import { RepositoryService } from './repository.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Repository.name, schema: RepositorySchema }],
      'data',
    ),
  ],
  providers: [RepositoryService],
  exports: [RepositoryService],
})
export class RepositoryModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Repository, RepositorySchema } from '../model/schemas';
import { CommitService } from './commit.service';
import { Commit, CommitSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Repository.name, schema: RepositorySchema },
      { name: Commit.name, schema: CommitSchema },
    ]),
  ],
  providers: [CommitService],
  controllers: [],
  exports: [CommitService],
})
export class CommitModule {}

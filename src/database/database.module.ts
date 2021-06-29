import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';
import { DiffSchema } from './schemas/diff.schema';
import { PullRequestSchema } from './schemas/pullRequest.schema';
import { RepositorySchema } from './schemas/repository.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Diff', schema: DiffSchema },
      { name: 'PullRequest', schema: PullRequestSchema },
      { name: 'Repository', schema: RepositorySchema },
    ]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

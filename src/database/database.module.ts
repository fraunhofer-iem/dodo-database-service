import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';
import { DiffSchema } from './schemas/diff.schema';
import { PullRequestSchema } from './schemas/pullRequest.schema';
import { PullRequestFileSchema } from './schemas/pullRequestFile.schema';
import { RepositoryFileSchema } from './schemas/repositoryFile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Repository', schema: RepositoryFileSchema },
      { name: 'Diff', schema: DiffSchema },
      { name: 'PullRequest', schema: PullRequestSchema },
      { name: 'PullRequestFiles', schema: PullRequestFileSchema },
      { name: 'RepositoryFiles', schema: RepositoryFileSchema },
    ]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

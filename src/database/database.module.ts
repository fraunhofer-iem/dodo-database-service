import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';
import { DiffSchema } from './schemas/diff.schema';
import { IssueSchema } from './schemas/issue.schema';
import { PullRequestSchema } from './schemas/pullRequest.schema';
import { PullRequestFileSchema } from './schemas/pullRequestFile.schema';
import { RepositorySchema } from './schemas/repository.schema';
import { RepositoryFileSchema } from './schemas/repositoryFile.schema';
import { StatisticService } from './statistic.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Repository', schema: RepositorySchema },
      { name: 'Diff', schema: DiffSchema },
      { name: 'Issue', schema: IssueSchema },
      { name: 'PullRequest', schema: PullRequestSchema },
      { name: 'PullRequestFiles', schema: PullRequestFileSchema },
      { name: 'RepositoryFiles', schema: RepositoryFileSchema },
    ]),
  ],
  providers: [DatabaseService, StatisticService],
  exports: [DatabaseService, StatisticService],
})
export class DatabaseModule {}

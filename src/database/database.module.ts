import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';
import { DiffSchema } from './schemas/diff.schema';
import { IssueSchema } from './schemas/issue.schema';
import { IssueEventTypesSchema } from './schemas/issueEventTypes.schema';
import { ReleasesSchema } from './schemas/releases.schema';
import { LabelSchema } from './schemas/labels.schema';
import { AssigneeSchema } from './schemas/assignee.schema';
import { AssigneesSchema } from './schemas/assignees.schema';
import { MilestoneSchema } from './schemas/milestone.schema';
import { PullRequestSchema } from './schemas/pullRequest.schema';
import { PullRequestFileSchema } from './schemas/pullRequestFile.schema';
import { RepositorySchema } from './schemas/repository.schema';
import { RepositoryFileSchema } from './schemas/repositoryFile.schema';
import { IssueWithEventsSchema } from './schemas/issueWithEvents.schema';
import { StatisticService } from './statistic.service';
import { LanguageSchema } from './schemas/language.schema';
import { CommitSchema } from './schemas/commit.schema';
import { DeveloperFocus } from './statistics/developerFocus.service';
import { FaultCorrection } from './statistics/faultCorrection.service';
import { FeatureCompletion } from './statistics/featureCompletion.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Repository', schema: RepositorySchema },
      { name: 'Diff', schema: DiffSchema },
      { name: 'Issue', schema: IssueSchema },
      { name: 'IssueEventTypes', schema: IssueEventTypesSchema },
      { name: 'Releases', schema: ReleasesSchema },
      { name: 'PullRequest', schema: PullRequestSchema },
      { name: 'PullRequestFiles', schema: PullRequestFileSchema },
      { name: 'RepositoryFiles', schema: RepositoryFileSchema },
      { name: 'Label', schema: LabelSchema },
      { name: 'Assignee', schema: AssigneeSchema },
      { name: 'Assignees', schema: AssigneesSchema },
      { name: 'Milestone', schema: MilestoneSchema },
      { name: 'IssueWithEvents', schema: IssueWithEventsSchema },
      { name: 'Languages', schema: LanguageSchema },
      { name: 'Commit', schema: CommitSchema },
    ]),
  ],
  providers: [
    DatabaseService,
    StatisticService,
    DeveloperFocus,
    FaultCorrection,
    FeatureCompletion,
  ],
  exports: [DatabaseService, StatisticService, DeveloperFocus, FaultCorrection, FeatureCompletion],
})
export class DatabaseModule {}

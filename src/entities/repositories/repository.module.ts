import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommitModule } from '../commits/commit.module';
import { IssueModule } from '../issues/issue.module';
import { Repository, RepositorySchema } from './model/schemas';
import { PullRequestModule } from '../pullRequests/pullRequest.module';
import { ReleaseModule } from '../releases/release.module';
import { RepositoryController } from './repository.controller';
import { RepositoryService } from './repository.service';
import { KpiModule } from '../kpis/kpi.module';
import { KpiModule as KpiCalculationModule } from '../../kpi/kpi.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Repository.name, schema: RepositorySchema },
    ]),
    KpiModule,
    PullRequestModule,
    ReleaseModule,
    IssueModule,
    CommitModule,
  ],
  providers: [RepositoryService],
  controllers: [RepositoryController],
  exports: [RepositoryService],
})
export class RepositoryModule {}

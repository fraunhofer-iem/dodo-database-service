import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { DeveloperFocusModule } from './statistics/developerFocus/developerFocus.module';
import { IssueTrackingModule } from './statistics/issueTracking/issueTracking.module';
import { IssueModule } from './statistics/issues/issue.module';
import { IssueLabelsModule } from './statistics/developerFocus/issueLabels.module';
import { ReleaseCycleModule } from './statistics/releaseCycles/releaseCycle.module';

@Module({
  providers: [],
  imports: [
    DeveloperFocusModule,
    IssueModule,
    IssueTrackingModule,
    IssueLabelsModule,
    ReleaseCycleModule,
  ],
  controllers: [KpiController],
})
export class KpiModule {}

import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { DeveloperFocusModule } from './statistics/developerFocus/developerFocus.module';
import { IssueTrackingModule } from './statistics/issueTracking/issueTracking.module';
import { IssueModule } from './statistics/issues/issue.module';
import { IssueLabelsModule } from './statistics/developerFocus/issueLabels.module';
import { ReleaseCycleModule } from './statistics/releaseCycles/releaseCycle.module';
import { CouplingOfComponentsModule } from './statistics/coupelingOfComponents/couplingOfComponents.module';
import { DeveloperSpreadModule } from './statistics/developerSpread/developerSpread.module';

@Module({
  providers: [],
  imports: [
    DeveloperFocusModule,
    IssueModule,
    IssueTrackingModule,
    IssueLabelsModule,
    ReleaseCycleModule,
    CouplingOfComponentsModule,
    DeveloperSpreadModule,
  ],
  controllers: [KpiController],
})
export class KpiModule {}

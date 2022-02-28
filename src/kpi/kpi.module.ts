import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { DeveloperFocusModule } from './statistics/developerFocus/developerFocus.module';
import { IssueTrackingModule } from './statistics/issueTracking/issueTracking.module';
import { IssueModule } from './statistics/issues/issue.module';
import { DeveloperSpreadModule } from './statistics/developerSpread/developerSpread.module';

@Module({
  providers: [],
  imports: [
    DeveloperFocusModule,
    IssueModule,
    IssueTrackingModule,
    DeveloperSpreadModule,
  ],
  controllers: [KpiController],
})
export class KpiModule {}

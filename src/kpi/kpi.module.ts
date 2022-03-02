import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { IssueTrackingModule } from './statistics/issueTracking/issueTracking.module';
import { IssueModule } from './statistics/issues/issue.module';
import { MeanTimeToResolutionModule } from './statistics/meanTimeToResolution/meanTimeToResolution.module';
import { CouplingOfComponentsModule } from './statistics/couplingOfComponents/couplingOfComponents.module';
import { ReleaseCycleModule } from './statistics/releaseCycles/releaseCycle.module';
import { DeveloperSpreadModule } from './statistics/developerSpread/developerSpread.module';

@Module({
  providers: [],
  imports: [
    IssueModule,
    IssueTrackingModule,
    MeanTimeToResolutionModule,
    ReleaseCycleModule,
    CouplingOfComponentsModule,
    ReleaseCycleModule,
    DeveloperSpreadModule,
  ],
  controllers: [KpiController],
})
export class KpiModule {}

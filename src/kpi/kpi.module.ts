import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { DeveloperFocusModule } from './statistics/developerFocus/developerFocus.module';
import { FeatureModule } from './statistics/features/feature.module';
import { IssueModule } from './statistics/issues/issue.module';

@Module({
  providers: [],
  imports: [DeveloperFocusModule, IssueModule, FeatureModule],
  controllers: [KpiController],
})
export class KpiModule {}

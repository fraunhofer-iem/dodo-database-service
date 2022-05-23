import { Module } from '@nestjs/common';
import { DataExtractionModule } from './data/dataExtraction.module';
import { KpiRunModule } from './kpiRuns/kpiRun.module';
import { KpiModule } from './kpis/kpi.module';
import { KpiTypeModule } from './kpiTypes/kpiType.module';
import { DodoTargetModule } from './targets/dodoTarget.module';
import { DodoUserModule } from './users/dodoUser.module';

@Module({
  imports: [
    DodoUserModule,
    DodoTargetModule,
    DataExtractionModule,
    KpiTypeModule,
    KpiModule,
    KpiRunModule,
  ],
})
export class DodoConfigModule {}
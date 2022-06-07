import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KpiRunModule } from '../kpiRuns/kpiRun.module';
import { KpiTypeModule } from '../kpiTypes/kpiType.module';
import { DodoTargetModule } from '../targets/dodoTarget.module';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { Kpi, KpiSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Kpi.name, schema: KpiSchema }],
      'config',
    ),
    DodoTargetModule,
    KpiTypeModule,
    KpiRunModule,
  ],
  providers: [KpiService],
  controllers: [KpiController],
  exports: [KpiService],
})
export class KpiModule {}

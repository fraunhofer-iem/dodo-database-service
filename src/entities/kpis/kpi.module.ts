import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KpiService } from './kpi.service';
import { KPI, KpiSchema } from './model/schemas';

@Module({
  imports: [MongooseModule.forFeature([{ name: KPI.name, schema: KpiSchema }])],
  providers: [KpiService],
  exports: [KpiService],
})
export class KpiModule {}

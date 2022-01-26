import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';

@Module({
  providers: [],
  controllers: [KpiController],
})
export class KpiModule {}

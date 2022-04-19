import { Module } from '@nestjs/common';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { KpiService } from './kpi.service';
import { KPI, KpiSchema } from './model/schemas';

@Module({
  providers: [
    {
      provide: KpiService,
      useFactory: (lakeConnection: Connection) => {
        return new KpiService(lakeConnection);
      },
      inject: [getConnectionToken('lake')],
    },
  ],
  imports: [
    MongooseModule.forFeature([{ name: KPI.name, schema: KpiSchema }], 'lake'),
  ],
  exports: [KpiService],
})
export class KpiModule {}

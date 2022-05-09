import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReleaseModule } from 'src/entities/releases/release.module';
import { KpiRunController } from './kpiRun.controller';
import { KpiRunService } from './kpiRun.service';
import { KpiRun, KpiRunSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        {
          name: KpiRun.name,
          schema: KpiRunSchema,
        },
      ],
      'lake',
    ),
    ReleaseModule,
  ],
  providers: [KpiRunService],
  controllers: [KpiRunController],
  exports: [KpiRunService],
})
export class KpiRunModule {}

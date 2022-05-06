import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KpiTypeController } from './kpiType.controller';
import { KpiTypeService } from './kpiType.service';
import { KpiType, KpiTypeSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: KpiType.name, schema: KpiTypeSchema }],
      'config',
    ),
  ],
  providers: [KpiTypeService],
  controllers: [KpiTypeController],
  exports: [KpiTypeService],
})
export class KpiTypeModule {}

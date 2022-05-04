import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
  exports: [KpiTypeService],
})
export class KpiTypeModule {}

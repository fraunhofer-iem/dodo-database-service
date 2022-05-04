import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KpiTypeModule } from '../kpiTypes/kpiType.module';
import { KpiTypeService } from '../kpiTypes/kpiType.service';
import { DodoTargetModule } from '../targets/dodoTarget.module';
import { DodoTargetService } from '../targets/dodoTarget.service';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { Kpi, KpiSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeatureAsync(
      [
        {
          name: Kpi.name,
          imports: [DodoTargetModule, KpiTypeModule],
          useFactory: (
            targetService: DodoTargetService,
            kpiTypeService: KpiTypeService,
            // kpiService: KpiService,
          ) => {
            const schema = KpiSchema;
            schema.pre<Kpi>('validate', async function (this: Kpi) {
              this.id = `${this.kpiType.id}@${this.target.owner}/${this.target.repo}`;
              this.target = (await targetService.readOrCreate(this.target))._id;
              this.kpiType = (
                await kpiTypeService.readOrCreate(this.kpiType)
              )._id;
              // for (let i = 0; i < this.children.length; i++) {
              //   this.children[i] = (
              //     await kpiService.readOrCreate(this.children[i])
              //   )._id;
              // }
            });
            return schema;
          },
          inject: [DodoTargetService, KpiTypeService],
        },
      ],
      'config',
    ),
    DodoTargetModule,
  ],
  providers: [KpiService],
  controllers: [KpiController],
  exports: [KpiService],
})
export class KpiModule {}

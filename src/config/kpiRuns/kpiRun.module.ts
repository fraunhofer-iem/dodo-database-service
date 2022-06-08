import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReleaseModule } from '../../entities/releases/release.module';
import { ReleaseService } from '../../entities/releases/release.service';
import { ActiveCodeModule } from '../../kpi/statistics/activeCode/activeCode.module';
import { ChangesPerFileModule } from '../../kpi/statistics/changesPerFile/changesPerFile.module';
import { CodeSpreadModule } from '../../kpi/statistics/codeSpread/codeSpread.module';
import { FileSeparationModule } from '../../kpi/statistics/fileSeparation/fileSeparation.module';
import { GodClassIndexModule } from '../../kpi/statistics/godClassIndex/godClassIndex.module';
import { MeanTimeToResolutionModule } from '../../kpi/statistics/meanTimeToResolution/meanTimeToResolution.module';
import { KpiRunController } from './kpiRun.controller';
import { KpiRunService } from './kpiRun.service';
import { KpiRun, KpiRunSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeatureAsync(
      [
        {
          name: KpiRun.name,
          imports: [ReleaseModule],
          useFactory: (releaseService: ReleaseService) => {
            const schema = KpiRunSchema;
            schema.pre<KpiRun>('validate', async function (this: KpiRun) {
              if (this.release) {
                this.release = (
                  await releaseService.read({ node_id: this.release.node_id })
                )._id;
              }
            });
            return schema;
          },
          inject: [ReleaseService],
        },
      ],
      'config',
    ),
    ReleaseModule,
    ChangesPerFileModule,
    ActiveCodeModule,
    FileSeparationModule,
    CodeSpreadModule,
    GodClassIndexModule,
    MeanTimeToResolutionModule,
  ],
  providers: [KpiRunService],
  controllers: [KpiRunController],
  exports: [KpiRunService],
})
export class KpiRunModule {}

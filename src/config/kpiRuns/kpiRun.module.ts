import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReleaseModule } from 'src/entities/releases/release.module';
import { ActiveCodeModule } from 'src/kpi/statistics/activeCode/activeCode.module';
import { KpiRunService } from './kpiRun.service';
import { KpiRun, KpiRunSchema } from './model/schemas';
import { ReleaseService } from 'src/entities/releases/release.service';
import { ChangesPerFileModule } from 'src/kpi/statistics/changesPerFile/changesPerFile.module';
import { FileSeparationModule } from 'src/kpi/statistics/fileSeparation/fileSeparation.module';
import { CodeSpreadModule } from 'src/kpi/statistics/codeSpread/codeSpread.module';

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
  ],
  providers: [KpiRunService],
  exports: [KpiRunService],
})
export class KpiRunModule {}

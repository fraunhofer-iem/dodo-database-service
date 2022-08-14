import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeveloperSpreadModule } from 'src/kpi/statistics/developerSpread/developerSpread.module';
import { HealthIndexModule } from 'src/kpi/statistics/healthIndex/healthIndex.module';
import { PrAcceptanceModule } from 'src/kpi/statistics/prAcceptance/prAcceptance.module';
import { PrChangeRatioModule } from 'src/kpi/statistics/prChangeRatio/prChangeRatio.module';
import { PrChurnModule } from 'src/kpi/statistics/prChurn/prChurn.module';
import { PrCommentsModule } from 'src/kpi/statistics/prComments/prComments.module';
import { PrComplexityModule } from 'src/kpi/statistics/prComplexity/prComplexity.module';
import { PrHandlingModule } from 'src/kpi/statistics/prHandling/prHandling.module';
import { PrProcessingEfficiencyModule } from 'src/kpi/statistics/prProcessingEfficiency/prProcessingEfficiency.module';
import { PrSpreadModule } from 'src/kpi/statistics/prSpread/prSpread.module';
import { TechnicalDebtModule } from 'src/kpi/statistics/technicalDebt/technicalDebt.module';
import { TicketAssignmentModule } from 'src/kpi/statistics/ticketAssignment/ticketAssignment.module';
import { TicketResolutionModule } from 'src/kpi/statistics/ticketResolution/ticketResolution.module';
import { ReleaseModule } from '../../entities/releases/release.module';
import { ReleaseService } from '../../entities/releases/release.service';
import { ActiveCodeModule } from '../../kpi/statistics/activeCode/activeCode.module';
import { ChangesPerFileModule } from '../../kpi/statistics/changesPerFile/changesPerFile.module';
import { CodeSpreadModule } from '../../kpi/statistics/codeSpread/codeSpread.module';
import { FileSeparationModule } from '../../kpi/statistics/fileSeparation/fileSeparation.module';
import { GodClassIndexModule } from '../../kpi/statistics/godClassIndex/godClassIndex.module';
import { MeanTimeToResolutionModule } from '../../kpi/statistics/meanTimeToResolution/meanTimeToResolution.module';
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
    HealthIndexModule,
    PrProcessingEfficiencyModule,
    PrChangeRatioModule,
    PrChurnModule,
    PrCommentsModule,
    PrComplexityModule,
    PrSpreadModule,
    DeveloperSpreadModule,
    TicketResolutionModule,
    TicketAssignmentModule,
    TechnicalDebtModule,
    PrAcceptanceModule,
    PrHandlingModule,
  ],
  providers: [KpiRunService],
  exports: [KpiRunService],
})
export class KpiRunModule {}

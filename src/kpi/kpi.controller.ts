import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { DeveloperSpreadService } from './statistics/developerSpread/developerSpread.service';
import { Intervals } from './statistics/lib';
import { IssueTrackingService } from './statistics/issueTracking/issueTracking.service';
import { MeanTimeToResolutionService } from './statistics/meanTimeToResolution/meanTimeToResolution.service';
import { ReleaseCycleService } from './statistics/releaseCycles/releaseCycle.service';
import { CouplingOfComponentsService } from './statistics/couplingOfComponents/couplingOfComponents.service';
import { PullRequestComplexityService } from './statistics/pullRequestComplexity/pullRequestComponents.service';
import { KpiService } from './kpi.service';

@Controller('api/kpis')
export class KpiController {
  private readonly logger = new Logger(KpiController.name);
  constructor(private kpiService: KpiService) {}

  @Get(':id')
  async getKpi(
    @Param('id') id: string,
    @Query('owner') owner: string,
    @Query('to')
    to = `${new Date().getUTCFullYear()}-${
      new Date().getUTCMonth() + 1
    }-${new Date().getUTCDate()}`,
    @Query('repo') repo?: string,
    @Query('since') since?: string,
    @Query('interval') interval: Intervals = Intervals.MONTH,
    @Query('labelFilter') labelFilter?: string[],
    @Query('fileFilter') fileFilter?: string[],
    @Query('couplingSize') couplingSize?: number,
    @Query('occs') occurences?: number,
    @Query('timeToComplete') timeToComplete?: number,
  ) {
    this.logger.log(`Received query for KPI with id ${id}`);
    return this.kpiService.getKpi({
      id,
      owner,
      repo,
      since,
      to,
      interval,
      labelFilter,
      fileFilter,
      couplingSize,
      occurences,
      timeToComplete,
    });
  }

  // @Get(':id/data')
  // async getKpiData(@Param('id') id: string) {
  //   this.logger.log(`Received query for KPI data with id ${id}`);
  // }
}

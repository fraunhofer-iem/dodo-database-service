import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { DeveloperSpreadService } from './statistics/developerSpread/developerSpread.service';
import { Intervals } from './statistics/lib';
import { IssueTrackingService } from './statistics/issueTracking/issueTracking.service';
import { MeanTimeToResolutionService } from './statistics/meanTimeToResolution/meanTimeToResolution.service';
import { ReleaseCycleService } from './statistics/releaseCycles/releaseCycle.service';
import { CouplingOfComponentsService } from './statistics/couplingOfComponents/couplingOfComponents.service';

@Controller('api/kpis')
export class KpiController {
  private readonly logger = new Logger(KpiController.name);
  constructor(
    private readonly issueTrackingService: IssueTrackingService,
    private readonly meanTimeToResolutionService: MeanTimeToResolutionService,
    private readonly releaseCycleService: ReleaseCycleService,
    private readonly couplingOfComponents: CouplingOfComponentsService,
    private readonly developerSpreadService: DeveloperSpreadService,
  ) {}

  @Get(':id')
  async getKpi(
    @Param('id') id: string,
    @Query('owner') owner: string,
    @Query('repo') repo?: string,
    @Query('since') since?: string,
    @Query('to') to?: string,
    @Query('interval') interval: Intervals = Intervals.MONTH,
    @Query('labelFilter') labelFilter?: string[],
    @Query('fileFilter') fileFilter?: string[],
    @Query('couplingSize') couplingSize?: number,
    @Query('occs') occurences?: number,
    @Query('timeToComplete') timeToComplete?: number,
  ) {
    this.logger.log(`Received query for KPI with id ${id}`);
    switch (id) {
      case 'icr':
        this.logger.log(
          `Calculating issue completion rate for ${owner}/${repo}`,
        );
        return this.issueTrackingService.issueCompletionRate(
          owner,
          repo,
          labelFilter,
        );

      case 'icc':
        this.logger.log(
          `Calculating issue completion capability for ${owner}/${repo}`,
        );
        return this.issueTrackingService.issueCompletionCapability(
          owner,
          repo,
          labelFilter,
          timeToComplete,
        );

      case 'ice':
        this.logger.log(
          `Calculating issue completion efficiency for ${owner}/${repo}`,
        );
        return this.issueTrackingService.issueCompletionEfficiency(
          owner,
          repo,
          labelFilter,
          timeToComplete,
        );

      case 'devSpread':
        this.logger.log(`Calculating developer spread for ${owner}/${repo}`);
        return this.developerSpreadService.developerSpread(
          interval,
          owner,
          repo,
          since,
          to,
        );

      case 'releaseCycle':
        this.logger.log(`Calculating the release cycle for ${owner}/${repo}`);
        return this.releaseCycleService.releaseCycle(
          interval,
          owner,
          repo,
          since,
          to,
        );

      case 'coc':
        this.logger.log(
          `Calculating coupling of components for ${owner}/${repo}`,
        );
        return this.couplingOfComponents.couplingOfComponents(
          owner,
          repo,
          fileFilter,
          couplingSize,
          occurences,
          since,
          to,
        );

      case 'mttr':
        this.logger.log(
          `Calculating the mean time to resolution for ${owner}/${repo}`,
        );
        return this.meanTimeToResolutionService.meanTimeToResolution(
          {
            owner: owner,
            repo: repo,
          },
          interval,
          labelFilter,
          since,
          to,
        );

      default:
        return 'No such KPI';
    }
  }

  // @Get(':id/data')
  // async getKpiData(@Param('id') id: string) {
  //   this.logger.log(`Received query for KPI data with id ${id}`);
  // }
}

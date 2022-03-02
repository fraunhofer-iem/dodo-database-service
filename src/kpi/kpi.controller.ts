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

  @Get('/fcr')
  async fcr() {
    return this.issueTrackingService.issueCompletionRate(
      {
        owner: 'octokit',
        repo: 'octokit.js',
      },
      ['bug'],
    );
  }

  @Get('/devSpread')
  async devSpread(
    @Query('owner') owner: string,
    @Query('repo') repo?: string,
    @Query('since') since?: string,
    @Query('to') to?: string,
    @Query('interval') interval: Intervals = Intervals.MONTH,
  ) {
    this.logger.log('Calculating developer spread for repository:');
    this.logger.log({ owner, repo, interval, since, to });
    return this.developerSpreadService.developerSpread(
      interval,
      owner,
      repo,
      since,
      to,
    );
  }

  @Get()
  async getKpis() {
    this.logger.log('Get all KPIs request from user XXX');
  }

  @Get('/mttr')
  async mttr(
    @Query('owner') owner: string,
    @Query('repo') repo?: string,
    @Query('labels') labels?: string[],
    @Query('since') since?: string,
    @Query('to') to?: string,
    @Query('interval') interval: Intervals = Intervals.MONTH,
  ) {
    this.logger.log('Get Mean Time To Resolution');
    return this.meanTimeToResolutionService.meanTimeToResolution(
      {
        owner: owner,
        repo: repo,
      },
      interval,
      labels,
      since,
      to,
    );
  }

  @Get('/releaseCycles')
  async getRC(
    @Query('owner') owner: string,
    @Query('repo') repo: string,
    @Query('since') since?: string,
    @Query('to') to?: string,
    @Query('interval') interval: Intervals = Intervals.MONTH,
  ) {
    this.logger.log('Get Release Cycle');

    return this.releaseCycleService.releaseCycle(
      interval,
      owner,
      repo,
      since,
      to,
    );
  }

  @Get('/coc')
  async getCOC(
    @Query('owner') owner: string,
    @Query('repo') repo: string,
    @Query('limit') limit?: number,
    @Query('fileFilter') fileFilter?: string[],
    @Query('couplingSize') couplingSize?: number,
    @Query('occs') occurences?: number,
    @Query('since') since?: string,
    @Query('to') to?: string,
  ) {
    this.logger.log('Get Coupling Of Components');
    return this.couplingOfComponents.couplingOfComponents(
      owner,
      repo,
      fileFilter,
      couplingSize,
      occurences,
      since,
      to,
    );
  }

  @Get(':id')
  async getKpi(@Param('id') id: string) {
    this.logger.log(`Received query for KPI with id ${id}`);
  }

  @Get(':id/data')
  async getKpiData(@Param('id') id: string) {
    this.logger.log(`Received query for KPI data with id ${id}`);
  }
}

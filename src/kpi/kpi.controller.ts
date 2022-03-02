import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { DeveloperSpreadService } from './statistics/developerSpread/developerSpread.service';
import { Intervals } from './statistics/lib';
import { IssueTrackingService } from './statistics/issueTracking/issueTracking.service';
import { ReleaseCycle } from './statistics/releaseCycles/releaseCycle.service';
import { CouplingOfComponentsService } from './statistics/couplingOfComponents/couplingOfComponents.service';

@Controller('api/kpis')
export class KpiController {
  private readonly logger = new Logger(KpiController.name);
  constructor(
    private readonly issueTrackingService: IssueTrackingService,
    private readonly couplingOfComponents: CouplingOfComponentsService,
    private readonly releaseCycle: ReleaseCycle,
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
    @Query('interval') interval: Intervals = Intervals.MONTH,
    @Query('owner') owner: string,
    @Query('repo') repo?: string,
    @Query('since') since?: string,
    @Query('to') to?: string,
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

  @Get('/releaseCycles')
  async getRC(
    @Query('interval') interval: Intervals = Intervals.MONTH,
    @Query('owner') owner: string,
    @Query('repo') repo: string,
    @Query('since') since?: string,
    @Query('to') to?: string,
  ) {
    this.logger.log('Get Release Cycle');
    return this.releaseCycle.releaseCycle(interval, owner, repo, since, to);
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
      limit,
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

import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { DeveloperSpreadService } from './statistics/developerSpread/developerSpread.service';
import { Intervals } from './statistics/lib';
import { IssueTrackingService } from './statistics/issueTracking/issueTracking.service';

@Controller('api/kpis')
export class KpiController {
  private readonly logger = new Logger(KpiController.name);
  constructor(
    private readonly issueTrackingService: IssueTrackingService,
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

  @Get(':id')
  async getKpi(@Param('id') id: string) {
    this.logger.log(`Received query for KPI with id ${id}`);
  }

  @Get(':id/data')
  async getKpiData(@Param('id') id: string) {
    this.logger.log(`Received query for KPI data with id ${id}`);
  }
}

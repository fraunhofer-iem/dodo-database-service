import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { DeveloperSpreadService } from './statistics/developerSpread/developerSpread.service';
import { Intervals } from './statistics/lib';
import { IssueTrackingService } from './statistics/issueTracking/issueTracking.service';
import { ReleaseCycle } from './statistics/releaseCycles/releaseCycle.service';

@Controller('api/kpis')
export class KpiController {
  private readonly logger = new Logger(KpiController.name);
  constructor(
    private readonly issueTrackingService: IssueTrackingService,
    private readonly releaseCycle: ReleaseCycle,
    private readonly developerSpreadService: DeveloperSpreadService,
  ) {}

  // @Get('/fcr')
  // async fcr() {
  //   return this.issueTrackingService.issueCompletionRate(
  //     {
  //       owner: 'octokit',
  //       repo: 'octokit.js',
  //     },
  //     ['bug'],
  //   );
  // }

  // @Get('/devSpread')
  // async devSpread(
  //   @Query('interval') interval: Intervals = Intervals.MONTH,
  //   @Query('owner') owner: string,
  //   @Query('repo') repo?: string,
  //   @Query('since') since?: string,
  //   @Query('to') to?: string,
  // ) {
  //   this.logger.log('Calculating developer spread for repository:');
  //   this.logger.log({ owner, repo, interval, since, to });
  //   return this.developerSpreadService.developerSpread(
  //     interval,
  //     owner,
  //     repo,
  //     since,
  //     to,
  //   );
  // }

  // @Get()
  // async getKpis() {
  //   this.logger.log('Get all KPIs request from user XXX');
  // }

  // @Get('/releaseCycles')
  // async getRC(
  //   @Query('interval') interval: Intervals = Intervals.MONTH,
  //   @Query('owner') owner: string,
  //   @Query('repo') repo: string,
  //   @Query('since') since?: string,
  //   @Query('to') to?: string,
  // ) {
  //   this.logger.log('Get Release Cycle');
  //   return this.releaseCycle.releaseCycle(interval, owner, repo, since, to);
  // }

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
  ) {
    this.logger.log(`Received query for KPI with id ${id}`);
    switch (id) {
      case 'fcr':
        this.logger.log(
          `Calculating feature rate completion for ${owner}/${repo}`,
        );
        return this.issueTrackingService.issueCompletionRate(
          owner,
          repo,
          labelFilter,
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
        return this.releaseCycle.releaseCycle(interval, owner, repo, since, to);
      // case 'coc':
      //   this.logger.log(`Calculating coupling of components for ${owner}/${repo}`);
      //   return this.couplingOfComponents.couplingOfComponents(
      //     repo,
      //     fileFilter,
      //     couplingSize,
      //     occurences,
      //     since,
      //     to,
      //   );
      default:
        return 'no such kpi endpoint';
    }
  }

  // @Get(':id/data')
  // async getKpiData(@Param('id') id: string) {
  //   this.logger.log(`Received query for KPI data with id ${id}`);
  // }
}

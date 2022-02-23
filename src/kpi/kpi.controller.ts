import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { DeveloperSpreadService } from './statistics/developerSpread/developerSpread.service';
import { IssueTrackingService } from './statistics/issueTracking/issueTracking.service';
import { IssueLabels } from './statistics/developerFocus/issueLabels.service';
import { ReleaseCycle } from './statistics/releaseCycles/releaseCycle.service';
import { CouplingOfComponents } from './statistics/coupelingOfComponents/couplingOfComponents.service';

@Controller('api/kpis')
export class KpiController {
  private readonly logger = new Logger(KpiController.name);
  constructor(
    private readonly issueTrackingService: IssueTrackingService,
    private readonly issueLabels: IssueLabels,
    private readonly releaseCycle: ReleaseCycle,
    private readonly couplingOfComponents: CouplingOfComponents,
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
  async devSpread(@Query('owner') owner: string, @Query('repo') repo: string) {
    this.logger.log('Calculating developer spread for repository:');
    this.logger.log({ owner, repo });
    this.developerSpreadService.developerSpread({ owner, repo });
  }

  @Get()
  async getKpis() {
    this.logger.log('Get all KPIs request from user XXX');
  }

  @Get('/ilp')
  async getILP() {
    this.logger.log('Get Issue Label Priorities');
    return this.issueLabels.labelPrioritiesAvg({
      owner: 'fraunhofer-iem',
      repo: 'dodo-database-service',
    });
  }

  @Get('/rc')
  async getRC() {
    this.logger.log('Get Release Cycle');
    return this.releaseCycle.releaseCycle({
      owner: 'fraunhofer-iem',
      repo: 'dodo-database-service',
    });
  }

  @Get('/coc')
  async getCOC() {
    this.logger.log('Get Coupling Of Components');
    return this.couplingOfComponents.couplingOfComponents(
      {
        owner: 'fraunhofer-iem',
        repo: 'dodo-database-service',
      },
      // 100,
      // ['README.md'],
      // 5,
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

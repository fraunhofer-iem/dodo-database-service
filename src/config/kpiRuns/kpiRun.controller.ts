import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { KpiRunService } from './kpiRun.service';

@Controller('api/runs')
export class KpiRunController {
  private readonly logger = new Logger(KpiRunController.name);

  constructor(private kpiRunService: KpiRunService) {}
  @Get(':kpiId([^/]+)')
  async readOrgRuns(
    @Param('kpiId') kpiId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('history') history?: 'true' | 'false',
  ) {
    return this.readRuns(kpiId, from, to, history);
  }

  @Get(':kpiId([^/]+/[^/]+)')
  async readRuns(
    @Param('kpiId') kpiId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('history') history?: 'true' | 'false',
  ) {
    if (history === 'true') {
      return this.kpiRunService.history({ 'kpi.id': kpiId }, from, to);
    }
    if (to) {
      return this.kpiRunService.valueAt({ 'kpi.id': kpiId }, to);
    }
  }
}

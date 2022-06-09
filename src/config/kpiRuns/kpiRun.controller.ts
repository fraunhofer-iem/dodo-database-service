import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { KpiRunService } from './kpiRun.service';

@Controller('api/runs')
export class KpiRunController {
  private readonly logger = new Logger(KpiRunController.name);

  constructor(private kpiRunService: KpiRunService) {}
  @Get(':kpiId([^/]+)')
  async readOrgRuns(
    @Param('kpiId') kpiId: string,
    @Query('at') at?: string,
    @Query('history') history?: 'true' | 'false',
  ) {
    return this.readRuns(kpiId, at, history);
  }

  @Get(':kpiId([^/]+/[^/]+)')
  async readRuns(
    @Param('kpiId') kpiId: string,
    @Query('at') at?: string,
    @Query('history') history?: 'true' | 'false',
  ) {
    if (at) {
      return this.kpiRunService.valueAt({ 'kpi.id': kpiId }, at);
    } else if (history !== undefined && JSON.parse(history)) {
      let runs = await this.kpiRunService.readAll({ 'kpi.id': kpiId });
      return Object.fromEntries(runs.map((run) => [run.to, run.value]));
    }
  }
}

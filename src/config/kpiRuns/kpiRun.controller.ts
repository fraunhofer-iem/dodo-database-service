import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { reverse, sortBy } from 'lodash';
import { KpiRunService } from './kpiRun.service';

@Controller('api/kpis/runs')
export class KpiRunController {
  private readonly logger = new Logger(KpiRunController.name);

  constructor(private kpiRunService: KpiRunService) {}

  @Get(':kpiId([^/]+/[^/]+)')
  async readRuns(
    @Param('kpiId') kpiId: string,
    @Query('at') at?: string,
    @Query('history') history?: 'true' | 'false',
  ) {
    const pipeline = this.kpiRunService.preAggregate({}, { kpi: true });
    pipeline.match({
      'kpi.id': kpiId,
    });
    pipeline.project({
      _id: 0,
      value: 1,
      to: 1,
    });
    let runs: { to: string; value: number }[] = await pipeline.exec();
    if (at) {
      let hydratedRuns = runs.map<{ to: Date; value: number }>((run) => ({
        to: new Date(run.to),
        value: run.value,
      }));
      hydratedRuns = hydratedRuns.filter((run) => run.to <= new Date(at));
      hydratedRuns = reverse(sortBy(hydratedRuns, [(run) => run.to]));
      return hydratedRuns[0];
    } else if (history !== undefined && JSON.parse(history)) {
      return Object.fromEntries(runs.map((run) => [run.to, run.value]));
    }
  }
}

import { Controller, Get, Logger } from '@nestjs/common';
import { KpiService } from 'src/config/kpis/kpi.service';
import { KpiRunService } from './kpiRun.service';

@Controller('api/kpiRuns')
export class KpiRunController {
  private readonly logger = new Logger(KpiRunController.name);

  constructor(
    private kpiRunService: KpiRunService,
    private kpiService: KpiService,
  ) {}

  @Get('')
  async testCalc() {
    // this.logger.debug('Test calculation');
    // const pipeline = this.kpiService.preAggregate({}, {}).sort();
    // this.kpiRunService.calculate(kpi);
  }
}

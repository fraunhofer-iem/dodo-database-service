import { Controller, Get, Logger } from '@nestjs/common';
import { KpiRunService } from './kpiRun.service';

@Controller('api/kpiRuns')
export class KpiRunController {
  private readonly logger = new Logger(KpiRunController.name);

  constructor(private kpiRunService: KpiRunService) {}

  @Get('')
  async testCalc() {
    this.kpiRunService.calculate();
  }
}

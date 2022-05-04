import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Kpi, KpiDocument } from './model/schemas';
import { KpiService } from './kpi.service';
import { DodoTargetService } from '../targets/dodoTarget.service';
import { DodoTarget, DodoTargetDocument } from '../targets/model/schemas';

@Controller('api')
export class KpiController {
  private readonly logger = new Logger(KpiController.name);

  constructor(
    private kpiService: KpiService,
    private targetService: DodoTargetService,
  ) {}

  @Get('targets/:owner/:repo/kpis')
  async readKpisOfTarget(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    let target: DodoTargetDocument = undefined;
    try {
      target = await this.targetService.read({
        owner: owner,
        repo: repo,
      });
    } catch {}
    let kpis: KpiDocument[] = [];
    if (target) {
      const pipeline = this.kpiService.preAggregate(
        { target: target._id },
        { target: true, children: true },
      );
      kpis = await pipeline.exec();
    }
    return kpis;
  }

  @Get('kpis')
  async readKpis() {
    return this.kpiService
      .preAggregate({}, { target: true, children: true })
      .exec();
  }

  @Get('kpis/:kpiId')
  async readKpi(@Param('kpiId') kpiId: string) {
    const kpi = (
      await this.kpiService
        .preAggregate({ id: kpiId }, { target: true, children: true })
        .exec()
    )[0];
    return kpi;
  }

  @Post('kpis')
  async createKpi(@Body() kpi: Omit<Kpi, 'id'>) {
    for (let i = 0; i < kpi.children.length; i++) {
      kpi.children[i] = (await this.kpiService.read(kpi.children[i]))._id;
    }
    return this.kpiService.create(kpi);
  }
}

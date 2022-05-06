import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Kpi, KpiDocument } from './model/schemas';
import { KpiService } from './kpi.service';
import { DodoTargetService } from '../targets/dodoTarget.service';
import { DodoTarget, DodoTargetDocument } from '../targets/model/schemas';
import { FilterQuery, ObjectId } from 'mongoose';
import { KpiCreate } from './model';
import { KpiTypeService } from '../kpiTypes/kpiType.service';

@Controller('api/kpis')
export class KpiController {
  private readonly logger = new Logger(KpiController.name);

  constructor(
    private kpiService: KpiService,
    private kpiTypeService: KpiTypeService,
    private targetService: DodoTargetService,
  ) {}

  @Get()
  async readKpis(
    @Query('owner') owner?: string,
    @Query('repo') repo?: string,
    @Query('children') children?: 'true' | 'false',
  ) {
    let filter: FilterQuery<DodoTargetDocument> = undefined;
    try {
      const target = await this.targetService.read({
        owner: owner,
        repo: repo,
      });
      filter = { target: target._id };
    } catch {}
    const pipeline = this.kpiService.preAggregate(filter, {
      target: true,
      children: children !== undefined ? JSON.parse(children) : true,
    });
    return pipeline.exec();
  }

  @Get(':kpiId([^/]+/[^/]+)')
  async readKpi(
    @Param('kpiId') kpiId: string,
    @Query('children') children?: 'true' | 'false',
  ) {
    const pipeline = this.kpiService.preAggregate(
      { id: kpiId },
      {
        target: true,
        children: children !== undefined ? JSON.parse(children) : true,
      },
    );
    const kpi = await pipeline.exec();
    if (kpi.length) {
      return kpi[0];
    } else {
      return null;
    }
  }

  @Post()
  async createKpi(@Body() kpi: KpiCreate) {
    try {
      const target = await this.targetService.read({
        owner: kpi.owner,
        repo: kpi.repo,
      });
      const kpiType = await this.kpiTypeService.read({ id: kpi.type });
      const children = [];
      for (const child of kpiType.children) {
        const instance = await this.kpiService.read({ kpiType: child });
        children.push(instance._id);
      }
      const currentKpi = await this.kpiService.create({
        kpiType: kpiType,
        target: target,
        children: children,
      });
      return await this.readKpi(currentKpi.id);
      // after registration, calculate the KPI (do not wait for the result though)
    } catch (err) {
      this.logger.debug(err.message);
      return 'Requirements not fulfilled';
    }
  }
}

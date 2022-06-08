import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FilterQuery } from 'mongoose';
import { KpiRunService } from '../kpiRuns/kpiRun.service';
import { KpiTypeService } from '../kpiTypes/kpiType.service';
import { DodoTargetService } from '../targets/dodoTarget.service';
import { DodoTargetDocument } from '../targets/model/schemas';
import { KpiService } from './kpi.service';
import { KpiCreate } from './model';

@Controller('api/kpis')
export class KpiController {
  private readonly logger = new Logger(KpiController.name);

  constructor(
    private kpiService: KpiService,
    private kpiTypeService: KpiTypeService,
    private targetService: DodoTargetService,
    private kpiRunService: KpiRunService,
    private eventEmitter: EventEmitter2,
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
        _id: true,
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
        repo: kpi.repo ? kpi.repo : null,
      });
      const kpiType = await this.kpiTypeService.read({ id: kpi.type });
      let filter: FilterQuery<DodoTargetDocument> = {};
      if (!kpi.repo) {
        filter = {
          owner: kpi.owner,
          repo: { $ne: null },
        };
      } else {
        filter = {
          owner: kpi.owner,
          repo: kpi.repo,
        };
      }
      const childTargets = await this.targetService.preAggregate(filter).exec();
      const children = [];
      for (const child of kpiType.children) {
        for (const childTarget of childTargets) {
          for await (const instance of this.kpiService.readAll({
            kpiType: child,
            target: childTarget._id,
          })) {
            children.push(instance);
          }
        }
      }

      const currentKpi = await this.kpiService.create({
        id: `${kpiType.id}${kpi.id ? `[${kpi.id}]` : ''}@${target.owner}${
          target.repo ? `/${target.repo}` : ''
        }`,
        kpiType: kpiType,
        target: target,
        children: children.map((child) => child._id),
        params: kpi.params,
      });
      this.eventEmitter.emit('kpi.registered', {
        kpi: {
          _id: currentKpi._id,
          children: currentKpi.children,
          params: currentKpi.params,
          kpiType: kpiType,
          target: target,
        },
      });
      return await this.readKpi(currentKpi.id);
    } catch (err) {
      this.logger.debug(err.message);
      return 'Requirements not fulfilled';
    }
  }
}

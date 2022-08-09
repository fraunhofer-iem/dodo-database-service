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
import { reverse, sortBy } from 'lodash';
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
    @Query('kinds') kinds?: string[],
    @Query('to') to?: string,
    @Query('from') from?: string,
    @Query('history') history?: 'true' | 'false',
  ) {
    let filter: FilterQuery<DodoTargetDocument> = undefined;
    if (owner) {
      let targets = await this.targetService
        .preAggregate(
          repo
            ? {
                owner: owner,
                repo: repo,
              }
            : {
                owner: owner,
              },
        )
        .exec();
      targets = targets.map((target) => target._id);
      filter = { target: { $in: targets } };
    }
    const kpis = await this.kpiService
      .preAggregate(filter, {
        _id: true,
        target: true,
        children: children === undefined ? true : children === 'true',
      })
      .match({
        kind: { $in: Array.isArray(kinds) ? kinds : [kinds] },
      })
      .exec();

    const kpiData = await this.kpiRunService.history(
      kpis.map((kpi) => kpi._id),
      from,
      to,
    );
    for (const kpi of kpis) {
      if (to) {
        kpi.value = reverse(
          sortBy(kpiData['' + kpi._id], [(entry) => new Date(entry[0])]),
        )[0].value;
      }
      if (history === 'true') {
        kpi.data = kpiData['' + kpi._id];
      }
    }
    return kpis;
  }

  @Get(':kpiId([^/]+)')
  async readOrgKpi(
    @Param('kpiId') kpiId: string,
    @Query('children') children?: 'true' | 'false',
    @Query('to') to?: string,
    @Query('from') from?: string,
    @Query('history') history?: 'true' | 'false',
  ) {
    return this.readKpi(kpiId, children, to, from, history);
  }

  @Get(':kpiId([^/]+/[^/]+)')
  async readKpi(
    @Param('kpiId') kpiId: string,
    @Query('children') children?: 'true' | 'false',
    @Query('to') to?: string,
    @Query('from') from?: string,
    @Query('history') history?: 'true' | 'false',
  ) {
    const pipeline = this.kpiService.preAggregate(
      { id: kpiId },
      {
        target: true,
        children: children === undefined ? true : children === 'true',
        _id: true,
      },
    );
    const kpis = await pipeline.exec();
    if (kpis.length) {
      const kpi = kpis[0];
      const kpiData = await this.kpiRunService.history([kpi._id], from, to);
      if (to) {
        kpi.value = reverse(
          sortBy(kpiData['' + kpi._id], [(entry) => new Date(entry[0])]),
        )[0].value;
      }
      if (history === 'true') {
        kpi.data = kpiData['' + kpi._id];
      }
      return kpi;
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

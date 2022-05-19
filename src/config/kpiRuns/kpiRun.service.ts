import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregate, FilterQuery, Model } from 'mongoose';
import { Release } from 'src/entities/releases/model/schemas';
import { ReleaseService } from 'src/entities/releases/release.service';
import { documentExists, retrieveDocument } from 'src/lib';
import { KpiDocument } from '../kpis/model/schemas';
import { kpiLookup, kpiTypeLookup, releaseLookup } from './lib';
import { KpiRun, KpiRunDocument } from './model/schemas';

@Injectable()
export class KpiRunService {
  private readonly logger = new Logger(KpiRunService.name);

  constructor(
    @InjectModel(KpiRun.name) private kpiRunModel: Model<KpiRunDocument>,
    private releaseService: ReleaseService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.registered')
  public async calculate(payload: { kpi: KpiDocument }) {
    const { kpi } = payload;
    const releases = await this.releaseService
      .preAggregate(
        {},
        {
          repo: true,
          files: true,
        },
      )
      .match({
        'repo.owner': kpi.target.owner,
        'repo.repo': kpi.target.repo,
      })
      .sort({ published_at: 1 })
      .exec();

    let since = undefined;
    for (const release of releases) {
      const children = await this.preAggregate(
        {
          release: release._id,
          kpi: { $in: kpi.children },
        },
        { kpi: true },
      ).exec();
      const data: any = {};
      for (const child of children) {
        data[child.kpi.kpiType.id] = child.value;
      }
      this.eventEmitter.emit(`kpi.prepared.${kpi.kpiType.id}`, {
        kpi: kpi,
        since: since,
        release: release,
        data: data,
      });
      since = release.published_at;
    }
  }

  @OnEvent('kpi.calculated')
  public async store(payload: {
    kpi: KpiDocument;
    release: Release;
    since: Date;
    value: any;
  }) {
    this.create({
      kpi: payload.kpi._id,
      release: payload.release,
      since: payload.since as any,
      to: payload.release.published_at,
      value: payload.value,
    });
  }

  public async readOrCreate(json: KpiRun): Promise<KpiRunDocument> {
    let kpiRun: KpiRunDocument;
    try {
      kpiRun = await this.read({ kpi: json.kpi, release: json.release });
    } catch {
      kpiRun = await this.create(json);
    }
    return kpiRun;
  }

  public async read(
    filter: FilterQuery<KpiRunDocument>,
  ): Promise<KpiRunDocument> {
    return retrieveDocument(this.kpiRunModel, filter);
  }

  public async create(json: KpiRun): Promise<KpiRunDocument> {
    if (
      await documentExists(this.kpiRunModel, {
        kpi: json.kpi,
        release: json.release,
      })
    ) {
      throw new Error('KPI has already been calculated');
    }
    return this.kpiRunModel.create(json);
  }

  public preAggregate(
    filter: FilterQuery<KpiRunDocument> = undefined,
    options: {
      kpi?: boolean;
      release?: boolean;
    } = {},
  ): Aggregate<any> {
    const pipeline = this.kpiRunModel.aggregate();
    if (filter) {
      pipeline.match(filter);
    }
    if (options.kpi) {
      pipeline.lookup(kpiLookup);
      pipeline.addFields({
        kpi: { $arrayElemAt: ['$kpi', 0] },
      });
      pipeline.lookup(kpiTypeLookup);
      pipeline.addFields({
        'kpi.kpiType': { $arrayElemAt: ['$kpi.kpiType', 0] },
      });
    }
    if (options.release) {
      pipeline.lookup(releaseLookup);
      pipeline.addFields({
        release: { $arrayElemAt: ['$release', 0] },
      });
    }
    return pipeline;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregate, FilterQuery, Model } from 'mongoose';
import { transformMapToObject } from 'src/kpi/statistics/lib';
import {
  Release,
  ReleaseDocument,
} from '../../entities/releases/model/schemas';
import { ReleaseService } from '../../entities/releases/release.service';
import { documentExists, retrieveDocument } from '../../lib';
import { Kpi, KpiDocument } from '../kpis/model/schemas';
import { kpiLookup, kpiTypeLookup } from './lib';
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
    const releases: ReleaseDocument[] = await this.releaseService
      .preAggregate(
        {},
        {
          repo: true,
          files: true,
        },
      )
      .match({
        'repo.owner': kpi.target.owner,
        'repo.repo': kpi.target.repo ?? { $ne: null },
      })
      .sort({
        published_at: 1,
      })
      .exec();

    let since = undefined;
    for (let i = 0; i < releases.length; i++) {
      const currentRelease = releases[i];

      let correspondingReleases = [];
      for (let j = i; j >= 0; j--) {
        const candidate = releases[j];
        if (
          !correspondingReleases
            .map((release) => `${release.repo.owner}/${release.repo.repo}`)
            .includes(`${candidate.repo.owner}/${candidate.repo.repo}`)
        ) {
          correspondingReleases.push(candidate);
        }
      }
      correspondingReleases = correspondingReleases.map(
        (release) => release._id,
      );

      const children = await this.preAggregate(
        {
          release: { $in: correspondingReleases },
          kpi: { $in: kpi.children },
        },
        { kpi: true },
      ).exec();
      const data: any = {};
      for (const child of children) {
        const kpiTypeId = child.kpi.kpiType.id;
        if (data.hasOwnProperty(kpiTypeId)) {
          if (!Array.isArray(data[kpiTypeId])) {
            data[kpiTypeId] = [data[kpiTypeId]];
          }
          data[kpiTypeId].push(child.value);
        } else {
          data[kpiTypeId] = child.value;
        }
      }

      this.eventEmitter.emit(`kpi.prepared.${kpi.kpiType.id}`, {
        kpi: kpi,
        since: since,
        release: currentRelease,
        data: data,
      });
      since = currentRelease.published_at;
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
      since: payload.since ? payload.since.toUTCString() : null,
      to: (payload.release.published_at as any).toUTCString(),
      value: payload.value,
    });
  }

  public async history(kpiIds: string[], from?: string, to?: string) {
    let runs: KpiRunDocument[] = await this.preAggregate(
      { kpi: { $in: kpiIds } },
      {
        kpi: true,
      },
    ).exec();
    let hydratedRuns = runs.map<{
      to: Date;
      value: number;
      release: string;
      kpi: Kpi;
    }>((run) => ({
      release: run.release as any,
      kpi: run.kpi,
      to: new Date(run.to),
      value: run.value,
    }));
    if (from) {
      hydratedRuns = hydratedRuns.filter(
        (run) => run.to >= new Date(new Date(from).setUTCHours(0, 0, 0)),
      );
    }
    if (to) {
      hydratedRuns = hydratedRuns.filter(
        (run) => run.to <= new Date(new Date(to).setUTCHours(23, 59, 59)),
      );
    }
    const releases: ReleaseDocument[] = await this.releaseService
      .preAggregate(
        { _id: { $in: hydratedRuns.map((run) => run.release) } },
        {},
      )
      .exec();
    const releaseMap: Map<string, string> = new Map();
    for (const release of releases) {
      releaseMap.set('' + release._id, release.name);
    }
    const kpiMap: Map<string, any[]> = new Map();
    for (const run of hydratedRuns) {
      if (!kpiMap.has('' + (run.kpi as KpiDocument)._id)) {
        kpiMap.set('' + (run.kpi as KpiDocument)._id, []);
      }
      let label: Date | string = run.to;
      if (run.kpi.kpiType.type !== 'orga') {
        label = releaseMap.get('' + run.release);
      }
      kpiMap
        .get('' + (run.kpi as KpiDocument)._id)
        .push([run.to, { label: label, value: run.value }]);
    }
    return transformMapToObject(kpiMap, (entries: any[]) =>
      Object.fromEntries(entries),
    );
  }

  public async readAll(
    filter: FilterQuery<KpiRunDocument>,
  ): Promise<KpiRunDocument[]> {
    let kpiRuns: KpiRunDocument[] = await this.preAggregate({}, { kpi: true })
      .match(filter)
      .exec();

    return kpiRuns;
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
    return pipeline;
  }
}

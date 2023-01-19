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
import { sortBy } from 'lodash';
import { PrSpreadService } from 'src/kpi/statistics/prSpread/prSpread.service';
import { PrProcessingEfficiencyService } from 'src/kpi/statistics/prProcessingEfficiency/prProcessingEfficiency.service';
import { DeveloperSpreadService } from 'src/kpi/statistics/developerSpread/developerSpread.service';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { RepositoryFileService } from 'src/entities/repositoryFiles/repositoryFile.service';

@Injectable()
export class KpiRunService {
  private readonly logger = new Logger(KpiRunService.name);

  constructor(
    @InjectModel(KpiRun.name) private kpiRunModel: Model<KpiRunDocument>,
    private releaseService: ReleaseService,
    private eventEmitter: EventEmitter2,
    private prSpreadService: PrSpreadService,
    private prProcessingEfficiency: PrProcessingEfficiencyService,
    private devSpread: DeveloperSpreadService,
    private repositoryService: RepositoryService,
    private repositoryFileService: RepositoryFileService,
  ) {}

  @OnEvent('kpi.registered')
  public async calculate(payload: { kpi: KpiDocument }) {
    const { kpi } = payload;
    const repo = await this.repositoryService.read({ repo: kpi.target.repo });
    // const releaseIDs = repo.releases;
    // console.log(releaseIDs);
    const releaseIDs = await this.releaseService
      .preAggregate({ repo: repo._id }, {})
      .group({ _id: '$_id' })
      .exec();
    console.log(releaseIDs);
    // This for loop if files have to be fetched separately
    let releases: ReleaseDocument[] = [];

    // integrate repositoryfile service and fetch every file separately because mongoose size error
    // for (let releaseID of releaseIDs) {
    //   const release: ReleaseDocument[] = await this.releaseService
    //     .preAggregate(
    //       { _id: releaseID._id },
    //       {
    //         repo: true,
    //         files: true,
    //       },
    //     )
    //     .match({
    //       'repo.owner': kpi.target.owner,
    //       'repo.repo': kpi.target.repo ?? { $ne: null },
    //     })
    //     .exec();
    //   console.log(release);
    //   console.log('funktioniert mit dem einzelnd fetchen');
    //   console.log('-----------------------------');
    //   releases.push(...release);
    //   // const releaseFile = await this.releaseService.preAggregateReleaseFiles({
    //   //   _id: releaseID._id,
    //   // });
    //   // console.log(releaseFile);
    // }
    // console.log(releases);

    console.log('#####################');
    releases = await this.releaseService
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
      .allowDiskUse(true)
      .exec();
    // console.log(releases);
    this.logger.debug('SAFE');

    if (kpi.kpiType.name === 'Lines of Code per File') {
      for (const release of releases) {
        this.logger.debug(`release ${release.name}`);
        for (const fileObj of release.files) {
          const file = (
            await this.repositoryFileService.preAggregate(fileObj).exec()
          )[0];
          fileObj['content'] = file.content;
          fileObj['encoding'] = file.encoding;
        }
      }
      console.log('DONE!!!');
    }

    // const releaseFiles: ReleaseDocument[] =
    //   await this.releaseService.preAggregateReleaseFiles({
    //     repo: repo._id,
    //   });
    console.log('-----------------------------');
    // console.log(releaseFiles);
    // console.log(releaseFiles.length);
    // console.log(releases.length);

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
      // console.log('DATA');
      // console.log(data);
      console.log('release: ', currentRelease.name);
      console.log('since: ', currentRelease.created_at);
      console.log('to: ', currentRelease.published_at);
      console.log('id: ', kpi.kpiType.id);
      console.log('children: ', kpi.children);
      console.log('---------------------');

      // await this.prSpreadService.prCreationDates({
      //   kpi: kpi,
      //   since: since,
      //   release: currentRelease,
      //   data: data,
      // });
      // await this.prProcessingEfficiency.prsInProcess({
      //   kpi: kpi,
      //   since: since,
      //   release: currentRelease,
      //   data: data,
      // });
      // await this.devSpread.devSpread({
      //   kpi: kpi,
      //   since: since,
      //   release: currentRelease,
      //   data: data,
      // });
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
    ev?: number | number[];
  }) {
    // console.log('Value before storing:');
    // console.log(payload.value);
    this.create({
      kpi: payload.kpi._id,
      release: payload.release,
      since: payload.since ? payload.since.toUTCString() : null,
      to: (payload.release.published_at as any).toUTCString(),
      value: payload.value,
      ev: payload.ev ? payload.ev : undefined,
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
      ev?: number | number[];
    }>((run) => ({
      release: run.release as any,
      kpi: run.kpi,
      to: new Date(run.to),
      value: run.value,
      ev: run.ev ? run.ev : undefined,
    }));
    // sort the runs as they are not sorted
    hydratedRuns = sortBy(hydratedRuns, [
      function (obj) {
        return obj.to;
      },
    ]);
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
      .sort({ published_at: 1 })
      .exec();
    const releaseMap: Map<string, string> = new Map();
    for (const release of releases) {
      releaseMap.set('' + release._id, release.name);
    }
    const kpiMap: Map<string, any[]> = new Map();
    for (const run of hydratedRuns) {
      console.log('VALUE');
      console.log(run.value);
      console.log(run.kpi);
      if (!kpiMap.has('' + (run.kpi as KpiDocument)._id)) {
        kpiMap.set('' + (run.kpi as KpiDocument)._id, []);
      }
      let label: Date | string = run.to;
      if (run.kpi.kpiType.type !== 'orga') {
        label = releaseMap.get('' + run.release);
      }
      kpiMap
        .get('' + (run.kpi as KpiDocument)._id)
        .push([
          run.to,
          { label: label, value: run.value, ev: run.ev ? run.ev : undefined },
        ]);
    }
    console.log(kpiMap);
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

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregate, FilterQuery, Model } from 'mongoose';
import { ReleaseService } from 'src/entities/releases/release.service';
import { ActiveCodeService } from 'src/kpi/statistics/activeCode/activeCode.service';
import { documentExists, retrieveDocument } from 'src/lib';
import { Kpi, KpiDocument } from '../kpis/model/schemas';
import { KpiRun, KpiRunDocument } from './model/schemas';

@Injectable()
export class KpiRunService {
  private readonly logger = new Logger(KpiRunService.name);

  constructor(
    @InjectModel(KpiRun.name) private kpiRunModel: Model<KpiRunDocument>,
    private releaseService: ReleaseService,
    private activeCodeService: ActiveCodeService,
  ) {}

  public async calculate(kpi: Kpi & { _id?: any }) {
    // const data = await this.preAggregate({
    //   kpi: { $in: kpi.children.map((child) => (child as any)._id) },
    // })
    //   .sort({ to: 1 })
    //   .exec();

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
      const data: any = {};
      for (const child of kpi.children) {
        data[child.id.split('@')[0]] = (
          await this.read({
            release: release._id,
            //@ts-ignore
            kpi: child._id,
          })
        ).value;
      }
      let value: any[] | any;
      switch (kpi.kpiType.id) {
        case 'changesPerFile':
          value = this.activeCodeService.changesPerFile(
            release.repo._id,
            since,
            release.published_at,
            release.files,
          );
          break;
        case 'changesPerRepo':
          value = this.activeCodeService.changesPerRepo(data);
          break;
        case 'avgChangesPerFile':
          value = this.activeCodeService.avgChangesPerFile(data);
          break;
        case 'stdChangesPerFile':
          value = this.activeCodeService.stdChangesPerFile(data);
          break;
        case 'activeCode':
          value = this.activeCodeService.activeCode(data);
          break;
        case 'meanActiveCode':
          value = this.activeCodeService.meanActiveCode(data);
          break;
        default:
          break;
      }
      this.create({
        kpi: kpi._id,
        release,
        since,
        to: release.published_at,
        value: await value,
      });
      since = release.published_at;
    }
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
  ): Aggregate<any> {
    const pipeline = this.kpiRunModel.aggregate();
    if (filter) {
      pipeline.match(filter);
    }

    return pipeline;
  }

  // public preAggregate(
  //   filter: FilterQuery<KpiDocument> = undefined,
  //   options: { target?: boolean; children?: boolean },
  // ): Aggregate<any[]> {
  //   const pipeline = this.kpiModel.aggregate();
  //   if (filter) {
  //     pipeline.match(filter);
  //   }
  //   pipeline.lookup(kpiTypeLookup);
  //   pipeline.addFields({
  //     type: { $arrayElemAt: ['$kpiType.id', 0] },
  //     name: { $arrayElemAt: ['$kpiType.name', 0] },
  //   });
  //   if (options.target === true) {
  //     pipeline.lookup(targetLookup);
  //     pipeline.addFields({
  //       owner: { $arrayElemAt: ['$target.owner', 0] },
  //       repo: { $arrayElemAt: ['$target.repo', 0] },
  //     });
  //   } else {
  //     pipeline.project({ target: 0 });
  //   }
  //   if (options.children) {
  //     pipeline.lookup(childrenLookup);
  //     pipeline.unwind({ path: '$children', preserveNullAndEmptyArrays: true });
  //     pipeline.group({
  //       _id: '$_id',
  //       data: { $first: '$$ROOT' },
  //       children: {
  //         $push: '$children.id',
  //       },
  //     });
  //     pipeline.addFields({
  //       'data.children': '$children',
  //     });
  //     pipeline.replaceRoot('$data');
  //   } else {
  //     pipeline.project({ children: 0 });
  //   }
  //   pipeline.project({
  //     target: 0,
  //     kpiType: 0,
  //     _id: 0,
  //     __v: 0,
  //   });

  //   return pipeline;
  // }
}

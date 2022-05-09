import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregate, FilterQuery, Model } from 'mongoose';
import { ReleaseService } from 'src/entities/releases/release.service';
import { documentExists, retrieveDocument } from 'src/lib';
import { Kpi } from '../kpis/model';
import { KpiRun, KpiRunDocument } from './model/schemas';

@Injectable()
export class KpiRunService {
  private readonly logger = new Logger(KpiRunService.name);

  constructor(
    @InjectModel(KpiRun.name) private kpiRunModel: Model<KpiRunDocument>,
    private releaseService: ReleaseService,
  ) {}

  public async calculate(kpi?: Kpi) {
    const pipeline = this.releaseService.preAggregate();
    pipeline.sort({ published_at: 1 });
    const releases = await pipeline.exec();

    let since = undefined;
    for (const release of releases) {
      // get children and their runs
      //calculationService(since, release.published_at)
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

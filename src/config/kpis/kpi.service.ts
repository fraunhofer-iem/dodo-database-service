import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregate, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import { childrenLookup, kpiTypeLookup, targetLookup } from './lib';
import { Kpi, KpiDocument } from './model/schemas';

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(
    @InjectModel(Kpi.name)
    private kpiModel: Model<KpiDocument>,
  ) {}

  public async readOrCreate(json: Kpi): Promise<KpiDocument> {
    let kpi: KpiDocument;
    try {
      kpi = await this.read({ id: json.id });
    } catch {
      kpi = await this.create(json);
    }
    return kpi;
  }

  public async read(filter: FilterQuery<KpiDocument>): Promise<KpiDocument> {
    return retrieveDocument(this.kpiModel, filter);
  }

  public async *readAll(filter: FilterQuery<KpiDocument>) {
    const kpis = await this.kpiModel.aggregate().match(filter).exec();
    yield* kpis;
  }

  public async create(json: Kpi): Promise<KpiDocument> {
    if (
      await documentExists(this.kpiModel, {
        id: json.id,
      })
    ) {
      throw new Error('KPI does already exist');
    }
    return this.kpiModel.create(json);
  }

  public preAggregate(
    filter: FilterQuery<KpiDocument> = undefined,
    options: { _id?: boolean; target?: boolean; children?: boolean },
  ): Aggregate<any[]> {
    const pipeline = this.kpiModel.aggregate();
    if (filter) {
      pipeline.match(filter);
    }
    pipeline.lookup(kpiTypeLookup);
    pipeline.addFields({
      type: { $arrayElemAt: ['$kpiType.id', 0] },
      name: { $arrayElemAt: ['$kpiType.name', 0] },
      kind: { $arrayElemAt: ['$kpiType.type', 0] },
    });
    if (options.target === true) {
      pipeline.lookup(targetLookup);
      pipeline.addFields({
        owner: { $arrayElemAt: ['$target.owner', 0] },
        repo: { $arrayElemAt: ['$target.repo', 0] },
      });
    } else {
      pipeline.project({ target: 0 });
    }
    if (options.children) {
      pipeline.lookup(childrenLookup);
      pipeline.unwind({ path: '$children', preserveNullAndEmptyArrays: true });
      pipeline.group({
        _id: '$_id',
        data: { $first: '$$ROOT' },
        children: {
          $push: '$children.id',
        },
      });
      pipeline.addFields({
        'data.children': '$children',
      });
      pipeline.replaceRoot('$data');
    } else {
      pipeline.project({ children: 0 });
    }
    pipeline.project({
      target: 0,
      kpiType: 0,
      _id: options._id ? 1 : 0,
      __v: 0,
    });

    return pipeline;
  }
}

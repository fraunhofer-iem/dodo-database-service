import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregate, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import { childrenLookup } from './lib';
import { KpiType, KpiTypeDocument } from './model/schemas';

@Injectable()
export class KpiTypeService {
  private readonly logger = new Logger(KpiTypeService.name);

  constructor(
    @InjectModel(KpiType.name)
    private kpiTypeModel: Model<KpiTypeDocument>,
  ) {}

  public async readOrCreate(json: KpiType): Promise<KpiTypeDocument> {
    let kpiType: KpiTypeDocument;
    try {
      kpiType = await this.read({ id: json.id });
    } catch {
      kpiType = await this.create(json);
    }
    return kpiType;
  }

  public async read(
    filter: FilterQuery<KpiTypeDocument>,
  ): Promise<KpiTypeDocument> {
    return retrieveDocument(this.kpiTypeModel, filter);
  }

  public async create(json: KpiType): Promise<KpiTypeDocument> {
    this.logger.debug('Storing in DB');
    if (
      await documentExists(this.kpiTypeModel, {
        id: json.id,
      })
    ) {
      throw new Error('KpiType does already exist');
    }
    return this.kpiTypeModel.create(json);
  }

  public preAggregate(
    filter: FilterQuery<KpiTypeDocument> = undefined,
  ): Aggregate<any[]> {
    const pipeline = this.kpiTypeModel.aggregate();
    if (filter) {
      pipeline.match(filter);
    }
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
    pipeline.project({
      _id: 0,
      __v: 0,
    });
    return pipeline;
  }
}

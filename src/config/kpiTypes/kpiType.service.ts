import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from 'src/lib';
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
    if (
      await documentExists(this.kpiTypeModel, {
        id: json.id,
      })
    ) {
      throw new Error('KpiType does already exist');
    }
    return this.kpiTypeModel.create(json);
  }

  public async preAggregate(
    filter: FilterQuery<KpiTypeDocument> = {},
  ): Promise<KpiTypeDocument[]> {
    return this.kpiTypeModel.aggregate().match(filter);
  }
}

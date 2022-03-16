import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { retrieveDocument } from '../../lib';
import { KPI, KpiDocument } from './model/schemas';

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(
    @InjectModel(KPI.name)
    private readonly kpiModel: Model<KpiDocument>,
  ) {}

  public async readOrCreate(json: KPI): Promise<KpiDocument> {
    let kpi: KpiDocument;
    try {
      kpi = await this.read({ id: json.id });
    } catch {
      kpi = await this.create(json);
    }
    return kpi;
  }

  public async read(filter: FilterQuery<KpiDocument>): Promise<KpiDocument> {
    try {
      return retrieveDocument(this.kpiModel, filter);
    } catch (e) {
      throw e;
    }
  }

  public async readAll(
    filter: FilterQuery<KpiDocument> = {},
  ): Promise<KpiDocument[]> {
    const pipeline = this.kpiModel.aggregate();
    pipeline.match(filter);
    pipeline.project({
      _id: 0,
      __v: 0,
    });
    return pipeline;
  }

  public async create(json: KPI): Promise<KpiDocument> {
    return this.kpiModel.create(json);
  }
}

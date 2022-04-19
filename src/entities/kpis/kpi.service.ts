import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Aggregate, Connection, FilterQuery } from 'mongoose';
import { retrieveDocument } from '../../lib';
import { KPI, KpiDocument } from './model/schemas';

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(
    @InjectConnection('lake')
    private connection: Connection,
  ) {}

  public async readOrCreate(json: KPI): Promise<KpiDocument> {
    let kpi: KpiDocument;
    try {
      kpi = await this.read(json);
    } catch {
      kpi = await this.create(json);
    }
    return kpi;
  }

  public async read(filter: FilterQuery<KpiDocument>): Promise<KpiDocument> {
    try {
      return retrieveDocument(this.connection.models['KPI'], filter);
    } catch (e) {
      throw e;
    }
  }

  public preAggregate(filter: FilterQuery<KpiDocument> = {}): Aggregate<any[]> {
    const pipeline = this.connection.models['KPI'].aggregate();
    pipeline.match(filter);
    return pipeline;
  }

  public async create(json: KPI): Promise<KpiDocument> {
    return this.connection.models['KPI'].create(json);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregate, AnyKeys, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import { DiffFile, DiffFileDocument } from './model/schemas';

@Injectable()
export class DiffFileService {
  private readonly logger = new Logger(DiffFileService.name);

  constructor(
    @InjectModel(DiffFile.name)
    private readonly repoFileModel: Model<DiffFileDocument>,
  ) {}

  public async readOrCreate(json: DiffFile): Promise<DiffFileDocument> {
    let diffFile: DiffFileDocument;
    try {
      diffFile = await this.read({ sha: json.sha });
    } catch {
      diffFile = await this.create(json);
    }
    return diffFile;
  }

  public async read(
    filter: FilterQuery<DiffFileDocument>,
  ): Promise<DiffFileDocument> {
    try {
      return retrieveDocument(this.repoFileModel, filter);
    } catch (e) {
      throw e;
    }
  }

  public async create(json: AnyKeys<DiffFile>): Promise<DiffFileDocument> {
    if (await documentExists(this.repoFileModel, { sha: json.sha })) {
      throw new Error('DiffFile does already exist');
    }
    return this.repoFileModel.create(json);
  }

  public preAggregate(
    filter: FilterQuery<DiffFileDocument> = undefined,
  ): Aggregate<any> {
    const pipeline = this.repoFileModel.aggregate();
    if (filter) {
      pipeline.match(filter);
    }
    pipeline.project({ patch: 0 });
    return pipeline;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from 'src/lib';
import { DiffFileDocument, DiffFile } from './model/schemas';

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
}

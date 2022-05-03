import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from 'src/lib';
import {
  RepositoryFile as RepositoryFileModel,
  RepositoryFileDocument,
} from './model/schemas/repositoryFile.schema';
import { RepositoryFile } from './model/RepositoryFile';

@Injectable()
export class RepositoryFileService {
  private readonly logger = new Logger(RepositoryFileService.name);

  constructor(
    @InjectModel(RepositoryFileModel.name)
    private readonly repoFileModel: Model<RepositoryFileDocument>,
  ) {}

  public async readOrCreate(
    json: RepositoryFile,
  ): Promise<RepositoryFileDocument> {
    let repoFile: RepositoryFileDocument;
    try {
      repoFile = await this.read({ path: json.path });
    } catch {
      repoFile = await this.create(json);
    }
    return repoFile;
  }

  public async read(
    filter: FilterQuery<RepositoryFileDocument>,
  ): Promise<RepositoryFileDocument> {
    try {
      return await retrieveDocument(this.repoFileModel, filter);
    } catch (e) {
      throw e;
    }
  }

  public async create(
    json: AnyKeys<RepositoryFile>,
  ): Promise<RepositoryFileDocument> {
    if (await documentExists(this.repoFileModel, { path: json.path })) {
      throw new Error('RepositoryFile does already exist');
    }
    return this.repoFileModel.create(json);
  }
}

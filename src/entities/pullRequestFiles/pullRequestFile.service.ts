import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from 'src/lib';
import { PullRequestFileDocument, PullRequestFile } from './model/schemas';

@Injectable()
export class PullRequestFileService {
  private readonly logger = new Logger(PullRequestFileService.name);

  constructor(
    @InjectModel(PullRequestFile.name)
    private readonly repoFileModel: Model<PullRequestFileDocument>,
  ) {}

  public async readOrCreate(
    json: PullRequestFile,
  ): Promise<PullRequestFileDocument> {
    let pullRequestFile: PullRequestFileDocument;
    try {
      pullRequestFile = await this.read({ sha: json.sha });
    } catch {
      pullRequestFile = await this.create(json);
    }
    return pullRequestFile;
  }

  public async read(
    filter: FilterQuery<PullRequestFileDocument>,
  ): Promise<PullRequestFileDocument> {
    try {
      return retrieveDocument(this.repoFileModel, filter);
    } catch (e) {
      throw e;
    }
  }

  public async create(json: PullRequestFile): Promise<PullRequestFileDocument> {
    if (await documentExists(this.repoFileModel, { sha: json.sha })) {
      throw new Error('PullRequestFile does already exist');
    }
    return this.repoFileModel.create(json);
  }
}

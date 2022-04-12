import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { retrieveDocument } from 'src/lib';
import { PullRequest } from './model';
import {
  PullRequestDocument,
  PullRequest as PullRequestM,
} from './model/schemas';

@Injectable()
export class PullRequestService {
  private readonly logger = new Logger(PullRequestService.name);

  constructor(
    @InjectModel(PullRequestM.name)
    private readonly pullRequestModel: Model<PullRequestDocument>,
  ) {}

  public async readOrCreate(json: PullRequest): Promise<PullRequestDocument> {
    let pullRequest: PullRequestDocument;
    try {
      pullRequest = await this.read({ node_id: json.node_id });
    } catch {
      pullRequest = await this.create(json);
    }
    return pullRequest;
  }

  public async read(
    filter: FilterQuery<PullRequestDocument>,
  ): Promise<PullRequestDocument> {
    try {
      return retrieveDocument(this.pullRequestModel, filter);
    } catch (e) {
      throw e;
    }
  }

  public async create(json: PullRequest): Promise<PullRequestDocument> {
    return this.pullRequestModel.create(json);
  }
}

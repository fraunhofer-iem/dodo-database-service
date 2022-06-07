import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import { PullRequest } from './model';
import {
  PullRequest as PullRequestModel,
  PullRequestDocument,
} from './model/schemas';

@Injectable()
export class PullRequestService {
  private readonly logger = new Logger(PullRequestService.name);

  constructor(
    @InjectModel(PullRequestModel.name)
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

  public async create(
    json: AnyKeys<PullRequest>,
  ): Promise<PullRequestDocument> {
    if (
      await documentExists(this.pullRequestModel, { node_id: json.node_id })
    ) {
      throw new Error('PullRequest does already exist');
    }
    return this.pullRequestModel.create(json);
  }
}

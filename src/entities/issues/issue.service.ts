import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import { Issue, IssueDocument } from './model/schemas';
@Injectable()
export class IssueService {
  private readonly logger = new Logger(IssueService.name);

  constructor(
    @InjectModel(Issue.name)
    private readonly issueModel: Model<IssueDocument>,
  ) {}

  public async read(
    filter: FilterQuery<IssueDocument>,
  ): Promise<IssueDocument> {
    let issue: IssueDocument;
    try {
      issue = await retrieveDocument(this.issueModel, filter);
    } catch (e) {
      throw e;
    }
    return issue;
  }

  public async create(json: AnyKeys<IssueDocument>) {
    if (await documentExists(this.issueModel, { node_id: json.node_id })) {
      throw new Error('Issue does already exist');
    }
    return this.issueModel.create(json);
  }
}

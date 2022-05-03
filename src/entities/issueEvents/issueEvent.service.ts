import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from 'src/lib';
import { IssueEvent, IssueEventDocument } from './model/schemas';

@Injectable()
export class IssueEventService {
  private readonly logger = new Logger(IssueEventService.name);

  constructor(
    @InjectModel(IssueEvent.name)
    private readonly issueEventModel: Model<IssueEventDocument>,
  ) {}

  public async readOrCreate(json: IssueEvent): Promise<IssueEventDocument> {
    let issueEvent: IssueEventDocument;
    try {
      issueEvent = await this.read({ node_id: json.node_id });
    } catch {
      issueEvent = await this.create(json);
    }
    return issueEvent;
  }

  public async read(
    filter: FilterQuery<IssueEventDocument>,
  ): Promise<IssueEventDocument> {
    let issueEvent: IssueEventDocument;
    try {
      issueEvent = await retrieveDocument(this.issueEventModel, filter);
    } catch (e) {
      throw e;
    }
    return issueEvent;
  }

  public async create(json: AnyKeys<IssueEvent>): Promise<IssueEventDocument> {
    if (await documentExists(this.issueEventModel, { node_id: json.node_id })) {
      throw new Error('IssueEvent does already exist!');
    }
    return this.issueEventModel.create(json);
  }
}

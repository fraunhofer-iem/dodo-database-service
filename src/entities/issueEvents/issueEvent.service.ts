import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IssueEvent, IssueEventDocument } from './model/schemas';

@Injectable()
export class IssueEventService {
  private readonly logger = new Logger(IssueEventService.name);

  constructor(
    @InjectModel(IssueEvent.name)
    private readonly issueEventModel: Model<IssueEventDocument>,
  ) {}

  public async create(json: IssueEvent): Promise<IssueEventDocument> {
    return this.issueEventModel.create(json);
  }
}

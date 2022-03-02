import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { retrieveDocument } from '../../lib';
import { Milestone, MilestoneDocument } from './model/schemas';

@Injectable()
export class MilestoneService {
  private readonly logger = new Logger(MilestoneService.name);

  constructor(
    @InjectModel(Milestone.name)
    private readonly milestoneModel: Model<MilestoneDocument>,
  ) {}

  public async readOrCreate(json: Milestone): Promise<MilestoneDocument> {
    let milestone: MilestoneDocument;
    try {
      milestone = await this.read({ node_id: json.node_id });
    } catch {
      milestone = await this.create(json);
    }
    return milestone;
  }

  public async read(
    filter: FilterQuery<MilestoneDocument>,
  ): Promise<MilestoneDocument> {
    try {
      return retrieveDocument(this.milestoneModel, filter);
    } catch (e) {
      throw e;
    }
  }

  public async create(json: Milestone): Promise<MilestoneDocument> {
    return this.milestoneModel.create(json);
  }
}

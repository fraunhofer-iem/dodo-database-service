import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { documentExists } from '../../lib';
import { Label, LabelDocument } from './model/schemas';

@Injectable()
export class LabelService {
  private readonly logger = new Logger(LabelService.name);

  constructor(
    @InjectModel(Label.name)
    private readonly labelModel: Model<LabelDocument>,
  ) {}

  public async validate(json: Label): Promise<LabelDocument> {
    // TODO: is there a term for "look for object and create if not"?
    let label: LabelDocument;
    try {
      label = await this.read({ node_id: json.node_id });
    } catch {
      label = await this.create(json);
    }
    return label;
  }

  public async read(
    filter: FilterQuery<LabelDocument>,
  ): Promise<LabelDocument> {
    if (!(await documentExists(this.labelModel, filter))) {
      throw new Error('Label does not exist');
    }
    return this.labelModel.findOne(filter).exec();
  }

  public async create(json: Label): Promise<LabelDocument> {
    return this.labelModel.create(json);
  }
}

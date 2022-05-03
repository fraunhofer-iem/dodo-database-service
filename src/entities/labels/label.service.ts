import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import { Label, LabelDocument } from './model/schemas';

@Injectable()
export class LabelService {
  private readonly logger = new Logger(LabelService.name);

  constructor(
    @InjectModel(Label.name)
    private readonly labelModel: Model<LabelDocument>,
  ) {}

  public async readOrCreate(json: Label): Promise<LabelDocument> {
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
    try {
      return retrieveDocument(this.labelModel, filter);
    } catch (e) {
      throw e;
    }
  }

  public async create(json: AnyKeys<Label>): Promise<LabelDocument> {
    if (await documentExists(this.labelModel, { node_id: json.node_id })) {
      throw new Error('Label does already exist');
    }
    return this.labelModel.create(json);
  }
}

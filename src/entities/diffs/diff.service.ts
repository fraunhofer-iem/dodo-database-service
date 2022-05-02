import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import { Diff, DiffDocument } from './model/schemas';

@Injectable()
export class DiffService {
  private readonly logger = new Logger(DiffService.name);

  constructor(
    @InjectModel(Diff.name)
    private readonly diffModel: Model<DiffDocument>,
  ) {}

  public async read(filter: FilterQuery<DiffDocument>): Promise<DiffDocument> {
    let diff: DiffDocument;
    try {
      diff = await retrieveDocument(this.diffModel, filter);
    } catch (e) {
      throw e;
    }
    return diff;
  }

  public async create(json: AnyKeys<DiffDocument>) {
    if (
      await documentExists(this.diffModel, { pullRequest: json.pullRequest })
    ) {
      throw new Error('Diff does already exist');
    }
    return this.diffModel.create(json);
  }
}

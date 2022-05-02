import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from 'src/lib';
import { DodoTarget, DodoTargetDocument } from './model/schemas';

@Injectable()
export class DodoTargetService {
  private readonly logger = new Logger(DodoTargetService.name);

  constructor(
    @InjectModel(DodoTarget.name)
    private targetModel: Model<DodoTargetDocument>,
  ) {}

  public async readOrCreate(json: DodoTarget): Promise<DodoTargetDocument> {
    let target: DodoTargetDocument;
    try {
      target = await this.read({ owner: json.owner, repo: json.repo });
    } catch {
      target = await this.create(json);
    }
    return target;
  }

  public async readAll(
    filter: FilterQuery<DodoTargetDocument> = {},
  ): Promise<DodoTargetDocument[]> {
    return this.targetModel.aggregate().match(filter).exec();
  }

  public async read(
    filter: FilterQuery<DodoTargetDocument>,
  ): Promise<DodoTargetDocument> {
    return retrieveDocument(this.targetModel, filter);
  }

  public async create(json: DodoTarget): Promise<DodoTargetDocument> {
    if (
      await documentExists(this.targetModel, {
        owner: json.owner,
        repo: json.repo,
      })
    ) {
      throw new Error('Target does already exist');
    }
    return this.targetModel.create(json);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import { Commit, CommitDocument } from './model/schemas';

@Injectable()
export class CommitService {
  private readonly logger = new Logger(CommitService.name);

  constructor(
    @InjectModel(Commit.name)
    private readonly commitModel: Model<CommitDocument>,
  ) {}

  public async readOrCreate(json: Commit): Promise<CommitDocument> {
    let commit: CommitDocument;
    try {
      commit = await this.read({ url: json.url });
    } catch {
      commit = await this.create(json);
    }
    return commit;
  }

  public async read(
    filter: FilterQuery<CommitDocument>,
  ): Promise<CommitDocument> {
    let commit: CommitDocument;
    try {
      commit = await retrieveDocument(this.commitModel, filter);
    } catch (e) {
      throw e;
    }
    return commit;
  }

  public async create(json: AnyKeys<Commit>) {
    if (await documentExists(this.commitModel, { url: json.url })) {
      throw new Error('Commit does already exist');
    }
    return this.commitModel.create(json);
  }
}

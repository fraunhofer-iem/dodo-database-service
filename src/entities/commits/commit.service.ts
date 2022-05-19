import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model, Aggregate } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import { authorLookup, filesLookup, repoLookup } from './lib';
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

  public preAggregate(
    filter: FilterQuery<Commit> = undefined,
    options: {
      author?: boolean;
      repo?: boolean;
      files?: boolean;
      since?: Date | string;
      to?: Date | string;
    },
  ): Aggregate<any> {
    const pipeline = this.commitModel.aggregate();
    if (filter) {
      pipeline.match(filter);
    }
    pipeline.addFields({
      timestamp: {
        $dateFromString: {
          dateString: '$timestamp',
        },
      },
    });
    if (options.since) {
      pipeline.match({
        timestamp: { $gte: new Date(options.since) },
      });
    }
    if (options.to) {
      pipeline.match({
        timestamp: { $lte: new Date(options.to) },
      });
    }
    if (options.author) {
      pipeline.lookup(authorLookup);
      pipeline.addFields({
        author: {
          $arrayElemAt: ['$author', 0],
        },
      });
    } else {
      pipeline.project({ author: 0 });
    }
    if (options.files) {
      pipeline.lookup(filesLookup);
    } else {
      pipeline.project({ files: 0 });
    }
    if (options.repo) {
      pipeline.lookup(repoLookup);
      pipeline.addFields({
        repo: {
          $arrayElemAt: ['$repo', 0],
        },
      });
    } else {
      pipeline.project({ repo: 0 });
    }
    return pipeline;
  }
}

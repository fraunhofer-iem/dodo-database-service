import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregate, AnyKeys, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import { commitsLookup, filesLookup, repoLookup } from './lib';
import { Release, ReleaseDocument } from './model/schemas';

@Injectable()
export class ReleaseService {
  private readonly logger = new Logger(ReleaseService.name);

  constructor(
    @InjectModel(Release.name)
    private readonly releaseModel: Model<ReleaseDocument>,
  ) {}

  public async readOrCreate(json: Release): Promise<ReleaseDocument> {
    let release: ReleaseDocument;
    try {
      release = await this.read({ node_id: json.node_id });
    } catch {
      release = await this.create(json);
    }
    return release;
  }

  public async read(
    filter: FilterQuery<ReleaseDocument>,
  ): Promise<ReleaseDocument> {
    let release: ReleaseDocument;
    try {
      release = await retrieveDocument(this.releaseModel, filter);
    } catch (e) {
      throw e;
    }
    return release;
  }

  public async create(json: AnyKeys<Release>) {
    if (await documentExists(this.releaseModel, { node_id: json.node_id })) {
      throw new Error('Release does already exist');
    }
    return this.releaseModel.create(json);
  }

  public preAggregate(
    filter: FilterQuery<ReleaseDocument> = undefined,
    options: { repo?: boolean; files?: boolean; commits?: boolean },
  ): Aggregate<any> {
    const pipeline = this.releaseModel.aggregate();
    if (filter) {
      pipeline.match(filter);
    }
    pipeline.addFields({
      created_at: {
        $dateFromString: {
          dateString: '$created_at',
        },
      },
      published_at: {
        $dateFromString: {
          dateString: '$published_at',
        },
      },
    });
    if (options.files) {
      pipeline.lookup(filesLookup);
    } else {
      pipeline.project({
        files: 0,
      });
    }
    if (options.repo) {
      pipeline.lookup(repoLookup);
      pipeline.addFields({
        repo: {
          $arrayElemAt: ['$repo', 0],
        },
      });
      pipeline.project({
        'repo.releases': 0,
        'repo.diffs': 0,
        'repo.commits': 0,
        'repo.issues': 0,
      });
    }
    if (options.commits) {
      pipeline.lookup(commitsLookup);
    }
    return pipeline;
  }
}

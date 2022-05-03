import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
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
}

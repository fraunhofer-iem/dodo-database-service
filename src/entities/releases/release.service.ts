import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { updateArray } from '../../lib';
import { RepositoryIdentifier } from '../repositories/model';
import { Repository, RepositoryDocument } from '../repositories/model/schemas';
import { queryReleases } from './lib/queryReleases';
import { Release as ReleaseM, ReleaseDocument } from './model/schemas';

@Injectable()
export class ReleaseService {
  private readonly logger = new Logger(ReleaseService.name);

  constructor(
    @InjectModel(ReleaseM.name)
    private readonly releaseModel: Model<ReleaseDocument>,
    @InjectModel(Repository.name)
    private readonly repoModel: Model<RepositoryDocument>,
  ) {}

  public async storeReleases(
    repoIdent: RepositoryIdentifier,
    repoId: string,
    pageNumber = 1,
  ) {
    const releases = await queryReleases(repoIdent, pageNumber);
    const releaseDocuments: ReleaseDocument[] = [];
    for (const release of releases) {
      this.logger.log(`Storing release ${release.tag_name}`);
      const releaseDocument = await this.releaseModel.create(release);
      releaseDocuments.push(releaseDocument);
    }

    await updateArray(this.repoModel, repoId, { releases: releaseDocuments });

    if (releases.length == 100) {
      this.storeReleases(repoIdent, repoId, pageNumber + 1);
    }
  }
}

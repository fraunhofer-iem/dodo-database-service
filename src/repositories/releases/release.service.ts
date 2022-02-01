import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OCTOKIT, updateArray } from '../../lib';
import { RepositoryIdentifier } from '../model';
import { Repository, RepositoryDocument } from '../model/schemas';
import { Release } from './model';
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
    const releases = await this.queryReleases(repoIdent, pageNumber);

    for (const release of releases) {
      await this.saveReleases(release, repoId);
    }
    if (releases.length == 100) {
      this.storeReleases(repoIdent, repoId, pageNumber + 1);
    }
  }

  private async queryReleases(
    repoIdent: RepositoryIdentifier,
    pageNumber: number,
  ) {
    const { owner, repo } = repoIdent;
    return OCTOKIT.rest.repos
      .listReleases({
        owner: owner,
        repo: repo,
        per_page: 100,
        page: pageNumber,
      })
      .then((res) => res.data);
  }
  /**
   * function to save releases
   * @param release
   * @param repoId
   * @returns
   */
  private async saveReleases(release: Release, repoId: string) {
    this.logger.debug('saving Releases to database');
    const releaseModel = new this.releaseModel();

    this.logger.debug(release);
    releaseModel.url = release.url;
    releaseModel.id = release.id;
    releaseModel.node_id = release.node_id;
    releaseModel.name = release.name;
    releaseModel.created_at = release.created_at;
    releaseModel.published_at = release.published_at;

    const savedRelease = await releaseModel.save();

    await updateArray(this.repoModel, repoId, { releases: [savedRelease] });

    this.logger.debug('saving releases to database finished');

    return releaseModel.save();
  }
}

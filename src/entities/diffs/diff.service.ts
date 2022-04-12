import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { updateArray } from '../../lib';
import { Diff, DiffDocument } from './model/schemas';
import { Diff as DiffModel } from './model';
import { RepositoryIdentifier } from '../repositories/model';
import { Repository, RepositoryDocument } from '../repositories/model/schemas';
import { getPullRequestFiles, getRepoFiles, pullRequestQuerier } from './lib';

@Injectable()
export class DiffService {
  private readonly logger = new Logger(DiffService.name);

  constructor(
    @InjectModel(Repository.name)
    private readonly repoModel: Model<RepositoryDocument>,
    @InjectModel(Diff.name)
    private readonly diffModel: Model<DiffDocument>,
  ) {}

  public async storeDiffs(repoIdent: RepositoryIdentifier, repoId: string) {
    for await (const pullRequest of pullRequestQuerier(repoIdent)) {
      this.logger.log(`Storing diff for pull request ${pullRequest.number}`);
      const diff: DiffModel = {
        pullRequest: pullRequest,
        pullRequestFiles: await getPullRequestFiles(repoIdent, pullRequest),
        repositoryFiles: await getRepoFiles(repoIdent, pullRequest),
      };
      const diffDocument = await this.diffModel.create(diff);
      await updateArray(this.repoModel, repoId, { diffs: diffDocument });
    }
  }
}

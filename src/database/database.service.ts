import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Diff } from 'src/github-api/model/PullRequest';
import { RepositoryIdentifierDto } from 'src/github-api/model/RepositoryIdentifierDto';
import { DiffDocument } from './schemas/diff.schema';
import { PullRequestDocument } from './schemas/pullRequest.schema';
import { PullRequestFileDocument } from './schemas/pullRequestFile.schema';
import { RepositoryDocument } from './schemas/repository.schema';
import { RepositoryFileDocument } from './schemas/repositoryFile.schema';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
    @InjectModel('RepositoryFiles')
    private readonly repoFileModel: Model<RepositoryFileDocument>,
    @InjectModel('PullRequestFiles')
    private readonly pullFileModel: Model<PullRequestFileDocument>,
    @InjectModel('PullRequest')
    private readonly pullRequestModel: Model<PullRequestDocument>,
    @InjectModel('Diff') private readonly diffModel: Model<DiffDocument>,
  ) {}

  /**
   * Creates the specified repository if it doesn't exist.
   * If it exists it returns the id of the existing one.
   * @param repo
   * @param owner
   * @returns id
   */
  async createRepo(repoIdent: RepositoryIdentifierDto): Promise<string> {
    if (
      await this.repoModel.exists({
        repo: repoIdent.repo,
        owner: repoIdent.owner,
      })
    ) {
      const repoM = await this.repoModel
        .findOne({ repo: repoIdent.repo, owner: repoIdent.owner })
        .exec();

      this.logger.debug('Model already exists ' + repoM);
      return repoM._id;
    } else {
      this.logger.debug(
        `Creating new model for ${repoIdent.repo} with owner ${repoIdent.owner}`,
      );
      const repoInstance = await new this.repoModel({
        owner: repoIdent.owner,
        repo: repoIdent.repo,
        diffs: [],
      }).save();

      this.logger.debug('Instance created ' + repoInstance);
      return repoInstance._id;
    }
  }

  async savePullRequestDiff(repoId: string, pullRequestDiff: Diff) {
    this.logger.debug('saving diff to database');
    const createdDiff = new this.diffModel();

    const pullRequest = await new this.pullRequestModel(
      pullRequestDiff.pullRequest,
    ).save();

    const changedFiles = await this.pullFileModel.create(
      pullRequestDiff.changedFiles,
    );

    const repoFiles = await this.repoFileModel.create(
      pullRequestDiff.repoFiles,
    );
    createdDiff.pullRequestFiles = changedFiles;

    createdDiff.repositoryFiles = repoFiles;
    createdDiff.pullRequest = pullRequest;
    const savedDiff = await createdDiff.save();
    await this.repoModel
      .findByIdAndUpdate(repoId, {
        $push: { diffs: [savedDiff] },
      })
      .exec();
    this.logger.debug('saving diff to database finished');
  }
}

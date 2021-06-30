import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Diff } from 'src/github-api/model/PullRequest';
import { DiffDocument } from './schemas/diff.schema';
import { PullRequestDocument } from './schemas/pullRequest.schema';
import { PullRequestFileDocument } from './schemas/pullRequestFile.schema';
import { RepositoryDocument } from './schemas/repository.schema';
import { RepositoryFileDocument } from './schemas/repositoryFile.schema';

@Injectable()
export class DatabaseService {
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
  async createRepo(repo: string, owner: string): Promise<string> {
    if (await this.repoModel.exists({ repo, owner })) {
      return (await this.repoModel.findOne({ repo, owner }).exec())._id;
    } else {
      const repoInstance = new this.repoModel();
      repoInstance.owner = owner;
      repoInstance.repo = repo;
      const saved = await repoInstance.save();
      return saved._id;
    }
  }

  async savePullRequestDiff(repo: string, pullRequestDiff: Diff) {
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
    return createdDiff.save();
    // promises.push(pullRequest.save());
    // const changedFiles = pullRequestDiff.changedFiles.map((file) => {
    //   const changedFile = new this.pullFileModel(file);
    //   promises.push(changedFile.save());
    //   return changedFile;
    // });
    // const repoFiles = pullRequestDiff.repoFiles.map((file) => {
    //   const repoFile = new this.repoFileModel(file);
    //   promises.push(repoFile.save());
    //   return repoFile;
    // });
    // promises.push(pullRequest.save());

    // return Promise.all(promises);
  }
}

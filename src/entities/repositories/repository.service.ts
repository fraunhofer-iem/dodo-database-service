import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repository, RepositoryDocument } from './model/schemas';
import { CreateRepositoryDto } from './model';
import { documentExists } from '../../lib';
import { IssueService } from '../issues/issue.service';
import { CommitService } from '../commits/commit.service';
import { ReleaseService } from '../releases/release.service';
import { PullRequestService } from '../pullRequests/pullRequest.service';

@Injectable()
export class RepositoryService {
  private readonly logger = new Logger(RepositoryService.name);

  constructor(
    @InjectModel(Repository.name)
    private readonly repoModel: Model<RepositoryDocument>,
    private issueService: IssueService,
    private commitService: CommitService,
    private releaseService: ReleaseService,
    private pullRequestService: PullRequestService,
  ) {}

  public async initializeRepository(createRepoDto: CreateRepositoryDto) {
    const repo = await this.getRepo(createRepoDto);
    await this.issueService.storeIssues(createRepoDto, repo._id);
    await this.commitService.storeCommits(createRepoDto, repo._id);
    await this.releaseService.storeReleases(createRepoDto, repo._id);
    await this.pullRequestService.storePullRequestDiffsForRepo(
      createRepoDto,
      repo._id,
    );
    return repo;
  }

  public async getRepositoryById(id: string) {
    return this.repoModel.findById(id).exec();
  }

  /**
   * Creates the specified repository if it doesn't exist.
   * If it exists it returns the existing one.
   */
  private async getRepo(
    repoIdent: CreateRepositoryDto,
  ): Promise<RepositoryDocument> {
    if (
      await documentExists(this.repoModel, {
        repo: repoIdent.repo,
        owner: repoIdent.owner,
      })
    ) {
      this.logger.log(
        `Model for ${repoIdent.repo} with owner ${repoIdent.owner} already exists`,
      );
      return this.repoModel
        .findOne({ repo: repoIdent.repo, owner: repoIdent.owner })
        .exec();
    } else {
      this.logger.log(
        `Creating new model for ${repoIdent.repo} with owner ${repoIdent.owner}`,
      );
      return new this.repoModel({
        owner: repoIdent.owner,
        repo: repoIdent.repo,
        commits: [],
        releases: [],
        diffs: [],
        issues: [],
      }).save();
    }
  }
}

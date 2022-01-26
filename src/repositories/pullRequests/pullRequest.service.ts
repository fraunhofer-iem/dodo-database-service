import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Octokit } from 'octokit';
import { OCTOKIT } from 'src/lib/OctokitHelper';
import { RepositoryIdentifier } from '../model/RepositoryDtos';
import { RepositoryDocument } from '../model/schemas';
import {
  getMergeTargetAndFeatureFiles,
  getPullRequests,
  savePullRequestDiff,
} from './lib';
import { PullRequest } from './model';
import {
  RepositoryFileDocument,
  PullRequestFileDocument,
  PullRequestDocument,
  DiffDocument,
} from './model/schemas';

export interface Tree {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
  url?: string;
}

@Injectable()
export class PullRequestService {
  private readonly logger = new Logger(PullRequestService.name);
  private readonly octokit: Octokit;

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
    @InjectModel('RepositoryFiles')
    private readonly repoFileModel: Model<RepositoryFileDocument>,
    @InjectModel('PullRequestFiles')
    private readonly pullFileModel: Model<PullRequestFileDocument>,
    @InjectModel('PullRequest')
    private readonly pullRequestModel: Model<PullRequestDocument>,
    @InjectModel('Diff')
    private readonly diffModel: Model<DiffDocument>,
  ) {
    // init octokit
    this.octokit = OCTOKIT;
  }

  /**
   *
   * Queries all pull requests for the repository. For each pull request the changed files are queried.
   * Additionally, the content of the main branch is queried and stored alongside the changes.
   *
   * @returns the id of the repository
   *
   */
  public async storePullRequestDiffsForRepo(
    repoIdent: RepositoryIdentifier,
    repoId: string,
  ) {
    this.logger.log(
      `querying pull requests for ${repoIdent.owner}/${repoIdent.repo}`,
    );

    this.processPullRequests(repoIdent, repoId, 1);

    return repoId;
  }

  private async processPullRequests(
    repoIdent: RepositoryIdentifier,
    repoId: string,
    pageNumber: number,
  ) {
    const pullRequests = await getPullRequests(
      this.octokit,
      repoIdent,
      pageNumber,
    );
    this.logger.log(
      pullRequests.length + ' pull requests received at number ' + pageNumber,
    );

    for (const pullRequest of pullRequests) {
      this.logger.log('First request diff started');
      await this.storePullRequestDiff(repoIdent, pullRequest, repoId);
      this.logger.log('First request diff finished');
    }

    if (pullRequests.length == 100) {
      this.processPullRequests(repoIdent, repoId, pageNumber + 1);
    }
  }

  private async storePullRequestDiff(
    repoIdent: RepositoryIdentifier,
    pullRequest: PullRequest,
    repoId: string,
  ) {
    const mergeTargetSha = pullRequest.base.sha;

    this.logger.log(
      'Querying all files of pull request number ' + pullRequest.number,
    );
    const { featFiles, mergeTargetFiles } = await getMergeTargetAndFeatureFiles(
      this.octokit,
      repoIdent,
      pullRequest.number,
      mergeTargetSha,
    );
    this.logger.log(
      ` ${featFiles.length} Files were changed in pull request number 
        ${pullRequest.number}`,
    );

    await savePullRequestDiff(
      repoId,
      {
        pullRequest: pullRequest,
        changedFiles: featFiles,
        repoFiles: mergeTargetFiles,
      },
      {
        Repo: this.repoModel,
        RepoFile: this.repoFileModel,
        PullFile: this.pullFileModel,
        PullRequest: this.pullRequestModel,
        DiffModel: this.diffModel,
      },
    );

    this.logger.log(`Diff for pull request ${pullRequest.number} was stored`);
  }
}

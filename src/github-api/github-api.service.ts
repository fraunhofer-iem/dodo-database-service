import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from 'octokit';
import { DatabaseService } from 'src/database/database.service';
import { StatisticService } from 'src/database/statistic.service';
import {
  PullRequest,
  PullRequestFile,
  RepositoryFile,
} from './model/PullRequest';
import { RepositoryIdentifierDto } from './model/RepositoryIdentifierDto';

export interface Tree {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
  url?: string;
}

enum FileType {
  file = 'blob',
  folder = 'tree',
}

@Injectable()
export class GithubApiService {
  private readonly logger = new Logger(GithubApiService.name);
  private readonly octokit: Octokit;

  private getOctokitClient() {
    const token = process.env.GITHUB_ACCESS_TOKEN;
    if (token) {
      return new Octokit({
        auth: token,
      });
    } else {
      this.logger.warn(
        'If no access token is provided the request limit is set to 60 requests per hour, which is not sufficient for most use cases.',
      );
      return new Octokit();
    }
  }

  constructor(
    private statisticService: StatisticService,
    private dbService: DatabaseService,
  ) {
    // init octokit
    this.octokit = this.getOctokitClient();
  }

  public async printRateLimit() {
    const rateLimit = await this.octokit.request('GET /rate_limit');
    this.logger.log(rateLimit.data);
  }

  public async getStatistics(repoIdent: RepositoryIdentifierDto) {
    this.statisticService.getMostChangedFiles(repoIdent);
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
    repoIdent: RepositoryIdentifierDto,
  ) {
    const repoId = await this.dbService.createRepo(repoIdent);

    this.logger.log(
      `querying pull requests for ${repoIdent.owner}/${repoIdent.repo}`,
    );

    const allPullRequests = await this.getAdditionalPullRequests(
      repoIdent.owner,
      repoIdent.repo,
      1,
      [],
    );

    this.logger.log(allPullRequests.length + ' pull requests received');

    allPullRequests.forEach((pullRequest) => {
      this.storePullRequestDiff(
        repoIdent.owner,
        repoIdent.repo,
        pullRequest,
        repoId,
      );
    });

    return repoId;
  }

  private async getAdditionalPullRequests(
    owner: string,
    repo: string,
    pageNumber: number,
    allRequests: PullRequest[],
  ): Promise<PullRequest[]> {
    const pullRequests = await this.octokit.rest.pulls.list({
      owner: owner,
      repo: repo,
      state: 'all',
      sort: 'created',
      direction: 'asc',
      per_page: 100,
      page: pageNumber,
    });
    this.logger.log(
      pullRequests.data.length +
        ' pull requests received at number ' +
        pageNumber,
    );
    allRequests.push(...pullRequests.data);
    if (pullRequests.data.length == 100) {
      return this.getAdditionalPullRequests(
        owner,
        repo,
        pageNumber + 1,
        allRequests,
      );
    } else {
      return allRequests;
    }
  }

  private async storePullRequestDiff(
    owner: string,
    repo: string,
    pullRequest: PullRequest,
    repoId: string,
  ) {
    const mergeTarget = pullRequest.base;

    this.logger.log(
      'Querying all files of pull request number ' + pullRequest.number,
    );

    const featFilesPromise: Promise<PullRequestFile[]> = this.octokit.rest.pulls
      .listFiles({
        owner: owner,
        repo: repo,
        pull_number: pullRequest.number,
      })
      .then((res) => res.data);

    const mergeTargetFilesPromise: Promise<RepositoryFile[]> =
      this.getAllFilesFromTree(owner, repo, mergeTarget.sha);

    Promise.all([featFilesPromise, mergeTargetFilesPromise]).then((res) => {
      const featFiles = res[0];
      const mergeTargetFiles = res[1];

      this.logger.log(
        featFiles.length +
          ' Files were changed in pull request number ' +
          pullRequest.number,
      );

      this.dbService.savePullRequestDiff(repoId, {
        pullRequest: pullRequest,
        changedFiles: featFiles,
        repoFiles: mergeTargetFiles,
      });
    });
  }

  private async getAllFilesFromTree(
    owner: string,
    repo: string,
    treeSha: string,
  ): Promise<RepositoryFile[]> {
    this.logger.log('Querying the tree for sha ' + treeSha);
    const baseTree = await this.octokit.rest.git.getTree({
      tree_sha: treeSha,
      owner: owner,
      repo: repo,
      recursive: 'true',
    });

    const files = baseTree.data.tree.filter((v) => v.type == FileType.file);
    this.logger.log(
      'The tree contains ' +
        baseTree.data.tree.length +
        ' from which ' +
        files.length +
        ' are files.',
    );
    return files;
  }
}

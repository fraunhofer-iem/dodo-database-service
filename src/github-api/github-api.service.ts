import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from 'octokit';
import { DatabaseService } from 'src/database/database.service';
import { StatisticService } from 'src/database/statistic.service';
import { PullRequest, RepositoryFile } from './model/PullRequest';
import { CreateRepositoryDto, RepositoryNameDto } from './model/Repository';

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

  public async getStatistics(repoIdent: RepositoryNameDto) {
    this.statisticService.getMostChangedFiles(repoIdent);
    this.statisticService.getFilesChangedTogether(repoIdent);
    this.statisticService.sizeOfPullRequest(repoIdent);
  }

  public async storeIssues(repoIdent: RepositoryNameDto) {
    this.processIssues(
      repoIdent.owner,
      repoIdent.repo,
      await this.dbService.getRepoByName(repoIdent.owner, repoIdent.repo),
      1,
    );
  }

  private async processIssues(
    owner: string,
    repo: string,
    repoId: string,
    pageNumber: number,
  ) {
    const issues = await this.octokit.rest.issues
      .listForRepo({
        owner: owner,
        repo: repo,
        filter: 'assigned',
        state: 'all',
        per_page: 100,
        page: pageNumber,
      })
      .then((res) => res.data);

    await this.dbService.saveIssues(issues, repoId);

    if (issues.length == 100) {
      this.processIssues(owner, repo, repoId, pageNumber + 1);
    }
  }

  public async createRepo(repo: CreateRepositoryDto) {
    return this.dbService.createRepo(repo);
  }

  /**
   *
   * Queries all pull requests for the repository. For each pull request the changed files are queried.
   * Additionally, the content of the main branch is queried and stored alongside the changes.
   *
   * @returns the id of the repository
   *
   */
  public async storePullRequestDiffsForRepo(repoIdent: RepositoryNameDto) {
    const repoId = await this.dbService.createRepo(repoIdent);

    this.logger.log(
      `querying pull requests for ${repoIdent.owner}/${repoIdent.repo}`,
    );

    this.processPullRequests(repoIdent.owner, repoIdent.repo, repoId, 1);

    return repoId;
  }

  /**
   *
   * @param repoIdent
   * @returns
   * Status: 200 exists
   * Status: 301 Moved Permanently
   * Status: 403 Forbidden
   * Status: 404 Not Found
   */
  public async getStatus(repoIdent: RepositoryNameDto): Promise<number> {
    return this.octokit.rest.repos
      .get({
        owner: repoIdent.owner,
        repo: repoIdent.repo,
      })
      .catch((r) => {
        if ('status' in r) {
          return r.status;
        } else {
          return 500;
        }
      });
  }

  private async processPullRequests(
    owner: string,
    repo: string,
    repoId: string,
    pageNumber: number,
  ) {
    const pullRequests = await this.octokit.rest.pulls
      .list({
        owner: owner,
        repo: repo,
        state: 'all',
        sort: 'created',
        direction: 'asc',
        per_page: 100,
        page: pageNumber,
      })
      .then((res) => res.data);
    this.logger.log(
      pullRequests.length + ' pull requests received at number ' + pageNumber,
    );

    for (const pullRequest of pullRequests) {
      this.logger.log('First request diff started');
      await this.storePullRequestDiff(owner, repo, pullRequest, repoId);
      this.logger.log('First request diff finished');
    }

    if (pullRequests.length == 100) {
      this.processPullRequests(owner, repo, repoId, pageNumber + 1);
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

    const featFiles = await this.octokit.rest.pulls
      .listFiles({
        owner: owner,
        repo: repo,
        pull_number: pullRequest.number,
      })
      .then((res) => res.data);

    const mergeTargetFiles = await this.getAllFilesFromTree(
      owner,
      repo,
      mergeTarget.sha,
    );

    this.logger.log(
      featFiles.length +
        ' Files were changed in pull request number ' +
        pullRequest.number,
    );

    await this.dbService.savePullRequestDiff(repoId, {
      pullRequest: pullRequest,
      changedFiles: featFiles,
      repoFiles: mergeTargetFiles,
    });

    this.logger.log(`Diff for pull request ${pullRequest.number} was stored`);
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

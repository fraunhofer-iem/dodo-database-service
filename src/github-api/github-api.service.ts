import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from 'octokit';
import { DatabaseService } from 'src/database/database.service';
import { StatisticService } from 'src/database/statistic.service';
import { PullRequest, RepositoryFile } from './model/PullRequest';
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

  public async getTickets(repoIdent: RepositoryIdentifierDto) {
    this.processTickets(repoIdent.owner, repoIdent.repo, 'NULL', 1);
  }

  private async processTickets(
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
    for (const issue of issues) {
      if (issue.assignee != null && issue.assignees) {
        this.logger.log('issue');
        this.logger.log(issue);
        this.logger.log('issue assignee');

        this.logger.log(issue.assignee);
        this.logger.log(
          `We got ${issue.assignees.length} elements in the array`,
        );
        for (const assignee of issue.assignees) {
          this.logger.log('assignee in array: ');
          this.logger.log(assignee);
        }
      }
    }
    if (issues.length == 100) {
      this.processTickets(owner, repo, repoId, pageNumber + 1);
    }
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

    this.processPullRequests(repoIdent.owner, repoIdent.repo, repoId, 1);

    return repoId;
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

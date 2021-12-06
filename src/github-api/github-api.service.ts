import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from 'octokit';
import { DatabaseService } from 'src/database/database.service';
import { StatisticService } from 'src/database/statistic.service';
import { DeveloperFocus } from 'src/database/statistics/developerFocus.service';
import { PullRequest, RepositoryFile, Commit } from './model/PullRequest';
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
    private devFocus: DeveloperFocus,
  ) {
    // init octokit
    this.octokit = this.getOctokitClient();
  }

  public async printRateLimit() {
    const rateLimit = await this.octokit.request('GET /rate_limit');
    this.logger.log(rateLimit.data);
  }

  public async getStatistics(repoIdent: RepositoryNameDto) {
    // this.statisticService.getMostChangedFiles(repoIdent);
    // this.statisticService.getFilesChangedTogether(repoIdent);
    // this.statisticService.sizeOfPullRequest(repoIdent);
    // this.statisticService.numberOfAssignee(repoIdent);
    // this.statisticService.numberOfOpenTickets(repoIdent);
    // this.statisticService.avgNumberOfAssigneeUntilTicketCloses(repoIdent);
    // this.statisticService.avgTimeTillTicketWasAssigned(repoIdent);
    // this.statisticService.workInProgress(repoIdent);
    // this.statisticService.devSpreadTotal(repoIdent.owner);
    this.devFocus.devSpreadRepo(repoIdent);
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
    const issues = (
      await this.octokit.rest.issues
        .listForRepo({
          owner: owner,
          repo: repo,
          filter: 'assigned',
          state: 'all',
          per_page: 100,
          page: pageNumber,
        })
        .then((res) => res.data)
    ).filter((issue) => {
      return !('pull_request' in issue);
    });
    for (const issu of issues) {
      // first store issue
      const issuId = await this.dbService.saveIssue(
        issu, // TODO: workaround because the current label handling seems to be very broken and we ignore it for now
        repoId,
      );
      // then query the event types and store them
      await this.getAndStoreIssueEventTypes(
        owner,
        repo,
        issu.number,
        pageNumber,
        issuId,
      );
    }

    if (issues.length == 100) {
      this.processIssues(owner, repo, repoId, pageNumber + 1);
    }
  }

  private async getAndStoreIssueEventTypes(
    owner: string,
    repo: string,
    issueNumber: number,
    pageNumber: number,
    issueId: string,
  ) {
    const eventTypes = await this.octokit.rest.issues //see this later
      .listEvents({
        owner: owner,
        repo: repo,
        issue_number: issueNumber,
        per_page: 100,
        page: pageNumber,
      })
      .then((res) => res.data);

    await this.dbService.saveIssueEvent(eventTypes, issueId);

    if (eventTypes.length == 100) {
      await this.getAndStoreIssueEventTypes(
        owner,
        repo,
        issueNumber,
        pageNumber + 1,
        issueId,
      );
    }

    return true;
  }

  public async storeReleases(repoIdent: RepositoryNameDto) {
    this.logger.log(
      `querying releases for ${repoIdent.owner}/${repoIdent.repo}`,
    );
    this.processReleases(
      repoIdent.owner,
      repoIdent.repo,
      await this.dbService.getRepoByName(repoIdent.owner, repoIdent.repo),
      1,
    );
  }

  private async processReleases(
    owner: string,
    repo: string,
    repoId: string,
    pageNumber: number,
  ) {
    const releases = await this.octokit.rest.repos
      .listReleases({
        owner: owner,
        repo: repo,
        per_page: 100,
        page: pageNumber,
      })
      .then((res) => res.data);

    for (const release of releases) {
      await this.dbService.saveReleases(release, repoId);
    }
    if (releases.length == 100) {
      this.processReleases(owner, repo, repoId, pageNumber + 1);
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
      .then((r) => {
        return r.status;
      })
      .catch((r) => {
        this.logger.log(r);
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
      ` ${featFiles.length} Files were changed in pull request number 
        ${pullRequest.number}`,
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
      `The tree contains 
        ${baseTree.data.tree.length} 
        from which ${files.length}
        are files.`,
    );
    return files;
  }

  public async storeLanguages(repoIdent: RepositoryNameDto) {
    this.logger.log(
      `querying languages for ${repoIdent.owner}/${repoIdent.repo}`,
    );
    const languages = await this.octokit.rest.repos
      .listLanguages({
        owner: repoIdent.owner,
        repo: repoIdent.repo,
      })
      .then((res) => res.data); // what is the syntax and meaning of this?
    return await this.dbService.saveLanguages(repoIdent, languages);
    // await necassary for return value on request console. Why?
  }

  public async storeCommits(repoIdent: RepositoryNameDto) {
    if (!this.dbService.repoExists(repoIdent)) {
      await this.dbService.createRepo(repoIdent);
      this.logger.debug(
        `create repository for ${repoIdent.owner}/${repoIdent.repo} first`,
      );
      this.storeCommits(repoIdent);
    }
    this.logger.log(
      `querying commits with developer and timestamp for ${repoIdent.owner}/${repoIdent.repo}`,
    );
    const repoId = await this.dbService.getRepoByName(
      repoIdent.owner,
      repoIdent.repo,
    );
    const commits = await this.octokit.rest.repos
      .listCommits({
        owner: repoIdent.owner,
        repo: repoIdent.repo,
      })
      .then((res) => res.data);
    this.logger.debug(
      `saving commits from ${repoIdent.owner}/${repoIdent.repo} to database...`,
    );
    for (const commit of commits) {
      const commit_obj: Commit = {
        url: commit.commit.url,
        login: commit.committer.login,
        timestamp: commit.commit.committer.date,
      };
      await this.dbService.saveCommits(repoId, commit_obj);
    }
    this.logger.debug(
      `saved all commits from ${repoIdent.owner}/${repoIdent.repo} to database succesful`,
    );
  }
}

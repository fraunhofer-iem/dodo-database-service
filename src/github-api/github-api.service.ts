import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from 'octokit';
import { DatabaseService } from 'src/database/database.service';
import { StatisticService } from 'src/database/statistic.service';
import { DeveloperFocus } from 'src/database/statistics/developerFocus.service';
import { FaultCorrection } from 'src/database/statistics/faultCorrection.service';
import { FeatureCompletion } from 'src/database/statistics/featureCompletion.service';
import { SprintData } from './model/DevFocus';
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
    private faultCorrection: FaultCorrection,
    private featureCompletion: FeatureCompletion,
  ) {
    // init octokit
    this.octokit = this.getOctokitClient();
  }

  public async printRateLimit() {
    const rateLimit = await this.octokit.request('GET /rate_limit');
    this.logger.log(rateLimit.data);
  }

  public async getStatistics(repoIdent: RepositoryNameDto) {
    const testSprints: SprintData[] = [
      { begin: '08.02.21', end: '08.15.21', developers: ['gr2m', 'web-flow'] },
      { begin: '08.16.21', end: '08.29.21', developers: ['gr2m', 'web-flow'] },
      { begin: '07.05.21', end: '07.11.21', developers: ['gr2m'] },
      { begin: '09.20.21', end: '10.10.21', developers: ['web-flow'] },
    ];
    // this.statisticService.getMostChangedFiles(repoIdent);
    // this.statisticService.getFilesChangedTogether(repoIdent);
    // this.statisticService.sizeOfPullRequest(repoIdent);
    // this.statisticService.numberOfAssignee(repoIdent);
    // this.statisticService.numberOfOpenTickets(repoIdent);
    // this.statisticService.avgNumberOfAssigneeUntilTicketCloses(repoIdent);
    //this.statisticService.avgTimeTillTicketWasAssigned(repoIdent);
    //this.statisticService.workInProgress(repoIdent);
    // this.statisticService.timeToResolution(repoIdent);

    // this.statisticService.avgTimeTillTicketWasAssigned(repoIdent);
    //this.statisticService.workInProgress(repoIdent);
    // return await this.featureCompletion.featureCompletionCapability(repoIdent, [
    //   'feature',
    // ]);

    // return await this.faultCorrection.faultCorrectionRate(repoIdent, [
    //   'support',
    //   'awaiting response',
    // ]);
    // return await this.featureCompletion.featureCompletionRate(repoIdent, [
    //   'feature',
    // ]);
    //this.statisticService.faultCorrectionEfficiency(repoIdent);
    // this.statisticService.workInProgress(repoIdent);
    this.devFocus.devSpreadTotal(
      repoIdent.owner,
      undefined,
      undefined,
      testSprints,
      //   await this.orgaMembers(repoIdent.owner),
    );
    // this.devFocus.devSpreadRepo(
    //   repoIdent,
    // await this.orgaMembers(repoIdent.owner),
    // );
  }

  public async orgaMembers(owner: string) {
    // gather all orga members for the repo owner organization
    const { data: orgaMembers } = await this.octokit.rest.orgs.listMembers({
      org: owner,
    });
    // array for all orga member logins
    const orgaDevs: string[] = [];
    orgaMembers.forEach((member) => {
      orgaDevs.push(member.login);
    });
    return orgaDevs;
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
    for (const issue of issues) {
      // first store issue
      const issueId = await this.dbService.saveIssue(
        issue as any, // TODO: workaround because the current label handling seems to be very broken and we ignore it for now
        repoId,
      );
      // then query the event types and store them
      await this.getAndStoreIssueEventTypes(
        owner,
        repo,
        issue.number,
        pageNumber,
        issueId,
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
    return this.dbService.saveLanguages(repoIdent, languages);
    // await necassary for return value on request console. Why?
  }

  public async storeCommits(repoIdent: RepositoryNameDto) {
    if (!(await this.dbService.repoExists(repoIdent))) {
      this.logger.debug(
        `No such repo ${repoIdent.owner}/${repoIdent.repo} exists`,
      );
      return;
    }
    this.logger.log(
      `querying commits with developer and timestamp for ${repoIdent.owner}/${repoIdent.repo}`,
    );
    const repoId = await this.dbService.getRepoByName(
      repoIdent.owner,
      repoIdent.repo,
    );
    // gather all commits for the repo
    const { data: commits } = await this.octokit.rest.repos.listCommits({
      owner: repoIdent.owner,
      repo: repoIdent.repo,
    });

    this.logger.debug(
      `saving commits from ${repoIdent.owner}/${repoIdent.repo} to database...`,
    );

    for (const commit of commits) {
      const commit_obj: Commit = {
        url: commit.commit.url,
        login: commit.committer.login,
        timestamp: commit.commit.committer.date,
      };
      await this.dbService.saveCommit(repoId, commit_obj);
    }
    this.logger.debug(
      `saved all commits from ${repoIdent.owner}/${repoIdent.repo} to database succesful`,
    );
  }
}

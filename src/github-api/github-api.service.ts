import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from 'octokit';
import { DatabaseService } from 'src/database/database.service';
import { DeveloperFocus } from 'src/database/statistics/developerFocus.service';

import { Commit } from './model/PullRequest';
import { RepositoryNameDto } from './model/Repository';

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
    this.devFocus.devSpreadRepo(repoIdent);
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
        `Repo ${repoIdent.owner}/${repoIdent.repo} does not exist`,
      );
      return;
    }
    this.logger.log(
      `Retrieving commits of repo ${repoIdent.owner}/${repoIdent.repo}`,
    );
    const repoId = await this.dbService.getRepoByName(
      repoIdent.owner,
      repoIdent.repo,
    );
    await this.processCommits(repoIdent.owner, repoIdent.repo, repoId, 1);
  }

  private async processCommits(
    owner: string,
    repo: string,
    repoId: string,
    pageNumber: number,
  ) {
    const { data: commits } = await this.octokit.rest.repos.listCommits({
      owner: owner,
      repo: repo,
      per_page: 100,
      page: pageNumber,
    });
    for (const commit of commits) {
      const commitDocument: Commit = {
        url: commit.commit.url,
        login: commit.commit.author.email,
        timestamp: commit.commit.author.date,
      };
      await this.dbService.saveCommit(repoId, commitDocument);
    }

    if (commits.length == 100) {
      this.processCommits(owner, repo, repoId, pageNumber + 1);
    }
  }
}

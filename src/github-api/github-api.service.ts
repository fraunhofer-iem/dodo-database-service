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

  // public async storeLanguages(repoIdent: RepositoryNameDto) {
  //   this.logger.log(
  //     `querying languages for ${repoIdent.owner}/${repoIdent.repo}`,
  //   );
  //   const languages = await this.octokit.rest.repos
  //     .listLanguages({
  //       owner: repoIdent.owner,
  //       repo: repoIdent.repo,
  //     })
  //     .then((res) => res.data); // what is the syntax and meaning of this?
  //   return this.dbService.saveLanguages(repoIdent, languages);
  //   // await necassary for return value on request console. Why?
  // }
}

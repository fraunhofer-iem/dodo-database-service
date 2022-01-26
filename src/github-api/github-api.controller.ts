import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { GithubApiService } from './github-api.service';
import { RepositoryNameDto } from './model/Repository';

@Controller('github-api')
export class GithubApiController {
  private readonly logger = new Logger(GithubApiController.name);
  constructor(private ghApiService: GithubApiService) {}

  @Post('diffs')
  @ApiOkResponse({
    description: 'The id of the repository in which the data is stored.',
  })
  async gatherPullRequestDiffs(@Body() repoIdent: RepositoryNameDto) {
    //TODO:  return a request id and enable to query updates for the running request
    // in order to not have polling we can just introduce a websocket here
    // return this.ghApiService.storePullRequestDiffsForRepo(repoIdent);
  }

  @Post('releases')
  async gatherReleases(@Body() repoIdent: RepositoryNameDto) {
    return this.ghApiService.storeReleases(repoIdent);
  }

  @Post('statistics')
  async pullRequestDiffsStatistic(@Body() repoName: RepositoryNameDto) {
    return this.ghApiService.getStatistics(repoName);
  }

  @Post('issues')
  async gatherTickets(@Body() repoIdent: RepositoryNameDto) {
    return this.ghApiService.storeIssues(repoIdent);
  }

  @Post('languages')
  async gatherLanguages(@Body() repoIdent: RepositoryNameDto) {
    return this.ghApiService.storeLanguages(repoIdent);
  }

  @Post('commits')
  async gatherCommits(@Body() repoIdent: RepositoryNameDto) {
    return this.ghApiService.storeCommits(repoIdent);
  }
}

import { Body, Controller, Logger, Post } from '@nestjs/common';

import { GithubApiService } from './github-api.service';
import { RepositoryNameDto } from './model/Repository';

@Controller('github-api')
export class GithubApiController {
  private readonly logger = new Logger(GithubApiController.name);
  constructor(private ghApiService: GithubApiService) {}

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

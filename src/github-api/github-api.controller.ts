import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { GithubApiService } from './github-api.service';
import { CreateRepositoryDto, RepositoryNameDto } from './model/Repository';
import { ValidationService } from './validation.service';

@Controller('github-api')
export class GithubApiController {
  private readonly logger = new Logger(GithubApiController.name);
  constructor(
    private ghApiService: GithubApiService,
    private validationService: ValidationService,
  ) {}

  @Post('repo/create')
  async createRepo(@Body() createRepoDto: CreateRepositoryDto) {
    if (
      this.validationService.verify(
        await this.ghApiService.getStatus(createRepoDto),
      )
    )
      return this.ghApiService.createRepo(createRepoDto);
  }

  @Post('diffs')
  @ApiOkResponse({
    description: 'The id of the repository in which the data is stored.',
  })
  async gatherPullRequestDiffs(
    @Body() repoIdent: RepositoryNameDto,
  ): Promise<string> {
    //TODO:  return a request id and enable to query updates for the running request
    // in order to not have polling we can just introduce a websocket here

    return this.ghApiService.storePullRequestDiffsForRepo(repoIdent);
  }

  @Post('statistics')
  async pullRequestDiffsStatistic(@Body() repoName: RepositoryNameDto) {
    return this.ghApiService.getStatistics(repoName);
  }

  @Post('issues')
  async gatherTickets(@Body() repoIdent: RepositoryNameDto,) {
    return this.ghApiService.storeIssues(repoIdent);
  }
}
import { Body, Controller, Logger, Post } from '@nestjs/common';
import { GithubApiService } from './github-api.service';
import { RepositoryIdentifierDto } from './model/RepositoryIdentifierDto';
import { ValidationService } from './validation.service';

@Controller('github-api')
export class GithubApiController {
  private readonly logger = new Logger(GithubApiController.name);
  constructor(
    private ghApiService: GithubApiService,
    private validationService: ValidationService,
  ) {}

  @Post('diffs')
  async gatherPullRequestDiffs(@Body() repoIdent: RepositoryIdentifierDto) {
    //TODO:  return a request id and enable to query updates for the running request
    // in order to not have polling we can just introduce a websocket here
    if (await this.validationService.verify(repoIdent)) {
      return this.ghApiService.storePullRequestDiffsForRepo(repoIdent);
    }
  }

  @Post('statistics')
  async pullRequestDiffsStatistic(
    @Body() createPullRequestDataDto: RepositoryIdentifierDto,
  ) {
    return this.ghApiService.getStatistics(createPullRequestDataDto);
  }

  @Post('tickets')
  async gatherTickets(@Body() repoIdent: RepositoryIdentifierDto) {
    if (await this.validationService.verify(repoIdent)) {
      return this.ghApiService.getTickets(repoIdent);
    }
  }
}

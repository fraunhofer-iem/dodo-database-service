import { Body, Controller, Post } from '@nestjs/common';
import { GithubApiService } from './github-api.service';
import { RepositoryIdentifierDto } from './model/RepositoryIdentifierDto';

@Controller('github-api')
export class GithubApiController {
  constructor(private ghApiService: GithubApiService) {}

  @Post('diffs')
  async gatherPullRequestDiffs(
    @Body() createPullRequestDataDto: RepositoryIdentifierDto,
  ) {
    //TODO:  return a request id and enable to query updates for the running request
    // in order to not have polling we can just introduce a websocket here
    return this.ghApiService.storePullRequestDiffsForRepo(
      createPullRequestDataDto,
    );
  }

  @Post('statistics')
  async pullRequestDiffsStatistic(
    @Body() createPullRequestDataDto: RepositoryIdentifierDto,
  ) {
    return this.ghApiService.getStatistics(createPullRequestDataDto);
  }

  @Post('tickets')
  async gatherTickets(
    @Body() createPullRequestDataDto: RepositoryIdentifierDto,
  ) {
    return this.ghApiService.getTickets(createPullRequestDataDto);
  }
}

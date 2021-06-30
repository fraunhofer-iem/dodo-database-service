import { Body, Controller, Post } from '@nestjs/common';
import { GithubApiService } from './github-api.service';
import { CreatePullRequestDataDto } from './model/CreatePullRequestDataDto';

@Controller('github-api')
export class GithubApiController {
  constructor(private ghApiService: GithubApiService) {}

  @Post()
  async gatherPullRequestDiffs(
    @Body() createPullRequestDataDto: CreatePullRequestDataDto,
  ) {
    this.ghApiService.getDiffFromAllPullRequests(
      createPullRequestDataDto.owner,
      createPullRequestDataDto.repo,
    );
    //TODO:  return a request id and enable to query updates for the running request
    // in order to not have polling we can just introduce a websocket here
    return 42;
  }
}

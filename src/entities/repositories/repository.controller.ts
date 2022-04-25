import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { repoExists } from './lib';
import { CreateRepositoryDto } from './model';
import { RepositoryService } from './repository.service';

@Controller('api/repositories')
export class RepositoryController {
  private readonly logger = new Logger(RepositoryController.name);

  constructor(private repoService: RepositoryService) {}

  @Get()
  async getRepos() {
    this.logger.log('Get all repositories request from user XXX');
    const pipeline = this.repoService.preAggregate({}, {});
    pipeline.addFields({
      name: '$repo',
    });
    pipeline.project({
      _id: 0,
      __v: 0,
      repo: 0,
    });
    return pipeline.exec();
  }

  @Post()
  async createRepo(@Body() createRepositoryDto: CreateRepositoryDto) {
    this.logger.log(
      `Creating entry for owner ${createRepositoryDto.owner} and repository ${createRepositoryDto.repo}`,
    );
    if (repoExists(createRepositoryDto)) {
      return this.repoService.initializeRepository(createRepositoryDto);
    }
  }

  @Get(':owner/:repo/kpis')
  async getRepoKpis(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('since') since: string,
    @Param('to') to: string,
  ) {}

  @Get(':owner/:repo/kpis/:kpi')
  async getRepoKpi(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('kpi') kpi: string,
  ) {
    // return this.kpiService.read({ id: kpi });
  }

  @Get(':id/trends')
  async getRepoTrend(@Param('id') id: string) {
    this.logger.log(`Received query for repository trend with id ${id}`);
  }
}

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
    const repos = await pipeline.exec();
    for (let i = 0; i < repos.length; i++) {
      const repo = repos[i];
      repos[i] = await this.getRepo(repo.owner, repo.repo);
    }
    return repos;
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

  @Get(':owner/:repo')
  async getRepo(@Param('owner') owner: string, @Param('repo') repo: string) {
    this.logger.log(`Received query for repository with id ${owner}/${repo}`);
    const pipeline = this.repoService.preAggregate({ owner, repo }, {});
    pipeline.addFields({
      id: { $concat: ['$owner', '/', '$repo'] },
      name: '$repo',
      url: { $concat: ['https://github.com/', '$owner', '/', '$repo'] },
      maturityIndex: 75,
      kpis: ['icr', 'icc', 'ice', 'devSpread', 'releaseCycle', 'coc', 'mttr'],
    });
    pipeline.project({
      _id: 0,
      __v: 0,
      repo: 0,
    });
    const [repository] = await pipeline.exec();

    return repository;
  }

  @Get(':id/trends')
  async getRepoTrend(@Param('id') id: string) {
    this.logger.log(`Received query for repository trend with id ${id}`);
  }
}

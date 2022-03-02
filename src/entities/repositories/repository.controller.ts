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

  @Get(':id')
  async getRepo(@Param('id') id: string) {
    this.logger.log(`Received query for repository with id ${id}`);
    return this.repoService.getRepositoryById(id);
  }

  @Get(':id/trends')
  async getRepoTrend(@Param('id') id: string) {
    this.logger.log(`Received query for repository trend with id ${id}`);
  }
}

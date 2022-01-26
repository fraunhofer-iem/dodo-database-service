import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { CreateRepositoryDto } from './RepositoryDtos';

@Controller('api/repositories')
export class RepositoryController {
  private readonly logger = new Logger(RepositoryController.name);

  @Get()
  async getRepos() {
    this.logger.log('Get all repositories request from user XXX');
  }

  @Post()
  async createRepo(@Body() createRepositoryDto: CreateRepositoryDto) {
    this.logger.log(
      `Creating entry for owner ${createRepositoryDto.owner} and repository ${createRepositoryDto.repository}`,
    );
  }

  @Get(':id')
  async getRepo(@Param('id') id: string) {
    this.logger.log(`Received query for repository with id ${id}`);
  }

  @Get(':id/trends')
  async getRepoTrend(@Param('id') id: string) {
    this.logger.log(`Received query for repository trend with id ${id}`);
  }
}

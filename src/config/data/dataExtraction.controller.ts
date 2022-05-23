import { Body, Controller, Logger, Post } from '@nestjs/common';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { DodoUserService } from '../users/dodoUser.service';
import { DodoUser } from '../users/model/schemas';
import { DataExtractionService } from './dataExtraction.service';

@Controller('api/config/data')
export class DataExtractionController {
  private readonly logger = new Logger(DataExtractionController.name);

  constructor(
    private userService: DodoUserService,
    private repositoryService: RepositoryService,
    private extractionService: DataExtractionService,
  ) {}

  @Post()
  async extract(@Body() user: Omit<DodoUser, 'name'>) {
    try {
      const pipeline = this.userService.preAggregate(
        { email: user.email },
        { targets: user.targets },
      );
      const currentUser = (await pipeline.exec())[0];
      for (const target of currentUser.targets) {
        this.logger.log(`Extracting data of ${target.owner}/${target.repo}`);
        const repo = await this.repositoryService.readOrCreate(target);
        await this.extractionService.extractIssues(repo, target);
        await this.extractionService.extractCommits(repo, target);
        await this.extractionService.extractReleases(repo, target);
        await this.extractionService.extractDiffs(repo, target);
      }
    } catch (e) {
      console.log(e);
    }
  }
}
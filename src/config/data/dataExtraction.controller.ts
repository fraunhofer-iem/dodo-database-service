import { Body, Controller, Logger, Post } from '@nestjs/common';
import { RepositoryService } from '../../entities/repositories/repository.service';
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
      // console.log(user.email);
      // console.log(user.targets);
      // const pipeline = this.userService.preAggregate(
      //   { email: user.email },
      //   { targets: user.targets },
      // );
      // const currentUser = (await pipeline.exec())[0];
      // console.log(currentUser);
      const currentUser = {
        targets: [{ owner: 'corona-warn-app', repo: 'cwa-app-android' }],
        // targets: [{ owner: 'fraunhofer-iem', repo: 'dodo-database-service' }],
      };
      for (const target of currentUser.targets) {
        this.logger.log(`Extracting data of ${target.owner}/${target.repo}`);
        const repo = await this.repositoryService.readOrCreate(target);
        // await this.extractionService.extractIssues(repo, target);
        // await this.extractionService.extractTagsAsReleases(repo, target);
        await this.extractionService.extractReleases(repo, target);
        await this.extractionService.extractCommits(repo, target);
        // await this.extractionService.extractDiffs(repo, target);
        await this.extractionService.deleteEmptyReleases(repo, target);
        await this.extractionService.deleteEmptyReleasesFromRepoDocument(
          repo,
          target,
        );
      }
    } catch (e) {
      this.logger.debug('Outer Error');
      this.logger.error(e);
    }
  }
}

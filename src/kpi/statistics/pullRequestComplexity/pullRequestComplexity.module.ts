import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { PullRequestComplexityService } from './pullRequestComponents.service';

@Module({
  providers: [PullRequestComplexityService],
  imports: [RepositoryModule],
  exports: [PullRequestComplexityService],
  controllers: [],
})
export class PullRequestComplexityModule {}

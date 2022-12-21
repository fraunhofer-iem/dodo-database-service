import { Module } from '@nestjs/common';
import { IssueModule } from '../../../entities/issues/issue.module';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { ReleaseCycleModule } from '../releaseCycles/releaseCycle.module';
import { MeanTimeToResolutionService } from './meanTimeToResolution.service';

@Module({
  providers: [MeanTimeToResolutionService],
  imports: [RepositoryModule, IssueModule, ReleaseCycleModule],
  exports: [MeanTimeToResolutionService],
  controllers: [],
})
export class MeanTimeToResolutionModule {}

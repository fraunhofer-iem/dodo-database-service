import { Module } from '@nestjs/common';
import { IssueModule } from '../../../entities/issues/issue.module';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { MeanTimeToResolutionService } from './meanTimeToResolution.service';

@Module({
  providers: [MeanTimeToResolutionService],
  imports: [RepositoryModule, IssueModule],
  exports: [MeanTimeToResolutionService],
  controllers: [],
})
export class MeanTimeToResolutionModule {}

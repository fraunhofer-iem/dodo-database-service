import { Module } from '@nestjs/common';
import { IssueModule } from 'src/entities/issues/issue.module';
import { RepositoryModule } from 'src/entities/repositories/repository.module';
import { MeanTimeToResolutionService } from './meanTimeToResolution.service';

@Module({
  providers: [MeanTimeToResolutionService],
  imports: [RepositoryModule, IssueModule],
  exports: [MeanTimeToResolutionService],
  controllers: [],
})
export class MeanTimeToResolutionModule {}

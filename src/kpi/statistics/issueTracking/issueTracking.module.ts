import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { IssueTrackingService } from './issueTracking.service';

@Module({
  providers: [IssueTrackingService],
  imports: [RepositoryModule],
  exports: [IssueTrackingService],
  controllers: [],
})
export class IssueTrackingModule {}

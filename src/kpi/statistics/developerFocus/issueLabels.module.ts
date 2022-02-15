import { Module } from '@nestjs/common';
import { RepositoryModule } from 'src/entities/repositories/repository.module';
import { IssueLabels } from './issueLabels.service';

@Module({
  providers: [IssueLabels],
  imports: [RepositoryModule],
  exports: [IssueLabels],
  controllers: [],
})
export class IssueLabelsModule {}

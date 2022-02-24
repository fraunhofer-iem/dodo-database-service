import { Module } from '@nestjs/common';
import { RepositoryModule } from 'src/entities/repositories/repository.module';
import { TimeToResolution } from './meanTimeToResolution.service';

@Module({
  providers: [TimeToResolution],
  imports: [RepositoryModule],
  exports: [TimeToResolution],
  controllers: [],
})
export class IssueLabelsModule {}

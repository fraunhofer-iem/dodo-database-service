import { Module } from '@nestjs/common';
import { CommitModule } from 'src/entities/commits/commit.module';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { DeveloperSpreadService } from './developerSpread.service';

@Module({
  providers: [DeveloperSpreadService],
  imports: [RepositoryModule, CommitModule],
  exports: [DeveloperSpreadService],
})
export class DeveloperSpreadModule {}

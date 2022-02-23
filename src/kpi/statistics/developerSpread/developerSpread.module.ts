import { Module } from '@nestjs/common';
import { DeveloperSpreadService } from './developerSpread.service';
import { UserModule } from '../../../entities/users/user.module';
import { CommitModule } from '../../../entities/commits/commit.module';
import { RepositoryModule } from 'src/entities/repositories/repository.module';

@Module({
  providers: [DeveloperSpreadService],
  imports: [UserModule, CommitModule, RepositoryModule],
  exports: [DeveloperSpreadService],
})
export class DeveloperSpreadModule {}

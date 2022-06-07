import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { DeveloperSpreadService } from './developerSpread.service';

@Module({
  providers: [DeveloperSpreadService],
  imports: [RepositoryModule],
  exports: [DeveloperSpreadService],
})
export class DeveloperSpreadModule {}

import { Module } from '@nestjs/common';
import { DeveloperSpreadService } from './developerSpread.service';
import { RepositoryModule } from 'src/entities/repositories/repository.module';

@Module({
  providers: [DeveloperSpreadService],
  imports: [RepositoryModule],
  exports: [DeveloperSpreadService],
})
export class DeveloperSpreadModule {}
